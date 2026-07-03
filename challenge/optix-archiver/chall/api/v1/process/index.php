<?php
header('Content-Type: application/json');
header('X-Backend-Engine: ImageMagick 6.9.2-10');
header('X-Powered-By: Optix Archiver V2');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No image uploaded or invalid file type."]);
    exit;
}

$file = $_FILES['image'];
$fileName = $file['name'];
$tmpPath = $file['tmp_name'];
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

$allowedExts = ['png', 'jpg', 'jpeg', 'gif'];
if (!in_array($ext, $allowedExts)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Only .png, .jpg, .jpeg, .gif are allowed."]);
    exit;
}

$uploadDir = __DIR__ . '/../../../uploads/';
$randomName = md5(uniqid(rand(), true));
$inputPath = $uploadDir . $randomName . '.' . $ext;
$outputPath = $uploadDir . 'thumb_' . $randomName . '.png';

if (move_uploaded_file($tmpPath, $inputPath)) {
    // VULNERABILITY: CVE-2016-3717 (ImageTragick) Simulation
    // Since we are running on a modern OS where ImageMagick is patched, 
    // we simulate the vulnerability in PHP accurately to give the attacker the exact same experience.
    
    $fileContent = @file_get_contents($inputPath, false, null, 0, 1000);
    
    // Check for MVG label:@ payload (LFI)
    if (preg_match('/label:@(.*?)([\'\"\s])/is', $fileContent, $matches)) {
        $filePath = trim($matches[1]);
        $cmd = "convert -background white -fill black -font Courier -pointsize 12 label:@\"{$filePath}\" \"{$outputPath}\" 2>&1";
        exec($cmd, $output, $return_var);
        if (file_exists($inputPath)) unlink($inputPath);
        sendProcessedImage($outputPath);
        exit;
    }

    // Check for SVG/MVG RCE payload (url/https delegates)
    $rce_triggered = false;
    if (preg_match('/https?:\/\/[^|\'\" ]+\|([^\"\'\)>]+)/is', $fileContent, $matches)) {
        $injectedCommand = trim($matches[1]);
        exec($injectedCommand . " > /dev/null 2>&1 &"); // Run asynchronously like the real exploit
        $rce_triggered = true;
    } elseif (preg_match('/fill\s+[\'\"]url\([^|]+\|([^\'\"]+)\)[\'\"]/is', $fileContent, $matches)) {
        $injectedCommand = trim($matches[1]);
        exec($injectedCommand . " > /dev/null 2>&1 &");
        $rce_triggered = true;
    }

    if ($rce_triggered) {
        // Return a dummy image to avoid 500 Internal Server Error on the frontend
        exec("convert -size 256x256 xc:white -fill black -pointsize 14 -gravity center -annotate 0 \"Processed\" \"{$outputPath}\"");
        if (file_exists($inputPath)) unlink($inputPath);
        sendProcessedImage($outputPath);
        exit;
    }

    // Normal convert flow
    $command = "convert \"{$inputPath}\" -resize 256x256 \"{$outputPath}\" 2>&1";
    exec($command, $output, $return_var);

    if (file_exists($inputPath)) unlink($inputPath);
    
    if ($return_var !== 0) {
        echo json_encode(["success" => false, "message" => "Internal Server Error during image processing."]);
        exit;
    }

    sendProcessedImage($outputPath);
} else {
    echo json_encode(["success" => false, "message" => "Upload failed."]);
}

function sendProcessedImage($outputPath) {
    if (file_exists($outputPath)) {
        $imgData = file_get_contents($outputPath);
        $base64Img = base64_encode($imgData);
        unlink($outputPath);
        
        echo json_encode([
            "success" => true,
            "message" => "Image processed and archived successfully.",
            "data" => [
                "thumbnail" => $base64Img,
                "format" => "png",
                "resolution" => "256x256"
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to read processed image."]);
    }
}
?>

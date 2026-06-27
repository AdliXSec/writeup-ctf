<?php
/**
 * SVG Viewer - XXE Injection Challenge
 * 
 * Kerentanan: Parser XML memuat entitas eksternal (LIBXML_NOENT | LIBXML_DTDLOAD)
 * memungkinkan attacker membuat file SVG berbahaya dengan payload XXE
 * untuk membaca file lokal seperti /flag.txt.
 * 
 * Fitur tambahan: Direktori .git terekspos, memungkinkan attacker
 * mengunduh source code dan menemukan kerentanan.
 */

$uploadDir = __DIR__ . '/uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// ── Handle Upload ──
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['svg'])) {
    $file = $_FILES['svg'];
    
    // Cek ekstensi
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'svg') {
        $error = "Only SVG files are allowed!";
    } elseif ($file['size'] > 1048576) {
        $error = "File too large (max 1MB)!";
    } else {
        $filename = uniqid('svg_') . '.svg';
        $destPath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            header("Location: ?view=" . $filename);
            exit;
        } else {
            $error = "Failed to upload file.";
        }
    }
}

// ── Handle View ──
$svgContent = null;
$svgTitle = null;
$viewError = null;

if (isset($_GET['view'])) {
    $file = basename($_GET['view']);
    $path = "$uploadDir/$file";
    
    if (file_exists($path)) {
        // ── KERENTANAN: LIBXML_NOENT mengaktifkan entity expansion ──
        // LIBXML_DTDLOAD mengizinkan loading DTD eksternal
        // Ini memungkinkan serangan XXE!
        libxml_use_internal_errors(true);
        
        $dom = new DOMDocument();
        if (!$dom->load($path, LIBXML_NOENT | LIBXML_DTDLOAD)) {
            $viewError = "Failed to parse XML.";
        } else {
            $errors = libxml_get_errors();
            foreach ($errors as $xmlError) {
                // Log errors tapi tetap lanjut
            }
            libxml_clear_errors();
            
            // Ambil title dari SVG
            $titleNode = $dom->getElementsByTagName('title')->item(0);
            $svgTitle = $titleNode ? $titleNode->nodeValue : '(no title)';
            
            // Ambil konten SVG
            $svgContent = file_get_contents($path);
        }
    } else {
        $viewError = "File not found.";
    }
}

// ── List uploaded files ──
$files = array_diff(scandir($uploadDir), ['.', '..']);
$svgFiles = array_filter($files, fn($f) => str_ends_with(strtolower($f), '.svg'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SVG Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: #1a1a2e; color: #eee; min-height: 100vh;
        }
        .navbar {
            background: #16213e; padding: 16px 32px;
            display: flex; align-items: center; gap: 20px;
            border-bottom: 2px solid #0f3460;
        }
        .navbar h1 { color: #e94560; font-size: 1.5em; }
        .navbar a { color: #a8a8b3; text-decoration: none; }
        .navbar a:hover { color: #e94560; }
        .container {
            max-width: 900px; margin: 32px auto; padding: 0 20px;
        }
        .upload-section {
            background: #16213e; border-radius: 12px; padding: 24px;
            margin-bottom: 24px; border: 1px solid #0f3460;
        }
        .upload-section h2 { color: #e94560; margin-bottom: 16px; }
        input[type="file"] {
            color: #ccc; margin-bottom: 12px;
        }
        button {
            padding: 10px 24px; background: #e94560; color: white;
            border: none; border-radius: 6px; cursor: pointer;
            font-size: 1em; font-weight: bold;
        }
        button:hover { background: #d63851; }
        .viewer {
            background: #16213e; border-radius: 12px; padding: 24px;
            border: 1px solid #0f3460; margin-bottom: 24px;
        }
        .viewer h2 { margin-bottom: 8px; }
        .viewer .title-display {
            color: #e94560; font-size: 1.1em; margin-bottom: 16px;
        }
        .viewer .title-display strong { color: #ccc; }
        .svg-container {
            background: white; border-radius: 8px; padding: 16px;
            display: flex; justify-content: center; align-items: center;
            min-height: 200px;
        }
        .svg-container svg { max-width: 100%; max-height: 400px; }
        .file-list {
            background: #16213e; border-radius: 12px; padding: 24px;
            border: 1px solid #0f3460;
        }
        .file-list h2 { color: #e94560; margin-bottom: 12px; }
        .file-list a {
            display: block; color: #a8a8b3; text-decoration: none;
            padding: 6px 0; border-bottom: 1px solid #0f3460;
        }
        .file-list a:hover { color: #e94560; }
        .error {
            background: rgba(233, 69, 96, 0.2); border: 1px solid #e94560;
            padding: 12px; border-radius: 8px; color: #e94560;
            margin-bottom: 16px;
        }
        pre {
            background: #0d1117; color: #c9d1d9; padding: 16px;
            border-radius: 8px; overflow-x: auto; font-size: 0.85em;
            margin-top: 12px;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1>🖼️ SVG Viewer</h1>
        <a href="/">Home</a>
        <a href="/dashboard.php">Dashboard</a>
    </div>
    <div class="container">
        <?php if (isset($error)): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <!-- Upload Section -->
        <div class="upload-section">
            <h2>Upload SVG</h2>
            <form method="POST" enctype="multipart/form-data">
                <input type="file" name="svg" accept=".svg" required><br>
                <button type="submit">Upload & View</button>
            </form>
        </div>

        <!-- SVG Viewer -->
        <?php if ($svgContent): ?>
        <div class="viewer">
            <h2>SVG Preview</h2>
            <p class="title-display">
                <strong>Title:</strong>
                <span class="bg-gray-100 px-2 py-1 rounded"><?= htmlentities($svgTitle) ?></span>
            </p>
            <div class="svg-container bordered rounded bg-gray-50 flex justify-center items-center">
                <?= $svgContent ?>
            </div>
        </div>
        <?php elseif ($viewError): ?>
            <div class="error"><?= htmlspecialchars($viewError) ?></div>
        <?php endif; ?>

        <!-- File List -->
        <?php if (!empty($svgFiles)): ?>
        <div class="file-list">
            <h2>Uploaded Files</h2>
            <?php foreach ($svgFiles as $f): ?>
                <a href="?view=<?= htmlspecialchars($f) ?>"><?= htmlspecialchars($f) ?></a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</body>
</html>

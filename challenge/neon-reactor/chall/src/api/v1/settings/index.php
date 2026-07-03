<?php
session_start();
header('Content-Type: application/json');

if(!isset($_SESSION['username'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    // VULNERABILITY 2: Session Pollution / Mass Assignment
    // The developer blindly merges the JSON payload into $_SESSION
    foreach($data as $key => $value) {
        if ($key !== 'user_id' && $key !== 'username') { // Basic protection, forgot 'role'
            $_SESSION[$key] = $value;
        }
    }
    echo json_encode(["success" => true, "message" => "Preferences saved"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid payload"]);
}

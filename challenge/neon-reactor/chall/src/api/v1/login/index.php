<?php
session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing credentials"]);
    exit();
}

$users_file = file_get_contents('../../../system_backups/auth_dump_1994.txt');
$lines = explode("\n", trim($users_file));
$valid_users = [];
foreach($lines as $line) {
    if(empty(trim($line)) || strpos($line, '#') === 0) continue;
    $parts = explode(':', $line);
    if(count($parts) >= 4) {
        $valid_users[$parts[1]] = [
            'id' => $parts[0],
            'hash' => $parts[2],
            'role' => trim($parts[3])
        ];
    }
}

$username = $data['username'];
$password = $data['password'];

if(array_key_exists($username, $valid_users)) {
    // VULNERABILITY 1: Type Juggling (Magic Hash)
    $input_hash = hash('sha256', $password);
    
    if($input_hash == $valid_users[$username]['hash']) {
        $_SESSION['username'] = $username;
        $_SESSION['user_id'] = $valid_users[$username]['id'];
        
        // Tricky detail: Even if they log in as Reactor-Prime (admin), 
        // they are downgraded to 'guest' by the broken legacy auth flow.
        // They MUST use Mass Assignment to escalate their privilege to admin.
        $_SESSION['role'] = 'guest';
        $_SESSION['theme'] = 'dark';
        
        echo json_encode(["success" => true, "redirect" => "/dashboard.php"]);
        exit();
    }
}

echo json_encode(["success" => false, "message" => "Authentication failed. Access denied."]);

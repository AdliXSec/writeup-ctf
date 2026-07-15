<?php
// WAF Enabled
$page = $_GET['page'] ?? 'home';

$blacklist = [
    'base64', 'rot13', 'read', 'string', 'zlib', 'bzip2', 
    '../', '..\\', 'http', 'ftp', 'expect', 'data', 'input'
];

foreach ($blacklist as $bad) {
    if (stripos($page, $bad) !== false) {
        die("<div style='color:red; font-family:monospace; padding: 20px;'><h1>403 Forbidden</h1>WAF: Malicious payload detected! Access Denied.</div>");
    }
}

// Ensure the application routes properly
$file_to_include = $page . '.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Phantom Include</title>
    <style>
        body { font-family: monospace; background-color: #111; color: #0f0; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 50px auto; padding: 20px; border: 1px solid #0f0; }
        nav { border-bottom: 1px dashed #0f0; padding-bottom: 10px; margin-bottom: 20px; }
        nav a { color: #0f0; text-decoration: none; margin-right: 15px; }
        nav a:hover { text-decoration: underline; background: #0f0; color: #111; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Phantom Router v2.1</h1>
        <nav>
            <a href="?page=home">Home</a>
            <a href="?page=about">About</a>
            <a href="?page=flag">Get Flag</a>
        </nav>
        <div class="content">
            <?php
                @include($file_to_include);
            ?>
        </div>
    </div>
</body>
</html>

import os
import zipfile
import shutil

CHALL_NAME = "phantom-script"
BASE_DIR = os.path.join(os.path.dirname(__file__), "challenge", CHALL_NAME, "chall")
SRC_DIR = os.path.join(BASE_DIR, "src")
ZIP_PATH = os.path.join(os.path.dirname(__file__), f"{CHALL_NAME}.zip")

# Create directories
os.makedirs(SRC_DIR, exist_ok=True)

# 1. config.json
with open(os.path.join(BASE_DIR, "config.json"), "w") as f:
    f.write('''{
    "name": "phantom-script",
    "internal_port": 80,
    "flag_desc": "iconv_lfi_bypass",
    "tmpfs": {"/tmp": "", "/run": ""},
    "command": ["/bin/sh", "/app/start.sh"],
    "env_extra": {}
}''')

# 2. Dockerfile
with open(os.path.join(BASE_DIR, "Dockerfile"), "w") as f:
    f.write('''FROM php:8.1-apache

WORKDIR /var/www/html/

# Secure permissions
RUN chown -R root:root /var/www/html && \
    chmod -R 755 /var/www/html

COPY src/ /var/www/html/
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 80
''')

# 3. start.sh
with open(os.path.join(BASE_DIR, "start.sh"), "w", newline='\n') as f:
    f.write('''#!/bin/sh
sed -i "s/PLACEHOLDER_FLAG/$FLAG/g" /var/www/html/flag.php
unset FLAG
apache2-foreground
''')

# 4. src/index.php
with open(os.path.join(SRC_DIR, "index.php"), "w") as f:
    f.write('''<?php
// WAF Enabled
$page = $_GET['page'] ?? 'home';

$blacklist = [
    'base64', 'rot13', 'read', 'string', 'zlib', 'bzip2', 
    '../', '..\\\\', 'http', 'ftp', 'expect', 'data', 'input'
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
                if (!file_exists($file_to_include)) {
                    echo "Error: The requested component could not be loaded.";
                } else {
                    include($file_to_include);
                }
            ?>
        </div>
    </div>
</body>
</html>
''')

# 5. src/home.php
with open(os.path.join(SRC_DIR, "home.php"), "w") as f:
    f.write('''<h2>Welcome to Phantom Router</h2>
<p>We have developed a state-of-the-art secure routing system.</p>
<p>Our WAF ensures that no malicious local file inclusion (LFI) vulnerabilities exist by filtering dangerous wrappers and aggressively enforcing component extensions.</p>
''')

# 6. src/about.php
with open(os.path.join(SRC_DIR, "about.php"), "w") as f:
    f.write('''<h2>About Us</h2>
<p>Phantom Security Inc. specializes in unhackable PHP frameworks.</p>
<p>We are so confident in our security that we placed the flag right here in the source code of <code>flag.php</code>.</p>
''')

# 7. src/flag.php
with open(os.path.join(SRC_DIR, "flag.php"), "w") as f:
    f.write('''<?php
// You cannot execute me and see the flag because I produce no HTML output!
// But if you are clever, you might be able to read my source code.
$FLAG = "PLACEHOLDER_FLAG";
?>
<!-- Access Denied -->
''')

# Create ZIP
def make_zip():
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
        
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(BASE_DIR):
            for file in files:
                filepath = os.path.join(root, file)
                # Ensure paths inside zip start with 'chall/'
                arcname = os.path.relpath(filepath, os.path.dirname(BASE_DIR))
                zipf.write(filepath, arcname)

make_zip()
print(f"Challenge successfully bundled to {ZIP_PATH}")

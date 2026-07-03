<?php
session_start();
if(isset($_SESSION['username'])) {
    header("Location: dashboard.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QCS - Quantum Core System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #050505; color: #00ff41; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Courier New', Courier, monospace; }
        .login-card { background: #0a0a0a; padding: 3rem; border-radius: 4px; box-shadow: 0 0 20px rgba(0,255,65,0.2); width: 100%; max-width: 450px; border: 1px solid #00ff41; }
        .logo { font-size: 2rem; font-weight: 700; color: #00ff41; text-align: center; margin-bottom: 2rem; text-shadow: 0 0 10px rgba(0,255,65,0.5); }
        .form-control { background-color: #000; border: 1px solid #005515; color: #00ff41; font-family: inherit; }
        .form-control:focus { background-color: #000; color: #00ff41; border-color: #00ff41; box-shadow: 0 0 10px rgba(0, 255, 65, 0.3); }
        .btn-neon { background-color: transparent; border: 1px solid #00ff41; color: #00ff41; font-weight: bold; text-transform: uppercase; transition: all 0.3s; }
        .btn-neon:hover { background-color: #00ff41; color: #000; box-shadow: 0 0 15px #00ff41; }
        .text-muted { color: #008822 !important; }
        #error-msg { display: none; color: #ff003c; text-shadow: 0 0 5px #ff003c; margin-bottom: 1rem; text-align: center; }
    </style>
</head>
<body>

<div class="login-card">
    <div class="logo">QUANTUM CORE<br><small style="font-size: 1rem; font-weight: normal; color: #008822;">AUTHORIZED PERSONNEL ONLY</small></div>
    <div id="error-msg"></div>
    <form id="loginForm">
        <div class="mb-3">
            <label class="form-label text-muted">> OPERATIVE_ID</label>
            <input type="text" class="form-control" id="username" required autocomplete="off">
        </div>
        <div class="mb-4">
            <label class="form-label text-muted">> SECURITY_KEY</label>
            <input type="password" class="form-control" id="password" required>
        </div>
        <button type="submit" class="btn btn-neon w-100">INITIALIZE LINK</button>
    </form>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('button');
    btn.innerText = 'NEGOTIATING...';
    
    try {
        const res = await fetch('/api/v1/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });
        
        const data = await res.json();
        if(data.success) {
            btn.innerText = 'LINK ESTABLISHED';
            setTimeout(() => window.location.href = data.redirect, 500);
        } else {
            document.getElementById('error-msg').innerText = '> ' + data.message;
            document.getElementById('error-msg').style.display = 'block';
            btn.innerText = 'INITIALIZE LINK';
        }
    } catch (err) {
        document.getElementById('error-msg').innerText = '> CONNECTION FAILURE';
        document.getElementById('error-msg').style.display = 'block';
        btn.innerText = 'INITIALIZE LINK';
    }
});
</script>
</body>
</html>

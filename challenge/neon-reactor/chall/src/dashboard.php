<?php
session_start();
if(!isset($_SESSION['username'])) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Quantum Core System</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Courier New', Courier, monospace; padding-top: 2rem; transition: all 0.3s; }
        
        /* DARK THEME */
        body.dark { background-color: #050505; color: #00ff41; }
        body.dark .card { background: #0a0a0a; border: 1px solid #00ff41; box-shadow: 0 0 10px rgba(0,255,65,0.1); }
        body.dark .card-header { border-bottom: 1px solid #00ff41; background: #001a05; color: #00ff41; font-weight: bold; }
        body.dark .btn-neon { background-color: transparent; border: 1px solid #00ff41; color: #00ff41; transition: all 0.3s; }
        body.dark .btn-neon:hover { background-color: #00ff41; color: #000; box-shadow: 0 0 10px #00ff41; }
        body.dark .btn-danger-neon { background-color: transparent; border: 1px solid #ff003c; color: #ff003c; transition: all 0.3s; }
        body.dark .btn-danger-neon:hover { background-color: #ff003c; color: #000; box-shadow: 0 0 10px #ff003c; }
        body.dark .text-muted { color: #008822 !important; }
        body.dark .text-success { color: #00ff41 !important; text-shadow: 0 0 5px #00ff41; }
        body.dark .text-danger { color: #ff003c !important; text-shadow: 0 0 5px #ff003c; }
        body.dark .border-success { border-color: #00ff41 !important; }
        body.dark select.form-control { background-color: #000; border: 1px solid #005515; color: #00ff41; }
        body.dark select.form-control:focus { background-color: #000; color: #00ff41; border-color: #00ff41; box-shadow: 0 0 5px rgba(0,255,65,0.5); }

        /* LIGHT THEME */
        body.light { background-color: #f1f5f9; color: #0f172a; }
        body.light .card { background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        body.light .card-header { border-bottom: 1px solid #cbd5e1; background: #e2e8f0; color: #334155; font-weight: bold; }
        body.light .btn-neon { background-color: transparent; border: 1px solid #0284c7; color: #0284c7; transition: all 0.3s; }
        body.light .btn-neon:hover { background-color: #0284c7; color: #fff; box-shadow: none; }
        body.light .btn-danger-neon { background-color: transparent; border: 1px solid #dc2626; color: #dc2626; transition: all 0.3s; }
        body.light .btn-danger-neon:hover { background-color: #dc2626; color: #fff; box-shadow: none; }
        body.light .text-muted { color: #64748b !important; }
        body.light .text-success { color: #16a34a !important; text-shadow: none; font-weight: bold; }
        body.light .text-danger { color: #dc2626 !important; text-shadow: none; font-weight: bold; }
        body.light .border-success { border-color: #cbd5e1 !important; }
        body.light select.form-control { background-color: #fff; border: 1px solid #cbd5e1; color: #0f172a; }
        body.light select.form-control:focus { background-color: #fff; color: #0f172a; border-color: #0284c7; box-shadow: 0 0 5px rgba(2,132,199,0.3); }
    </style>
</head>
<body class="<?php echo htmlspecialchars($_SESSION['theme'] ?? 'dark'); ?>">

<div class="container">
    <div class="d-flex justify-content-between align-items-center border-bottom border-success pb-3 mb-4">
        <h2>> QCS_DASHBOARD</h2>
        <div>
            <a href="core_control.php" class="btn btn-neon btn-sm me-2">CORE_CONTROL</a>
            <a href="logout.php" class="btn btn-danger-neon btn-sm">DISCONNECT</a>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-header">> OPERATIVE_STATUS</div>
                <div class="card-body">
                    <p>> <strong>ID:</strong> <?php echo htmlspecialchars($_SESSION['user_id']); ?></p>
                    <p>> <strong>DESIGNATION:</strong> <?php echo htmlspecialchars($_SESSION['username']); ?></p>
                    <p>> <strong>CLEARANCE_LEVEL:</strong> <?php echo htmlspecialchars($_SESSION['role']); ?></p>
                    <p>> <strong>THEME_PREF:</strong> <?php echo htmlspecialchars($_SESSION['theme'] ?? 'dark'); ?></p>
                    <hr class="border-success">
                    <small class="text-muted">Notice: Admin clearance required for core control access.</small>
                </div>
            </div>
        </div>

        <div class="col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-header">> SYSTEM_PREFERENCES</div>
                <div class="card-body">
                    <form id="settingsForm">
                        <div class="mb-3">
                            <label class="form-label">> UI_THEME</label>
                            <select class="form-control" id="themeSelect">
                                <option value="dark" <?php echo (($_SESSION['theme'] ?? '') === 'dark') ? 'selected' : ''; ?>>NEON_DARK (DEFAULT)</option>
                                <option value="light" <?php echo (($_SESSION['theme'] ?? '') === 'light') ? 'selected' : ''; ?>>PHOSPHOR_LIGHT</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-neon w-100">UPDATE_PREFERENCES</button>
                    </form>
                    <div id="settings-msg" class="mt-3" style="display:none;"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = 'UPDATING...';
    
    try {
        const payload = {
            theme: document.getElementById('themeSelect').value
        };
        
        const res = await fetch('/api/v1/settings/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        const msgDiv = document.getElementById('settings-msg');
        msgDiv.style.display = 'block';
        
        if(data.success) {
            msgDiv.innerHTML = '> <span class="text-success">PREFERENCES SAVED SUCCESSFULLY. RELOADING...</span>';
            setTimeout(() => window.location.reload(), 500);
        } else {
            msgDiv.innerHTML = '> <span class="text-danger">' + data.message + '</span>';
            btn.innerText = 'UPDATE_PREFERENCES';
        }
    } catch (err) {
        alert('API Error');
        btn.innerText = 'UPDATE_PREFERENCES';
    }
});
</script>

</body>
</html>

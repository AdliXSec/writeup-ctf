<?php
session_start();
if(!isset($_SESSION['username'])) {
    header("Location: index.php");
    exit();
}

$is_admin = ($_SESSION['role'] === 'admin');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Core Control - QCS</title>
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
        body.dark .text-danger { color: #ff003c !important; text-shadow: 0 0 5px #ff003c; }
        body.dark .border-success { border-color: #00ff41 !important; }
        body.dark .border-danger { border-color: #ff003c !important; }

        /* LIGHT THEME */
        body.light { background-color: #f1f5f9; color: #0f172a; }
        body.light .card { background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        body.light .card-header { border-bottom: 1px solid #cbd5e1; background: #e2e8f0; color: #334155; font-weight: bold; }
        body.light .btn-neon { background-color: transparent; border: 1px solid #0284c7; color: #0284c7; transition: all 0.3s; }
        body.light .btn-neon:hover { background-color: #0284c7; color: #fff; box-shadow: none; }
        body.light .btn-danger-neon { background-color: transparent; border: 1px solid #dc2626; color: #dc2626; transition: all 0.3s; }
        body.light .btn-danger-neon:hover { background-color: #dc2626; color: #fff; box-shadow: none; }
        body.light .text-muted { color: #64748b !important; }
        body.light .text-danger { color: #dc2626 !important; text-shadow: none; font-weight: bold; }
        body.light .border-success { border-color: #16a34a !important; }
        body.light .border-danger { border-color: #dc2626 !important; }
    </style>
</head>
<body class="<?php echo htmlspecialchars($_SESSION['theme'] ?? 'dark'); ?>">

<div class="container">
    <div class="d-flex justify-content-between align-items-center border-bottom border-success pb-3 mb-4">
        <h2>> QCS_CORE_CONTROL</h2>
        <div>
            <a href="dashboard.php" class="btn btn-neon btn-sm me-2">DASHBOARD</a>
            <a href="logout.php" class="btn btn-danger-neon btn-sm">DISCONNECT</a>
        </div>
    </div>

    <div class="card mt-4 <?php echo $is_admin ? 'border-success' : 'border-danger'; ?>">
        <?php if($is_admin): ?>
            <div class="card-header" style="color: #00ff41;">
                > ACCESS_GRANTED: OVERRIDE PROTOCOL
            </div>
            <div class="card-body text-center py-5">
                <p class="mb-4">> WELCOME ADMIN. CORE SYSTEMS UNLOCKED.</p>
                <div class="alert" style="background-color: #001a05; border: 1px dashed #00ff41; color: #00ff41; font-size: 1.2rem; font-weight: bold; text-shadow: 0 0 10px #00ff41;">
                    <?php echo htmlspecialchars(getenv('FLAG') ?: 'LEEXY{test_flag_local}'); ?>
                </div>
            </div>
        <?php else: ?>
            <div class="card-header" style="color: #ff003c; border-color: #ff003c;">
                > ACCESS_DENIED
            </div>
            <div class="card-body text-center py-5">
                <h5 class="text-danger">> INSUFFICIENT CLEARANCE</h5>
                <p class="mt-3" style="color: #ff003c;">> Your current role [<?php echo htmlspecialchars($_SESSION['role']); ?>] is not authorized.</p>
                <p class="text-muted">> This incident has been logged.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

</body>
</html>

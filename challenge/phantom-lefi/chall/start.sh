#!/bin/sh
cat <<EOF > /tmp/flag.php
<?php
// You cannot execute me and see the flag because I produce no HTML output!
// But if you are clever, you might be able to read my source code.
\$FLAG = "$FLAG";
?>
<!-- Access Denied -->
EOF
unset FLAG
apache2-foreground

# Dynamic CTF Challenge Authoring Guide

This document provides a comprehensive, step-by-step guide on how to structure, build, and deploy dynamic CTF challenges for the 0xL33XY Platform. The platform utilizes an **Instance Manager (Auto-Builder)** to dynamically provision isolated, time-limited Docker containers for each participating team.

---

## 1. Directory Structure

Before packaging your challenge into a `.zip` archive, your challenge directory must follow a strict architectural layout:

```text
my_challenge/
├── chall/                  (Required) The core application directory
│   ├── Dockerfile          (Required) Docker build instructions
│   ├── config.json         (Required) Instance Manager routing configuration
│   └── [application files] (Optional) e.g., index.php, server.js, app.py
└── exploit/                (Optional) Directory for solver scripts and writeups
    └── solve.py
```

> [!WARNING]
> **Archiving Rule:** When generating the `.zip` file for upload, you must select the `chall/` and `exploit/` directories directly and zip them. **DO NOT** zip the parent `my_challenge/` folder, as the Instance Manager expects `chall/` to be at the root of the archive.

---

## 2. Configuration (`config.json`)

The `config.json` file acts as the blueprint for the Instance Manager, dictating how the container should be built, routed, and secured.

### Basic Configuration Example:
```json
{
  "name": "basic-web-chall",
  "internal_port": 80,
  "flag_desc": "sqli_bypass_login"
}
```

### Advanced Configuration Example (Full):
```json
{
  "name": "advanced-pwn-chall",
  "internal_port": 1337,
  "flag_desc": "buffer_overflow_rce",
  "read_only": true,
  "tmpfs": {
    "/tmp": "",
    "/var/run": ""
  },
  "command": ["/bin/sh", "/app/start.sh"],
  "env_extra": {
    "DEBUG_MODE": "false"
  }
}
```

### Parameter Reference:
- **`name`** *(String, Required)*: The unique internal identifier for the challenge. Must match the challenge name created in the database.
- **`internal_port`** *(Integer, Required)*: The TCP port your application listens on *inside* the container (e.g., `80` for Nginx/Apache, `5000` for Flask). The Instance Manager handles dynamic external port mapping automatically.
- **`flag_desc`** *(String, Required)*: A brief description used as the suffix for dynamic flags. The system generates unique flags in the format: `LEEXY{flag_desc_1a2b3c}`.
- **`read_only`** *(Boolean, Optional, Default: `true`)*: **Critical Security Feature.** By default, all containers are mounted as a Read-Only File System to prevent tampering, persistence, and container breakout. If your challenge absolutely requires a writable root filesystem, set this to `false`. However, utilizing `tmpfs` is heavily preferred.
- **`tmpfs`** *(Object, Optional)*: Maps specific directories to memory (RAM), making them fully writable even when `read_only` is true. Required for applications that need to write temporary files or PIDs (e.g., `/tmp`, `/run`, `/var/cache/nginx`).
- **`command`** *(Array, Optional)*: Overrides the default `CMD` or `ENTRYPOINT` defined in your Dockerfile. Highly useful for injecting the dynamic flag into a file before booting the main application.
- **`env_extra`** *(Object, Optional)*: Injects additional static environment variables into the container at runtime.

---

## 3. Dockerfile Guidelines

Building a `Dockerfile` for the platform is similar to standard Docker practices, but centers around one golden rule:

### 🌟 The Golden Rule: The `$FLAG` Environment Variable
The Instance Manager injects the dynamically randomized flag directly into the container's memory as an environment variable named **`FLAG`**. Your application architecture must be designed to fetch or expose this specific variable.

#### Scenario A: Python / Node.js Applications
Modern backend frameworks can read environment variables natively.
```python
# Python (Flask/FastAPI)
import os
FLAG = os.environ.get('FLAG', 'LEEXY{fake_local_flag}')
```

#### Scenario B: Static Web Servers (Nginx)
Because Nginx serves static files and cannot execute backend code to read environment variables, use the `command` property in `config.json` to dump the flag into a text file during the container startup sequence:
```json
{
  "internal_port": 80,
  "flag_desc": "hidden_flag",
  "command": ["/bin/sh", "-c", "echo $FLAG > /usr/share/nginx/html/flag.txt && nginx -g 'daemon off;'"]
}
```

#### Scenario C: PHP & Apache (Dealing with Read-Only FS)
Apache often scrubs environment variables by default. The best approach is to dump the flag into `/tmp` (which must be declared in `tmpfs`) and symlink it to your web directory inside the `Dockerfile`.

**Dockerfile:**
```dockerfile
FROM php:8.1-apache
COPY src/ /var/www/html/
# Create a symlink pointing to the writable tmpfs
RUN rm -f /var/www/html/flag.php && \
    ln -s /tmp/flag.php /var/www/html/flag.php
```

**config.json:**
```json
{
  "internal_port": 80,
  "tmpfs": {"/tmp": ""},
  "command": ["/bin/sh", "-c", "echo '<?php $FLAG=\"'$FLAG'\"; ?>' > /tmp/flag.php && apache2-foreground"]
}
```

---

## 4. Troubleshooting & Best Practices

- **CRLF vs LF (Windows vs Linux Line Endings)**
  If you are writing shell scripts (`start.sh`) or `Dockerfile` multi-line commands on Windows, ensure your IDE is set to use `LF` (\n) line endings instead of `CRLF` (\r\n). Failing to do so will result in `returned a non-zero code: 1` errors during the build process.
- **Permission Denied / Read-Only File System Errors**
  If your application crashes immediately upon startup (e.g., `sshd` failing to generate host keys, or database engines failing to initialize data directories), it is because `read_only: true` is active. To resolve this, you can either:
  1. Map the failing directories to memory using the `tmpfs` configuration.
  2. *(Not Recommended)* Set `"read_only": false` in your `config.json` to allow full filesystem write access.

By adhering to these guidelines, uploading the `.zip` archive via the Admin Dashboard will result in a seamless, automated deployment process. The Instance Manager handles all the heavy lifting!

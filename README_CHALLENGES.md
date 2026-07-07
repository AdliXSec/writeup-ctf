# Panduan Pembuatan Challenge CTF Dinamis

Dokumen ini menjelaskan cara membuat dan merakit sebuah *challenge* (tantangan) agar dapat diunggah dan di-*build* secara otomatis melalui fitur **Admin Dashboard (Auto-Builder)**.

---

## 1. Struktur Folder (Wajib)

Sebelum dijadikan file `.zip`, folder *challenge* Anda harus memiliki struktur berikut:

```text
nama_challenge/
├── chall/                  (Wajib) Folder utama penampung aplikasi
│   ├── Dockerfile          (Wajib)
│   ├── config.json         (Wajib) Konfigurasi untuk Instance Manager
│   └── [file aplikasi]     (Opsional) misal: index.html, app.py, dll.
└── exploit/                (Opsional) Folder untuk menyimpan solver/writeup
```
> **Penting:** Saat Anda membuat file `.zip`, pastikan Anda me-ZIP folder `chall/` dan `exploit/` secara langsung, BUKAN me-ZIP *parent folder* (`nama_challenge/`).

---

## 2. Aturan `config.json`

File `config.json` bertindak sebagai "jembatan" yang memberi tahu *Instance Manager* bagaimana cara merutekan port dan membangun lingkungan *container*.

### Contoh `config.json` Dasar:
```json
{
  "internal_port": 80,
  "flag_desc": "sqli_bypass_login"
}
```

### Contoh `config.json` Tingkat Lanjut (Full):
```json
{
  "internal_port": 80,
  "flag_desc": "imagetragick_lfi_rce",
  "tmpfs": {
    "/tmp": "",
    "/var/cache/nginx": "",
    "/var/run": ""
  },
  "command": ["/bin/sh", "-c", "echo $FLAG > /flag.txt && apache2-foreground"],
  "env_extra": {
    "DEBUG_MODE": "false"
  }
}
```

### Penjelasan *Key* / Properti:
- **`internal_port` (Wajib, Integer):** Port aplikasi yang berjalan di *dalam* container. Misalnya Nginx/Apache = 80, Flask = 5000, Node.js = 3000. Anda tidak perlu memikirkan port luar, sistem akan merutekannya secara otomatis tanpa tabrakan.
- **`flag_desc` (Wajib, String):** Deskripsi singkat untuk flag. Sistem akan mengacak flag dengan format: `LEEXY{flag_desc_1a2b3c}`.
- **`tmpfs` (Opsional, Object):** **Sangat Penting!** Karena alasan keamanan, semua *container* dijalankan dengan mode **Read-Only System (`read_only: true`)**. Jika aplikasi Anda (seperti Nginx, Apache, atau Database) butuh menulis file sementara/log, Anda **WAJIB** mendaftarkan foldernya ke dalam `tmpfs` agar dialokasikan ke memori (RAM).
- **`command` (Opsional, Array):** Menimpa (`override`) perintah CMD atau ENTRYPOINT bawaan dari Dockerfile. Sangat berguna jika Anda ingin memindahkan isi `$FLAG` ke sebuah file sebelum menjalankan aplikasi utama (lihat contoh di atas).
- **`env_extra` (Opsional, Object):** Variabel *environment* statis tambahan selain `$FLAG`.

---

## 3. Aturan `Dockerfile`

Membangun `Dockerfile` untuk *challenge* CTF ini sangat mirip dengan Docker standar, dengan satu aturan emas:

### 🌟 Aturan Emas: Gunakan `$FLAG` (Environment Variable)
*Instance Manager* akan selalu menyuntikkan flag yang sudah diacak secara dinamis langsung ke dalam memori *container* sebagai variabel *environment* bernama **`FLAG`**. Anda harus mendesain aplikasi Anda agar bisa membaca variabel ini.

**Contoh 1: Aplikasi Python / Flask**
```python
import os
FLAG = os.environ.get('FLAG', 'LEEXY{fake_flag}')
```

**Contoh 2: Aplikasi Web Statis / Nginx (Memindahkan $FLAG ke file teks)**
Karena Nginx hanya menyajikan file statis, Anda bisa menggunakan properti `"command"` di `config.json` untuk menulis flag ke `/usr/share/nginx/html/flag.txt` saat *container* pertama kali dinyalakan:
```json
{
  "internal_port": 80,
  "flag_desc": "hidden_flag",
  "command": ["/bin/sh", "-c", "echo $FLAG > /usr/share/nginx/html/flag.txt && nginx -g 'daemon off;'"]
}
```

**Contoh 3: Aplikasi PHP (Apache)**
Di PHP, Anda bisa membacanya menggunakan `getenv('FLAG')`. Namun secara *default*, Apache membuang semua variabel sistem. Anda disarankan menaruh flag ke file menggunakan teknik `"command"` di `config.json`:
```json
{
  "internal_port": 80,
  "flag_desc": "php_rce",
  "command": ["/bin/sh", "-c", "echo $FLAG > /flag.txt && chown root:root /flag.txt && chmod 444 /flag.txt && apache2-foreground"]
}
```
*(Ingat, jangan lupa daftarkan folder penulisan sementara ke dalam `tmpfs` jika dibutuhkan!)*

---

Dengan mengikuti standar di atas, Anda hanya perlu me-*zip* foldernya dan mengunggahnya melalui Dashboard. *Instance Manager* akan membereskan sisanya!

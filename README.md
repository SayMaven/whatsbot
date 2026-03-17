# 🤖 WhatsApp Bot Sarkas AI (Powered by Gemini 2.5 Flash)

Bot WhatsApp auto-reply pintar yang di-design khusus buat ngeroasting temen yang gak sabaran, ngehindarin chat urusan kampus, dan ngasih tau status kesibukan *owner* secara *real-time*. Dibuat menggunakan Node.js, `whatsapp-web.js`, dan Google Gemini AI.

## ✨ Fitur Unggulan
- **🧠 Sarkas & Santai:** Balasan di-generate otomatis oleh AI Gemini dengan *prompt* gaya bahasa anak tongkrongan.
- **🕒 Time-Aware:** Bot sadar waktu (Pagi/Siang/Malam/Dini Hari) dan ngasih alasan yang relevan kenapa lu gak balas chat.
- **🛡️ Anti-Dosen Shield:** Otomatis mengabaikan chat yang mengandung kata-kata sensitif urusan kampus (bapak, ibu, revisi, absen, dll).
- **📝 Deteksi "Tolong" & Chat Panjang:** Punya *treatment* khusus buat ngeroasting temen yang tiba-tiba datang minta tolong atau nge-spam paragraf panjang.
- **👥 Private Only:** Cuma merespons chat Japri, otomatis mengabaikan obrolan Grup biar gak nyepam.

## 🛠️ Persyaratan Sistem
Sebelum mulai, pastikan di PC/Server kalian sudah terpasang:
1. [Node.js](https://nodejs.org/) (Sangat disarankan versi LTS).
2. [Git](https://git-scm.com/) (Untuk clone repo).
3. Akun WhatsApp aktif (Bisa pakai nomor utama atau nomor bot).
4. **API Key Google Gemini** (Dapatkan gratis di [Google AI Studio](https://aistudio.google.com/)).

## 🚀 Cara Pemasangan (Instalasi)

### 1. Clone Repository & Install Dependencies
Buka terminal/CMD, lalu jalankan perintah berikut:
```bash
git clone https://github.com/USERNAME_GITHUB_KALIAN/NAMA_REPO_KALIAN.git
cd NAMA_REPO_KALIAN
npm install whatsapp-web.js qrcode-terminal @google/generative-ai dotenv
```

### 2. Setup File `.env` (SANGAT PENTING)
Buat file baru di dalam folder project dengan nama **tepat** `.env`. (Catatan: file ini sengaja di-block oleh `.gitignore` agar API Key tidak bocor ke publik).
Isi file tersebut dengan API Key Gemini kalian:
```text
GEMINI_API_KEY=masukin_api_key_gemini_kalian_disini_tanpa_tanda_kutip
```

### 3. Jalankan Bot (Mode Testing)
Untuk memastikan bot berjalan dan melakukan *scan* QR Code pertama kali:
```bash
node index.js
```
- Buka WhatsApp di HP kalian.
- Masuk ke **Perangkat Taut (Linked Devices)**.
- Scan QR Code yang muncul di terminal.
- Jika berhasil, akan muncul tulisan `Bot Sarkas udah jalan bro!`. Tekan `Ctrl + C` untuk mematikan mode testing.

## 🌐 Menjalankan Bot 24/7 di Background (Menggunakan PM2)
Biar bot tetap jalan walaupun terminal ditutup (cocok buat di-host di server atau laptop lama), gunakan **PM2**.

**Install PM2 (Jika belum ada):**
```bash
npm install -g pm2
```

**Jalankan Bot dengan PM2:**
```bash
pm2 start index.js --name "bot-wa"
pm2 save
pm2 startup
```

**Melihat CCTV/Log Bot:**
Untuk melihat riwayat aktivitas bot secara real-time:
```bash
pm2 logs bot-wa
```
*(Tekan `Ctrl + C` untuk keluar dari tampilan log tanpa mematikan bot)*

## 🐛 Troubleshooting (Masalah yang Sering Terjadi)

### 1. Error `API_KEY_INVALID`
- **Penyebab:** File `.env` belum dibuat, salah nama, atau API Key salah copas/berisi spasi.
- **Solusi:** Cek kembali file `.env`. Jika kalian baru saja mengubah isi `.env` saat bot sedang jalan di PM2, wajib restart dengan perintah:
  ```bash
  pm2 restart bot-wa --update-env
  ```

### 2. Error `The browser is already running (Zombie Process)`
- **Penyebab:** Bot dimatikan paksa atau *crash*, sehingga browser Puppeteer di *background* nyangkut dan mengunci sesi WhatsApp.
- **Solusi (Untuk pengguna Windows):**
  Buka terminal/CMD dan jalankan perintah ini untuk membantai proses Chrome yang nyangkut:
  ```bash
  pm2 stop bot-wa
  taskkill /F /IM chrome.exe /T
  pm2 start bot-wa --update-env
  ```

### 3. Menghapus riwayat logs
  ```bash
  pm2 flush  
  ```

## 📝 Kustomisasi
Kalian bisa bebas mengedit file `index.js` untuk menyesuaikan persona bot:
- Ubah isi array `kataBahaya` untuk menyesuaikan kata apa saja yang diabaikan.
- Ubah `regexPanggilan` untuk menyesuaikan nama panggilan kalian.
- Modifikasi variabel `prompt` di bagian AI untuk menyesuaikan gaya bahasa dan alasan kesibukan kalian.

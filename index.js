require('dotenv').config();
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR ini pakai WA lu!');
});

client.on('ready', () => {
    console.log('Bot Sarkas v3.4 (All Sticker Edition) udah jalan bro!');
});

client.on('message', async msg => {
    if (msg.from.endsWith('@g.us') || msg.isStatus) return;

    const text = msg.body.toLowerCase();

    // --- SETUP NOMOR KORBAN (BAYU) ---
    const nomorBayu = '62895410873569@c.us'; 
    const isBayu = msg.from === nomorBayu;

    // 1. FILTER DOSEN / KAMPUS (Aman pakai Regex)
    const regexBahaya = /\b(assalamualaikum|bapak|ibu|kuliah|nim|absen|revisi|ujian|ok|sip)\b/;
    if (regexBahaya.test(text)) {
        return; 
    }

    // 2. EASTER EGG: SAWIT + STICKER
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nnyawit nih orang 🌴🤣');
        
        const pathStikerSawit = './sticker/meme/sawit.webp';
        if (fs.existsSync(pathStikerSawit)) {
            const media = MessageMedia.fromFilePath(pathStikerSawit);
            await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        } else {
            console.log(`[WARNING] File stiker tidak ditemukan di: ${pathStikerSawit}`);
        }
        return; 
    }
    
    if (text.includes('terima kasih') || text.includes('makasih')) {
        await msg.reply('*[Asisten Bot]*\nOk sip sama sama');
        return; 
    }

    // 3. TRIGGER PANGGILAN
    const regexPanggilan = /\b(p|bil|abil|wei|woi|balas|lama|tolong|bg|bang)\b/;

    if (regexPanggilan.test(text)) {
        console.log(`[CCTV] Ada pesan ketriger dari ${msg.from}: "${msg.body}"`);
        
        // --- LOGIC DETEKSI WAKTU ---
        const jam = new Date().getHours(); 
        let statusKondisi = "";

        if (jam >= 6 && jam < 18) {
            statusKondisi = "Sekarang pagi/siang/sore. Abil lagi sibuk atau fokus ngerjain project remote-nya. HP dianggurin.";
        } else if (jam >= 18 && jam < 23) {
            statusKondisi = "Sekarang malam hari. Abil lagi me-time, dengerin musik , game rhythm atau push project. Jangan diganggu.";
        } else {
            statusKondisi = "Sekarang tengah malam/dini hari. Abil kemungkinan besar lagi tidur lelap atau lagi mode begadang ngoding. HP mode senyap.";
        }

        try {
            // PROMPT DEFAULT
            let prompt = `
            Kondisi Abil Saat Ini: ${statusKondisi}
            Pesan dari temannya: "${msg.body}"

            Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada santai, sedikit sarkas ala anak muda (gue, lu, bro).
            
            ATURAN SANGAT KETAT:
            1. LANGSUNG BERIKAN ISI BALASANNYA SAJA!
            2. DILARANG MEMBERIKAN PILIHAN ATAU OPSI (1, 2, 3).
            3. Jika pesan mengandung kata "tolong", tolak dengan sarkas.
            4. Jika pesannya terlihat panjang lebar (curhat/cerita), suruh langsung to the point.
            5. DILARANG MENGGUNAKAN AWALAN SEPERTI "Oke", "Tentu", "Ini dia".
            6. Balasan harus singkat, maksimal 2 kalimat.
            7. Jangan eksplisit menyebut nama abil, gunakan kata-kata lain.
            `;

            // PROMPT SPESIAL BAYU (RIKA)
            if (isBayu) {
                prompt = `
                Kondisi Abil Saat Ini: ${statusKondisi}
                Pesan dari temannya (nama aslinya Bayu, tapi KAMU WAJIB PANGGIL DIA "RIKA atau kntl"): "${msg.body}"

                Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada SANGAT BADASS, KASAR, SAVAGE, dan nge-roasting habis-habisan.
                
                ATURAN KHUSUS UNTUK RIKA (BAYU):
                1. WAJIB sapa/panggil dia dengan "Rika atau jembt atau kntl".
                2. Jangan kasih ampun, balas dengan kata-kata tajam.
                3. LANGSUNG BERIKAN ISI BALASANNYA SAJA! TANPA OPSI!
                4. Jelaskan alasan Abil tidak membalas sesuai kondisinya.
                5. Maksimal 2 kalimat.
                `;
            }

            // 1. Eksekusi AI dan kirim teks balasannya
            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            await msg.reply(`*[Asisten Bot]*\n${responseText}`);

            // 2. Eksekusi kirim Stiker setelah teks terkirim
            if (isBayu) {
                // Stiker khusus buat roasting Bayu
                const pathStikerBayu = './sticker/meme/1.webp';
                if (fs.existsSync(pathStikerBayu)) {
                    const mediaBayu = MessageMedia.fromFilePath(pathStikerBayu);
                    await client.sendMessage(msg.from, mediaBayu, { sendMediaAsSticker: true });
                }
            } else {
                // Stiker umum buat temen lu yang lain (misal gambar orang sibuk/tidur)
                const pathStikerUmum = './sticker/meme/6.webp'; 
                if (fs.existsSync(pathStikerUmum)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerUmum);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            }

        } catch (error) {
            // --- CUSTOM CATCH ERROR KHUSUS BAYU/RIKA ---
            if (isBayu) {
                console.error("[ERROR AI RIKA]:", error.message);
                await msg.reply(`*[Asisten Bot]*\nBingung gue baca chat lu Kntl. Bot aja muak ngeladenin lu.`);
                const pathStikerBayuError = './sticker/meme/5.webp'; 
                if (fs.existsSync(pathStikerBayuError)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerBayuError);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            } else {
                console.error("[ERROR AI]:", error.message);
                await msg.reply(`*[Asisten Bot]*\nSabar, Abil lagi gak megang HP. (ntar dibales juga sama dia).`);
                const pathStikerError = './sticker/meme/4.webp'; 
                if (fs.existsSync(pathStikerError)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerError);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            }
        }
    }
});

client.initialize();
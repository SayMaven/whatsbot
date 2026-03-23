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
    const nomorBayu = process.env.NOMOR_BAYU;
    const isBayu = msg.from === nomorBayu;

    const nomorKeluarga = process.env.NOMOR_KELUARGA ? process.env.NOMOR_KELUARGA.split(',') : [];
    if (nomorKeluarga.includes(msg.from)) {
        console.log(`[CCTV] Keluarga nge-chat: "${msg.body}" (Bot mingkem total)`);
        return; 
    }

    const regexBahaya = /\b(assalamualaikum|bapak|ibu|kuliah|nim|absen|revisi|ujian|ok[ey]*|sip+)\b/;
    if (regexBahaya.test(text)) {
        return; 
    }

    // 2. EASTER EGG: SAWIT + STICKER
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nUdah nyawitnya?');
        
        const pathStikerSawit1 = './sticker/meme/sawit3.webp';
        if (fs.existsSync(pathStikerSawit1)) {
            const media = MessageMedia.fromFilePath(pathStikerSawit1);
            await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        } else {
            console.log(`[WARNING] File stiker tidak ditemukan di: ${pathStikerSawit1}`);
        }
        const pathStikerSawit2 = './sticker/meme/sawit2.webp';
        if (fs.existsSync(pathStikerSawit2)) {
            const media = MessageMedia.fromFilePath(pathStikerSawit2);
            await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        } else {
            console.log(`[WARNING] File stiker tidak ditemukan di: ${pathStikerSawit2}`);
        }
        return; 
    }
    
    const regexMakasih = /\b(terima\s*kasi[h]*|m+a+k+a+s+i+[h]*|mksh|makaci+)\b/;
    if (regexMakasih.test(text)) {
        await msg.reply('*[Asisten Bot]*\nOk sip');
        const pathStikerMakasih = './sticker/meme/9.webp';
        if (fs.existsSync(pathStikerMakasih)) {
            const media = MessageMedia.fromFilePath(pathStikerMakasih);
            await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        } else {
            console.log(`[WARNING] File stiker tidak ditemukan di: ${pathStikerMakasih}`);
        }
        return; 
    }

    // 3. TRIGGER PANGGILAN
    const regexPanggilan = /\b(p|bil|abil|wei|woi|balas|lama|tolong|bg|bang|bit|bro|ngentot|ajg|anjing|kontol|kntl|anjg|bi[l]*)\b/;

    if (regexPanggilan.test(text)) {
        console.log(`[CCTV] Ada pesan ketriger dari ${msg.from}: "${msg.body}"`);
        
        // --- LOGIC DETEKSI WAKTU ---
        const jam = new Date().getHours(); 
        let statusKondisi = "";

        if (jam >= 6 && jam < 18) {
            statusKondisi = "Sekarang pagi/siang/sore. Abil lagi sibuk. HP dianggurin.";
        } else if (jam >= 18 && jam < 23) {
            statusKondisi = "Sekarang malam hari. Abil lagi me-time, dengerin musik , game rhythm atau push project. Jangan diganggu.";
        } else {
            statusKondisi = "Sekarang tengah malam/dini hari. Abil kemungkinan besar lagi tidur lelap. HP mode senyap.";
        }

        try {
            // PROMPT DEFAULT
            let prompt = `
            Kondisi Abil Saat Ini: ${statusKondisi}
            Pesan dari temannya: "${msg.body}"

            Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada santai (gue, lu, bro).
            
            ATURAN SANGAT KETAT:
            1. LANGSUNG BERIKAN ISI BALASANNYA SAJA!
            2. DILARANG MEMBERIKAN PILIHAN ATAU OPSI (1, 2, 3).
            3. Jika pesan mengandung kata "tolong", tolak dengan sarkas.
            4. Jika pesannya terlihat panjang lebar (curhat/cerita), suruh langsung to the point.
            5. DILARANG MENGGUNAKAN AWALAN SEPERTI "Oke", "Tentu", "Ini dia".
            6. Balasan harus singkat, maksimal 2 kalimat.
            7. kata itu bg maksudnya itu bang.
            8. Jangan eksplisit bilang abil lagi cari uang.
            `;

            // PROMPT SPESIAL BAYU (RIKA)
            if (isBayu) {
                prompt = `
                Kondisi Abil Saat Ini: ${statusKondisi}
                Pesan dari temannya (nama aslinya Bayu, tapi KAMU WAJIB PANGGIL DIA "RIKA atau lu"): "${msg.body}"

                Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada menyalahkan si bayu atas apa yang dilakukan.
                
                ATURAN KHUSUS UNTUK RIKA (BAYU):
                1. WAJIB sapa/panggil dia dengan "Rika atau lu".
                2. balas dengan kata-kata sedih.
                3. LANGSUNG BERIKAN ISI BALASANNYA SAJA! TANPA OPSI!
                4. Jelaskan alasan Abil tidak membalas sesuai kondisinya dan salahkan rika.
                5. Maksimal 2 kalimat.
                6. Buat balasan seolah olah abil adalah seorang cewe dan jangan eksplisit bilang abil adalah cewe.
                7. Sesekali puji si rika.
                `;
            }

            // 1. Eksekusi AI dan kirim teks balasannya
            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            await msg.reply(`*[Asisten Bot]*\n${responseText}`);

            // 2. Eksekusi kirim Stiker setelah teks terkirim
            if (isBayu) {
                const pathStikerBayu1 = './sticker/meme/3.webp';
                if (fs.existsSync(pathStikerBayu1)) {
                    const mediaBayu = MessageMedia.fromFilePath(pathStikerBayu1);
                    await client.sendMessage(msg.from, mediaBayu, { sendMediaAsSticker: true });
                }
            } 
            /* else {
                // Stiker umum buat temen lu yang lain (misal gambar orang sibuk/tidur)
                const pathStikerUmum = './sticker/meme/bushido.webp'; 
                if (fs.existsSync(pathStikerUmum)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerUmum);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            }*/

        } catch (error) {
            // --- CUSTOM CATCH ERROR KHUSUS BAYU/RIKA ---
            if (isBayu) {
                console.error("[ERROR AI RIKA]:", error.message);
                await msg.reply(`*[Asisten Bot]*\nJangan ganggu abil. Dia lagi sibuk dengan projectnya.`);
                const pathStikerBayuError = './sticker/meme/13.webp'; 
                if (fs.existsSync(pathStikerBayuError)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerBayuError);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            } else {
                console.error("[ERROR AI]:", error.message);
                await msg.reply(`*[Asisten Bot]*\nSabar, Abil lagi gak megang HP. (ntar dibales juga sama dia).`);
                const pathStikerError = './sticker/meme/rimi.webp'; 
                if (fs.existsSync(pathStikerError)) {
                    const mediaUmum = MessageMedia.fromFilePath(pathStikerError);
                    await client.sendMessage(msg.from, mediaUmum, { sendMediaAsSticker: true });
                }
            }
        }
    }
});

client.initialize();
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Pake model terbaru yang lu bilang bisa
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR ini pakai WA lu!');
});

client.on('ready', () => {
    console.log('Bot Sarkas v3.0 (Time-Aware) udah jalan bro!');
});

client.on('message', async msg => {
    const chat = await msg.getChat();
    if (chat.isGroup || msg.isStatus) return;

    const text = msg.body.toLowerCase();

    // 1. FILTER DOSEN / KAMPUS
    const kataBahaya = ['assalamualaikum', 'tugas', 'bapak', 'ibu', 'kuliah', 'nim', 'absen', 'revisi', 'ujian'];
    if (kataBahaya.some(kata => text.includes(kata))) return; 

    // 2. EASTER EGG: SAWIT
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nnyawit nih orang 🌴🤣');
        return; 
    }

    // 3. TRIGGER PANGGILAN
    const regexPanggilan = /\b(p|bil|wei|woi|balas|lama)\b/;

    if (regexPanggilan.test(text)) {
        console.log(`[CCTV] Ada yang nge-ping: "${msg.body}"`);
        
        // --- LOGIC DETEKSI WAKTU ---
        const jam = new Date().getHours(); // Ngambil jam dari sistem laptop (WIB)
        let statusKondisi = "";

        if (jam >= 6 && jam < 18) {
            statusKondisi = "Sekarang pagi/siang/sore. Abil lagi sibuk beraktivitas, ngerjain tugas, atau fokus kerja remote. Jadi HP-nya dianggurin.";
        } else if (jam >= 18 && jam < 23) {
            statusKondisi = "Sekarang malam hari. Abil lagi santai, me-time, atau lagi push rank/main game ritme. Jangan diganggu.";
        } else {
            statusKondisi = "Sekarang tengah malam/dini hari. Abil kemungkinan besar lagi tidur lelap atau lagi begadang ngoding project. HP mode senyap.";
        }

        try {
            // Prompt Super Ketat biar gak ngasih opsi 1, 2, 3
            const prompt = `
            Kondisi Abil Saat Ini: ${statusKondisi}
            Pesan dari temannya: "${msg.body}"

            Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada santai, sedikit sarkas ala anak muda (gue, lu, bro). Jelaskan alasan Abil tidak membalas berdasarkan "Kondisi Abil Saat Ini".
            
            ATURAN SANGAT KETAT:
            1. LANGSUNG BERIKAN ISI BALASANNYA SAJA!
            2. DILARANG MEMBERIKAN PILIHAN ATAU OPSI (1, 2, 3).
            3. DILARANG MENGGUNAKAN AWALAN SEPERTI "Oke", "Tentu", "Ini dia".
            4. Balasan harus singkat, maksimal 2 kalimat.
            `;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim(); // .trim() buat ngilangin spasi/enter berlebih
            
            await msg.reply(`*[Asisten Bot]*\n${responseText}`);

        } catch (error) {
            console.error("[ERROR AI]:", error.message);
            // FALLBACK: Kalau API Limit / Error 429, bot bakal pake balasan manual ini
            await msg.reply(`*[Asisten Bot]*\nSabar woi, Abil lagi gak megang HP. (Botnya lagi limit API, ntar juga dibales sama orangnya).`);
        }
    }
});

client.initialize();
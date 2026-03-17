require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js'); // Tambah MessageMedia buat stiker
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR ini pakai WA lu!');
});

client.on('ready', () => {
    console.log('Bot Sarkas v2.0 udah jalan bro!');
});

client.on('message', async msg => {
    // 1. Abaikan kalau pesannya dari Grup atau Status WA
    const chat = await msg.getChat();
    if (chat.isGroup || msg.isStatus) return;

    // 2. Ubah jadi huruf kecil semua
    const text = msg.body.toLowerCase();
    console.log(`[CCTV] Nangkep chat dari temen lu: "${text}"`);

    // 3. FILTER DOSEN / KAMPUS (Bot auto mingkem kalau ada kata-kata ini)
    const kataBahaya = ['assalamualaikum', 'tugas', 'bapak', 'ibu', 'kuliah', 'nim', 'absen', 'revisi', 'ujian'];
    if (kataBahaya.some(kata => text.includes(kata))) {
        console.log(`Ada chat bawa-bawa kampus/dosen, bot mingkem.`);
        return; 
    }

    // 4. EASTER EGG: SAWIT
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nnyawit nih orang 🌴🤣');
        
        // --- OPSIONAL KIRIM STIKER SAWIT ---
        // Kalau lu punya file stiker 'sawit.webp' di folder lu, hapus tanda // di bawah ini:
        // const stikerSawit = MessageMedia.fromFilePath('./sawit.webp');
        // await client.sendMessage(msg.from, stikerSawit, { sendMediaAsSticker: true });
        
        return; // Berhenti di sini, gak usah panggil Gemini
    }

    // 5. TRIGGER PANGGILAN (Pakai batas kata \b biar "mobil" gak ke-trigger)
    const regexPanggilan = /\b(p|bil|wei|woi|balas|lama)\b/;

    if (regexPanggilan.test(text)) {
        try {
            const prompt = `
            Ada teman Abil yang nge-chat: "${msg.body}"
            Balas dengan nada santai, sedikit sarkas, kasih tau kalau Abil lagi sibuk dan gak pegang HP atau mode fokus atau lagi kerja.
            Gunakan bahasa gaul (gue, lu, bro). Jangan kaku. Maksimal 2 kalimat.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            await msg.reply(`*[Asisten Bot]*\n${response.text()}`);

            // --- OPSIONAL KIRIM STIKER ROASTING ---
            // Kalau lu punya gambar 'roasting.webp' di folder, hapus tanda // di bawah ini:
            // const stikerRoasting = MessageMedia.fromFilePath('./roasting.webp');
            // await client.sendMessage(msg.from, stikerRoasting, { sendMediaAsSticker: true });

        } catch (error) {
            console.error("Error AI:", error);
        }
    }
});

client.initialize();
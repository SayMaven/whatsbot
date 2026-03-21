require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
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
    console.log('Bot Sarkas v3.1 (Tolong & Teks Panjang Edition) udah jalan bro!');
});

client.on('message', async msg => {
    const chat = await msg.getChat();
    if (chat.isGroup || msg.isStatus) return;

    const text = msg.body.toLowerCase();

    // 1. FILTER DOSEN / KAMPUS
    const kataBahaya = ['assalamualaikum', 'bapak', 'ibu', 'kuliah', 'nim', 'absen', 'revisi', 'ujian', 'ok', 'sip', ];
    if (kataBahaya.some(kata => text.includes(kata))) return; 

    // 2. EASTER EGG: SAWIT
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nnyawit nih orang 🌴🤣');
        return; 
    }
    if (text.includes('terima kasih') || text.includes('makasih')) {
        await msg.reply('*[Asisten Bot]*\nOk sip sama sama');
        return; 
    }

    // 3. TRIGGER PANGGILAN
    const regexPanggilan = /\b(p|(ganti nama kalian)|wei|woi|balas|lama|tolong)\b/;

    if (regexPanggilan.test(text)) {
        console.log(`[CCTV] Ada pesan ketriger: "${msg.body}"`);
        
        // --- LOGIC DETEKSI WAKTU ---
        const jam = new Date().getHours(); 
        let statusKondisi = "";

        if (jam >= 6 && jam < 18) {
            statusKondisi = "Sekarang pagi/siang/sore. (Nama kalian) (aktivitas kalian).";
        } else if (jam >= 18 && jam < 23) {
            statusKondisi = "Sekarang malam hari. (Nama kalian) (aktivitas kalian).";
        } else {
            statusKondisi = "Sekarang tengah malam/dini hari. (Nama kalian) (aktivitas kalian).";
        }

        try {
            const prompt = `
            Kondisi (Nama kalian) Saat Ini: ${statusKondisi}
            Pesan dari temannya: "${msg.body}"

            Tugasmu: Berperanlah sebagai asisten bot WhatsApp (nama kalian). Balas chat tersebut dengan nada santai, sedikit sarkas ala anak muda (gue, lu, bro).
            
            ATURAN SANGAT KETAT:
            1. LANGSUNG BERIKAN ISI BALASANNYA SAJA!
            2. DILARANG MEMBERIKAN PILIHAN ATAU OPSI (1, 2, 3).
            3. Jika pesan mengandung kata "tolong" atau meminta bantuan, tolak dengan sarkas dan jelaskan (Nama kalian) tidak bisa diganggu sekarang karena kondisinya. Suruh nunggu (Nama kalian) buka HP.
            4. Jika pesannya terlihat panjang lebar (curhat/cerita) tapi ada panggilan namanya, suruh langsung to the point aja karena (Nama kalian) gak lagi mantengin layar.
            5. DILARANG MENGGUNAKAN AWALAN SEPERTI "Oke", "Tentu", "Ini dia".
            6. Balasan harus singkat, maksimal 2 kalimat.
            7. balas sesuai konteks chat.
            `;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            
            await msg.reply(`*[Asisten Bot]*\n${responseText}`);

        } catch (error) {
            console.error("[ERROR AI]:", error.message);
            await msg.reply(`*[Asisten Bot]*\nSabar, (Nama kalian) lagi gak megang HP. (Ntar juga dibales sama orangnya).`);
        }
    }
});

client.initialize();
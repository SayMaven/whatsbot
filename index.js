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
    const kataBahaya = ['assalamualaikum', 'bapak', 'ibu', 'kuliah', 'nim', 'absen', 'revisi', 'ujian'];
    if (kataBahaya.some(kata => text.includes(kata))) return; 

    // 2. EASTER EGG: SAWIT
    if (text.includes('sawit') || text.includes('nyawit')) {
        await msg.reply('*[Asisten Bot]*\nnyawit nih orang 🌴🤣');
        return; 
    }

    // 3. TRIGGER PANGGILAN + NAMA FULL + TOLONG
    // Gw tambahin 'abil' dan 'tolong' ke sini biar otomatis ketangkep
    const regexPanggilan = /\b(p|bil|abil|wei|woi|balas|lama|tolong)\b/;

    if (regexPanggilan.test(text)) {
        console.log(`[CCTV] Ada pesan ketriger: "${msg.body}"`);
        
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
            // Prompt ditajamkan buat ngerespons "tolong" dan chat kepanjangan
            const prompt = `
            Kondisi Abil Saat Ini: ${statusKondisi}
            Pesan dari temannya: "${msg.body}"

            Tugasmu: Berperanlah sebagai asisten bot WhatsApp Abil. Balas chat tersebut dengan nada santai, sedikit sarkas ala anak muda (gue, lu, bro).
            
            ATURAN SANGAT KETAT:
            1. LANGSUNG BERIKAN ISI BALASANNYA SAJA!
            2. DILARANG MEMBERIKAN PILIHAN ATAU OPSI (1, 2, 3).
            3. Jika pesan mengandung kata "tolong" atau meminta bantuan, tolak dengan sarkas dan jelaskan Abil tidak bisa diganggu sekarang karena kondisinya. Suruh nunggu Abil buka HP.
            4. Jika pesannya terlihat panjang lebar (curhat/cerita) tapi ada panggilan namanya, suruh langsung to the point aja karena Abil gak lagi mantengin layar.
            5. DILARANG MENGGUNAKAN AWALAN SEPERTI "Oke", "Tentu", "Ini dia".
            6. Balasan harus singkat, maksimal 2 kalimat.
            `;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            
            await msg.reply(`*[Asisten Bot]*\n${responseText}`);

        } catch (error) {
            console.error("[ERROR AI]:", error.message);
            await msg.reply(`*[Asisten Bot]*\nSabar, Abil lagi gak megang HP. (Ntar juga dibales sama orangnya).`);
        }
    }
});

client.initialize();
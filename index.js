require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Panggil API Key dari file .env secara aman
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
    console.log('Bot AI udah jalan bro!');
});

client.on('message', async msg => {
    const text = msg.body.toLowerCase();

    if (text === 'p' || text.includes('balas') || text.includes('woi') || text.includes('lama')) {
        try {
            const prompt = `
            Ada teman Abil yang chat marah-marah/gak sabaran nunggu balasan: "${msg.body}"
            Balas dengan nada santai, sedikit sarkas, kasih tau kalau Abil lagi sibuk/mode fokus.
            Gunakan bahasa gaul anak muda, maksimal 2 kalimat saja.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            await msg.reply(`*[Bot Asisten]*\n${response.text()}`);
            
        } catch (error) {
            console.error("Error AI:", error);
        }
    }
});

client.initialize();
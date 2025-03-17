import express from 'express';
import model from '../../models/ollama.js';
// import model from '../../models/openai.js';
import { addDocuments, removeAllDocuments, searchDocuments } from '../../retriever/qdrant.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { messages = [], useContext = true } = req.body;

        // Kontekst qidirish
        let contextDocs = [];
        if (useContext && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                contextDocs = await searchDocuments(lastMessage.content);
            }
        }

        console.log(contextDocs, "<--contextDocs");

        // Bugungi sanani tekshirish
        const lastMessage = messages[messages.length - 1];
        const dateKeywords = ['bugun', 'sana', 'kun'];
        const isAskingDate = lastMessage && dateKeywords.some(keyword => 
            lastMessage.content.toLowerCase().includes(keyword)
        );

        // Kontekstni xabarlarga qo'shish
        const augmentedMessages = [...messages];
        if (contextDocs.length > 0) {
            const context = contextDocs.map(doc => doc).filter(Boolean).join('\n\n');
            console.log('Kontekst:', context);
            augmentedMessages.unshift({
                role: 'system',
                content: `Sizning O'zbekiston Milliy Statistika qo'mitasining yordamchi assistantisiz. Quyidagi ma'lumotlar asosida javob bering::\n\n${context}`
            });
        }

        // Agar sana so'ralgan bo'lsa
        if (isAskingDate) {
            const today = new Date().toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            augmentedMessages.unshift({
                role: 'system',
                content: `Bugungi sana: ${today}`
            });
        }

        // Modeldan javob olish
        const completion = await model.invoke(augmentedMessages);
        res.json(completion);
    } catch (error) {
        console.error('Chat endpointida xatolik:', error);
        res.status(500).json({ error: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.' });
    }
});

router.post('/add-document', async (req, res) => {
    try {
        const { content } = req.body;
        await addDocuments([{ content }]);
        res.json({ message: 'Hujjat muvaffaqiyatli qo\'shildi' });
    } catch (error) {
        console.error('Hujjat qo\'shishda xatolik:', error);
        res.status(500).json({ error: 'Hujjat qo\'shishda xatolik yuz berdi.' });
    }
});

router.post('/remove-all-documents', async (req, res) => {
    try {
        await removeAllDocuments();
        res.json({ message: 'Barcha hujjatlar muvaffaqiyatli o\'chirildi' });
    } catch (error) {
        console.error('Hujjat o\'chirishda xatolik:', error);
        res.status(500).json({ error: 'Hujjat o\'chirishda xatolik yuz berdi.' });
    }
});

export default router;

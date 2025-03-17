import { pipeline } from '@xenova/transformers';

class HuggingFaceModel {
    constructor() {
        this.model = null;
        this.init();
    }

    async init() {
        try {
            console.log('Model yuklanmoqda...');
            // Eng ishonchli model
            this.model = await pipeline('text-generation', 'meta-llama/Llama-3.1-8B', {
                quantized: false,
                local: true,
                cache_dir: './models/cache',
                revision: 'main'
            });
            console.log('Model muvaffaqiyatli yuklandi');
        } catch (error) {
            console.error('Model yuklanishida xatolik:', error);
            throw error;
        }
    }

    async invoke(messages) {
        try {
            if (!this.model) {
                await this.init();
            }

            // Xabarlarni model uchun formatlash
            const prompt = messages.map(msg => {
                if (msg.role === 'system') {
                    return `Tizim: ${msg.content}\n\n`;
                } else if (msg.role === 'user') {
                    return `Foydalanuvchi: ${msg.content}\n\n`;
                }
                return `Bot: ${msg.content}\n\n`;
            }).join('') + 'Bot:';

            // Javob generatsiya qilish
            const result = await this.model(prompt, {
                max_new_tokens: 64,
                temperature: 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.9,
                pad_token_id: this.model.tokenizer.eos_token_id,
                eos_token_id: this.model.tokenizer.eos_token_id
            });

            // Javobni tozalash
            const response = result[0].generated_text
                .split('Bot:').pop()
                .split('Foydalanuvchi:')[0]
                .trim();

            return {
                content: response || "Kechirasiz, hozir javob bera olmadim. Iltimos, qayta urinib ko'ring."
            };
        } catch (error) {
            console.error('Javob generatsiya qilishda xatolik:', error);
            throw error;
        }
    }
}

const model = new HuggingFaceModel();
export default model;

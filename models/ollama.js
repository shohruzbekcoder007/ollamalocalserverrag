class OllamaModel {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.model = 'gemma2:9b';
        // this.model = 'llama3.2:3b';
    }

    async invoke(messages) {
        console.log('messages', messages)
        try {
            let prompt = '';
            let user = '';
            let assistant = '';
            messages.forEach(msg => {
                if (msg.role === 'system') {
                    prompt = prompt + (` ${msg.content}`);
                } else if (msg.role === 'user') {
                    user = user + (` ${msg.content}`);
                }else if (msg.role === 'assistant') {
                    assistant = assistant + (` ${msg.content}`);
                }
            });

            console.log(prompt, user, assistant, "<--prompt, user, assistant");

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: (prompt +user).trim(),
                    // system: prompt.trim(),
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_k: 40,
                        top_p: 0.9,
                        repeat_penalty: 1.1,
                        max_tokens: 500
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API xatoligi: ${response.status}`);
            }

            const text = await response.text();
            console.log('Raw response:', text);
            
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Raw response:', text);
                throw new Error('Invalid JSON response from Ollama API');
            }

            return {
                content: result.response || "Kechirasiz, hozir javob bera olmadim. Iltimos, qayta urinib ko'ring."
            };
        } catch (error) {

            console.error('Ollama modelida xatolik:', error);
            throw error;
        }
    }
}

const model = new OllamaModel();
export default model;

class OllamaModel {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.model = 'gemma2:9b';
        // this.model = 'llama3.2:3b';
    }

    async invoke(messages) {
        console.log('messages', messages)
        try {
            let prompt = ``;
            let user = ``;
            let assistant = ``;
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

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "gemma2:9b",
                  messages: [
                    { "role": "system", "content": `${prompt}` },
                    { "role": "user", "content": `${user}` }
                  ]
                })
              })

            // const response = await fetch(`${this.baseUrl}/api/generate`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         model: this.model,
            //         prompt: prompt,
            //         stream: false,
            //         options: {
            //             temperature: 0.5,  // Kamroq randomness
            //             top_k: 10,
            //             top_p: 0.8,
            //             repeat_penalty: 1.1,
            //             max_tokens: 300,  // Kamroq token ishlatish
            //             num_threads: 4  // CPU yadrolaridan samarali foydalanish
            //         }
            //     }),
            //     // signal: controller.signal  // Timeout signal
            // });

            if (!response.ok) {
                throw new Error(`Ollama API xatoligi: ${response.status}`);
            }

            const result = await response.json();
            return {
                // content: "Kechirasiz, hozir javob bera olmadim. Iltimos, qayta urinib ko'ring."
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

const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_TIMEOUT_MS = 15000;

/** Send grounded chat messages to Zhipu GLM-4 and return its text response. */
const chatCompletion = async ({ messages, temperature = 0.3 }) => {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) throw new Error('ZHIPU_API_KEY is not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
        const response = await fetch(ZHIPU_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'glm-4', messages, temperature }),
            signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Zhipu chat completion failed (${response.status}): ${JSON.stringify(data)}`);
        }
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Zhipu chat completion returned empty content');
        return content;
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = { chatCompletion };

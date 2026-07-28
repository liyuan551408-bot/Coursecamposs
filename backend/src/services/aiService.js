const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

/**
 * 将文本转换为 512 维向量
 * @param {string} text 
 */
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: "embedding-3",
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ 调用智谱 AI 向量接口失败:", error);
    throw error;
  }
};

// 导出这个服务，让 Controller 可以调用
module.exports = {
  generateEmbedding
};
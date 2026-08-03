
const generateEmbedding = async (text) => {
  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: "embedding-3",
        input: text
      })
    });

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("智谱 API 返回格式异常: " + JSON.stringify(data));
    }

    // 智谱默认返回 2048 维真实数据
    const rawVector = data.data[0].embedding;
    
    // embedding-3 支持无损降维，我们直接截取前 512 维，完美匹配数据库的 vector(512)
    const vector = rawVector.slice(0, 512);
    
    console.log(`[AI 服务] 成功生成向量，前 5 个值为: ${vector.slice(0, 5).join(', ')}`);
    
    return vector;
  } catch (error) {
    console.error("调用智谱 AI 向量接口失败:", error);
    throw error;
  }
};

module.exports = {
  generateEmbedding
};
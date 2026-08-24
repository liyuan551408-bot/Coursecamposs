
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
      throw new Error("Zhipu API returned an unexpected format: " + JSON.stringify(data));
    }

    // Zhipu returns 2048-dimensional data by default.
    const rawVector = data.data[0].embedding;
    
    // embedding-3 supports dimensionality reduction, so use the first 512 dimensions to match vector(512).
    const vector = rawVector.slice(0, 512);
    
    console.log(`[AI Service] Embedding generated successfully. First 5 values: ${vector.slice(0, 5).join(', ')}`);
    
    return vector;
  } catch (error) {
    console.error("Failed to call Zhipu AI embedding API:", error);
    throw error;
  }
};

module.exports = {
  generateEmbedding
};

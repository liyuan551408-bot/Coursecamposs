const EMBEDDING_DIMENSIONS = 512;

const generateEmbedding = async (text) => {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new TypeError('Embedding input must be a non-empty string');
  }

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: "embedding-3",
        input: text,
        dimensions: EMBEDDING_DIMENSIONS
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Zhipu embedding request failed (${response.status}): ${JSON.stringify(data)}`);
    }
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Zhipu API returned an unexpected format: " + JSON.stringify(data));
    }

    const vector = data.data[0].embedding;
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected an ${EMBEDDING_DIMENSIONS}-dimensional embedding, got ${vector.length}`);
    }
    
    console.log(`[AI Service] Embedding generated successfully. First 5 values: ${vector.slice(0, 5).join(', ')}`);
    
    return vector;
  } catch (error) {
    console.error("Failed to call Zhipu AI embedding API:", error);
    throw error;
  }
};

module.exports = {
  generateEmbedding,
  EMBEDDING_DIMENSIONS
};

const aiService = require('../services/aiService');

// 测试生成向量的接口逻辑
const testEmbedding = async (req, res) => {
  try {
    // 从前端发来的请求体中获取文本
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: "请提供需要转换的文本字段 'text'" });
    }

    // 调用我们在 aiService 里写好的函数
    const vector = await aiService.generateEmbedding(text);
    
    // 成功后返回给前端（为了不刷屏，我们只展示前 5 个维度的数字）
    res.status(200).json({ 
      success: true, 
      dimension: vector.length, 
      preview: vector.slice(0, 5) 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: "服务器内部错误，AI 转换失败" });
  }
};

module.exports = {
  testEmbedding
};
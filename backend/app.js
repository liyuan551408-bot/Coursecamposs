<<<<<<< HEAD
require('dotenv').config();
=======
require('dotenv').config({ path: '../.env' });
>>>>>>> 507a73f592fd2983ac035660b30b79b95a2225a2

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
// 1. 配置全局中间件
app.use(cors()); 
app.use(express.json()); 

// 2. 引入路由文件
const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes'); // 👈 新增这一行：引入你写好的 AI 路由

// 3. 挂载路由
// 所有以 /api/courses 开头的请求交给 courseRoutes
app.use('/api/courses', courseRoutes);
// 所有以 /api/ai 开头的请求交给 aiRoutes 👈 新增这一行
app.use('/api/ai', aiRoutes); 
=======
// ===============================
// Check environment variables
// ===============================
if (!process.env.ZHIPU_API_KEY) {
  console.error("Failed to read ZHIPU_API_KEY, please check the .env file!");
  process.exit(1);
}

console.log("API Key successfully read: ", process.env.ZHIPU_API_KEY.substring(0, 8) + "******");

// ===============================
// Create OpenAI Client (Compatible with Zhipu)
// ===============================
const openai = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});
>>>>>>> 507a73f592fd2983ac035660b30b79b95a2225a2

app.use(cors());
app.use(express.json());

// ===============================
// AI Summary API
// ===============================
app.post('/api/ai-summary', async (req, res) => {
  try {
    const { reviews } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({
        success: false,
        error: "reviews must be an array"
      });
    }

    const combinedReviews = reviews
      .map((review) => `- ${review}`)
      .join("\n");

    const systemPrompt = `
You are an objective university course assistant.

Please summarize the reviews from these aspects:

1. Workload
2. Difficulty
3. Advantages
4. Disadvantages

Keep the tone neutral.
`;

    console.log("Calling glm-4-flash...");

    const completion = await openai.chat.completions.create({
      model: "glm-4-flash",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Reviews:\n${combinedReviews}`
        }
      ]
    });

    console.log("AI response successful");

    return res.json({
      success: true,
      summary: completion.choices[0].message.content
    });

  } catch (error) {

    console.error("\n============================");
    console.error("AI request failed");
    console.error("============================");

    console.error("Status:", error.status);
    console.error("Message:", error.message);

    if (error.response) {
      console.error("Response:");
      console.error(error.response.data);
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
      status: error.status || 500
    });
  }
});

// ===============================
// Start server
// ===============================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
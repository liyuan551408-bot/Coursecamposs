require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); // Import OpenAI

const app = express();
const PORT = 3000;

// 1. Initialize the official OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // baseURL is removed to default to the official API
});

// 2. Configure middleware
app.use(cors()); 
app.use(express.json());

// 3. Mock course data
const mockCourses = [
    { id: 1, name: "Advanced Mathematics", code: "MATH101", credits: 4 },
    { id: 2, name: "Introduction to Software Engineering", code: "SE201", credits: 3 }
];

// 4. Get course list endpoint
app.get('/api/courses', (req, res) => {
    res.json({ success: true, data: mockCourses });
});

// 5. AI summary endpoint
app.post('/api/ai-summary', async (req, res) => {
  try {
    const { reviews } = req.body;
    
    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({ error: 'Invalid reviews data provided' });
    }

    const combinedReviews = reviews.map(r => `- ${r}`).join('\n');
    const systemPrompt = `You are an objective university course assistant. Summarize the reviews covering: 1. Workload 2. Difficulty 3. Pros 4. Cons. Maintain a neutral tone.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the latest recommended model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Reviews:\n${combinedReviews}` }
      ],
    });

    // Return the AI summary result
    res.json({ success: true, summary: completion.choices[0].message.content });
  } catch (error) {
    // Catch and return errors (e.g., invalid API Key or network issues)
    res.status(500).json({ error: error.message });
  }
});

// 6. Start the server
app.listen(PORT, () => {
    console.log(`Your Express backend server has started successfully!`);
    console.log(`Listening at: http://localhost:${PORT}`);
});
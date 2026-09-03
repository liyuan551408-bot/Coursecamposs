require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 1. Configure global middleware
app.use(cors()); 
app.use(express.json()); 

// 2. Import route files
const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');

// 3. Mount routes
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// 4. Start server listener
app.listen(PORT, () => {
    console.log(`Your Express backend server has started successfully.`);
    console.log(`Listening at: http://localhost:${PORT}`);
});

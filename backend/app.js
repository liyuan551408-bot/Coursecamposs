require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const planRoutes = require('./src/routes/planRoutes');
const savedCourseRoutes = require('./src/routes/savedCourseRoutes');

app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/saved-courses', savedCourseRoutes);

app.listen(PORT, () => {
    console.log(`Your Express backend server has started successfully.`);
    console.log(`Listening at: http://localhost:${PORT}`);
});

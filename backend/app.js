/** @file Bootstraps the Express API, installs shared middleware, mounts routes, and starts the server. */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;


// ================================
// Middleware
// ================================

app.use(cors());
app.use(express.json());


// ================================
// Routes
// ================================

const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const planRoutes = require('./src/routes/planRoutes');
const savedCourseRoutes = require('./src/routes/savedCourseRoutes');


// Health check for CI
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CourseCompass API is running'
    });
});


app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/saved-courses', savedCourseRoutes);


// ================================
// Start server
// ================================

app.listen(PORT, () => {
    console.log('Your Express backend server has started successfully.');
    console.log(`Listening at: http://localhost:${PORT}`);
});

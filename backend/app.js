const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 1. Configure global middleware
app.use(cors()); 
app.use(express.json()); 

// 2. Import the routing file you just wrote!
const courseRoutes = require('./src/routes/courseRoutes');
const userRoutes = require('./src/routes/userRoutes');
const authRoutes = require('./src/routes/authRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const planRoutes = require('./src/routes/planRoutes');
const savedCourseRoutes = require('./src/routes/savedCourseRoutes');

// 3. Mount routes
// It means: all requests starting with /api/courses are handed over to courseRoutes for processing
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/plans',planRoutes);
app.use('/api/saved-courses', savedCourseRoutes);

// 4.
app.listen(PORT, () => {
    console.log(`Your Express backend server has started successfully!`);
    console.log(`Listening at: http://localhost:${PORT}`);
});
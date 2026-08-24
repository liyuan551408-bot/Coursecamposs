const express = require('express');
const router = express.Router();

// Import controller.
const courseController = require('../controllers/courseController');

// Define GET /api/courses and delegate it to getCourses.
router.get('/', courseController.getCourses);

module.exports = router;

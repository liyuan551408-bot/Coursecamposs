const express = require('express');
const controller = require('../controllers/subjectController');
const { verifyToken } =
    require('../middlewares/authMiddleware');
const { requireRole } =
    require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/', controller.listSubjects);

router.post(
    '/',
    verifyToken,
    requireRole('ADMIN'),
    controller.createSubject
);

router.patch(
    '/:id',
    verifyToken,
    requireRole('ADMIN'),
    controller.updateSubjectName
);

module.exports = router;

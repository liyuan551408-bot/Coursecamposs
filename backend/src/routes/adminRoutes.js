const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createStaffUser);
router.patch('/users/:id/role', adminController.changeUserRole);

module.exports = router;

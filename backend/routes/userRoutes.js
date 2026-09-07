const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');

router.get('/:id', verifyToken, getUserProfile);
router.put('/:id', verifyToken, updateUserProfile);

module.exports = router;
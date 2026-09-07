const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  getRecommendations,
} = require('../controllers/userController');

router.get('/:id', verifyToken, getUserProfile);
router.put('/:id', verifyToken, updateUserProfile);
router.get('/:id/recommendations', verifyToken, getRecommendations);

module.exports = router;
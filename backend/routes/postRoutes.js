const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createPost,
  getFeed,
  toggleLike,
  addComment,
} = require('../controllers/postController');

router.post('/', verifyToken, createPost);
router.get('/feed', verifyToken, getFeed);
router.put('/:id/like', verifyToken, toggleLike);
router.post('/:id/comment', verifyToken, addComment);

module.exports = router;

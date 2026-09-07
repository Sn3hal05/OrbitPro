const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { rewriteContent } = require('../controllers/aiController');

router.post('/rewrite', verifyToken, rewriteContent);

module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getMyConnections,
  getConnectionStatus,
} = require('../controllers/connectionController');

router.post('/request/:userId', verifyToken, sendConnectionRequest);
router.patch('/:id/accept', verifyToken, acceptConnection);
router.patch('/:id/reject', verifyToken, rejectConnection);
router.get('/mine', verifyToken, getMyConnections);
router.get('/status/:userId', verifyToken, getConnectionStatus);

module.exports = router;

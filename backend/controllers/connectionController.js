const Connection = require('../models/Connection');

exports.sendConnectionRequest = async (req, res) => {
  try {
    const toUserId = req.params.userId;
    const fromUserId = req.user.id;

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot connect to yourself' });
    }

    // Check if connection already exists in either direction
    const existing = await Connection.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message: 'A connection or request already exists between these users',
        connection: existing,
      });
    }

    const connection = await Connection.create({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'pending',
    });

    res.status(201).json(connection);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.acceptConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the recipient can accept this connection request' });
    }

    connection.status = 'accepted';
    await connection.save();

    res.json(connection);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.rejectConnection = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the recipient can reject this connection request' });
    }

    connection.status = 'rejected';
    await connection.save();

    res.json(connection);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    // Accepted connections (either direction) + pending ones received (not sent)
    const connections = await Connection.find({
      $or: [
        { status: 'accepted', fromUser: userId },
        { status: 'accepted', toUser: userId },
        { status: 'pending', toUser: userId },
      ],
    })
      .populate('fromUser', 'name bio')
      .populate('toUser', 'name bio')
      .sort({ updatedAt: -1 });

    res.json(connections);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getConnectionStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    const connection = await Connection.findOne({
      $or: [
        { fromUser: currentUserId, toUser: targetUserId },
        { fromUser: targetUserId, toUser: currentUserId },
      ],
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    res.json({
      status: connection.status,
      isSender: connection.fromUser.toString() === currentUserId,
      connectionId: connection._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

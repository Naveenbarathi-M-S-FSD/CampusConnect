const router = require('express').Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const getRoomId = (id1, id2) => [id1, id2].sort().join('_');

// Get conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const roomId = getRoomId(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ roomId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 });
    // Mark as read
    await Message.updateMany({ roomId, receiver: req.user._id, isRead: false }, { isRead: true });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content, messageType } = req.body;
    const roomId = getRoomId(req.user._id.toString(), receiverId);
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      roomId,
      content,
      messageType: messageType || 'text'
    });
    await message.populate('sender', 'name avatar role');
    const io = req.app.get('io');
    io.to(roomId).emit('receive_message', message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get recent chats
router.get('/recent', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort({ createdAt: -1 }).populate('sender receiver', 'name avatar role');
    
    const seenRooms = new Set();
    const recent = [];
    for (const msg of messages) {
      if (!seenRooms.has(msg.roomId)) {
        seenRooms.add(msg.roomId);
        const other = msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
        const unread = await Message.countDocuments({ roomId: msg.roomId, receiver: req.user._id, isRead: false });
        recent.push({ roomId: msg.roomId, user: other, lastMessage: msg, unread });
      }
    }
    res.json(recent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

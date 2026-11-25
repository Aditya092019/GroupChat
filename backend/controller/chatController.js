const Message = require('../Models/chatModel');
const {Users} = require('../Models/userModel');


exports.sendMessage = async (req, res) => {
  try {
    const text = (req.body.message || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const saved = await Message.create({ message: text, UserId: req.user.id });

    const data = {
      id: saved.id,
      userId: req.user.id,
      name: req.user.name,
      text: saved.message,
      createdAt: saved.createdAt,
    };

    req.app.get('io').emit('newMessage', data);   // sends to all connected clients

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not save message' });
  }
};


exports.getMessages = async (req, res) => {
  try {
    const rows = await Message.findAll({
      include: [{ model: Users, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      currentUser: { id: req.user.id, name: req.user.name },
      data: rows.map(m => ({
        id: m.id,
        userId: m.UserId,
        name: m.User ? m.User.name : 'Unknown',
        text: m.message,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load messages' });
  }
};
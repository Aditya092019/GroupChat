const jwt = require('jsonwebtoken');
const {Users} = require('../Models/userModel'); 
require('dotenv').config();      

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await Users.findByPk(payload.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
const jwt = require('jsonwebtoken');
const { Users } = require('../Models/userModel');

module.exports = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Token missing'));

        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const user = await Users.findByPk(payload.userId);
        if (!user) return next(new Error('User not found'));

        socket.user = { id: user.id, name: user.name };
        next();
    } catch (err) {
        next(new Error('Invalid or expired token'));
    }
};
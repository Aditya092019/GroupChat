const { Server } = require('socket.io');
const authMiddleware = require('./middleware');
const registerChatHandlers = require('./handlers/chat');

module.exports = (httpServer) => {
    const io = new Server(httpServer, { cors: { origin: '*' } });

    io.use(authMiddleware);

    io.on('connection', (socket) => {
        registerChatHandlers(io, socket);
    });

    return io;
};
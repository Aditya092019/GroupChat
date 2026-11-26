const { Server } = require('socket.io');
const authMiddleware = require('./middleware');
const registerChatHandlers = require('./handlers/chat');
const registerPersonalChatHandlers = require('./handlers/personalChat');

module.exports = (httpServer) => {
    const io = new Server(httpServer, { cors: { origin: '*' } });

    io.use(authMiddleware);

    io.on('connection', (socket) => {
        registerChatHandlers(io, socket);
        registerPersonalChatHandlers(io, socket);
    });

    return io;
};
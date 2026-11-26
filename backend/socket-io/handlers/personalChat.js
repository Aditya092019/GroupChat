const crypto = require('crypto');


const roomFor = (a, b) => `personal_${Math.min(a, b)}_${Math.max(a, b)}`;

module.exports = (io, socket) => {
    
    socket.on('join_room', ({ otherUserId }) => {
        if (!otherUserId || Number(otherUserId) === socket.user.id) return;

        const room = roomFor(socket.user.id, Number(otherUserId));
        socket.join(room);
        socket.emit('room_joined', { room });
    });

    
    socket.on('new_message', ({ room, message }) => {
        const text = (message || '').trim();
        if (!text) return;
        if (!socket.rooms.has(room)) return;       

        io.to(room).emit('new_message', {
            id: crypto.randomUUID(),
            room,
            userId: socket.user.id,                
            name: socket.user.name,
            text,
            createdAt: new Date(),
        });
    });
};
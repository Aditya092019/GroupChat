module.exports = (io, socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.user.name);

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.user.name);
    });

};
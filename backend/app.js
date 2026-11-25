const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const cors = require('cors');
const db = require("./utils/db-connection");
const router = require("./routes/userRouter");
const PORT = 3000;
const {Users} = require('./Models/userModel');
const Message = require('./Models/chatModel');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", router);


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.use(async (socket, next) => {
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
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.user.name);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.user.name));
});

Users.hasMany(Message);
Message.belongsTo(Users);

db.authenticate()
    .then(() => {
        console.log("Database connected successfully");
        return db.sync();
    })
    .catch((error) => {
        console.log("Database connection failed:", error);
    });

server.listen(PORT,()=>{
    console.log(`Server started at port ${PORT}`);
})
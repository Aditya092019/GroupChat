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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", router);


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
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
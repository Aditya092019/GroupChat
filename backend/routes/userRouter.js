const express = require('express');
const router = express.Router();
const userRoutes = require("../controller/userController");
const auth = require("../middleware/auth");
const chatController = require("../controller/chatController");


router.post("/users/signup", userRoutes.bodyController);
router.post("/users/login", userRoutes.loginController);


router.post('/chat/send', auth, chatController.sendMessage);
router.get('/chat/messages', auth, chatController.getMessages);


module.exports = router;
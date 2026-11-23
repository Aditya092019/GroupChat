const { Users } = require('../Models/userModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
require('dotenv').config();


const bodyController = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await Users.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or phone already registered"
            });
        }

        const saltRounds = 10;

        const hashedPassword = await bcrypt.hash(
            password,
            saltRounds
        );

        await Users.create({
            name,
            email,
            phone,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        next(error);
    }
};



const loginController = async (req, res, next) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({
                message: "Email/phone and password are required"
            });
        }

        const existingUser = await Users.findOne({
            where: {
                [Op.or]: [
                    { email: loginId },
                    { phone: loginId }
                ]
            }
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            existingUser.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        const token = generateAccessToken(existingUser.id);

        return res.status(200).json({
            message: "Login successful",
            jwtToken: token,
            user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                phone: existingUser.phone
            }
        });

    } catch (error) {
        next(error);
    }
};



function generateAccessToken(id) {
    return jwt.sign(
        { userId: id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

module.exports = {
    bodyController,
    loginController
};

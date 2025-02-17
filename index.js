import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Student from './Student.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const mongoDBUrl = process.env.mongoDBUrl;

app.use(cors());
app.use(express.json());

const validateInput = (req, res, next) => {
    const { email, mobile } = req.body;
    const patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
        mobile: /^[6-9]\d{9}$/
    };
    
    if (email && !patterns.email.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email..!!' });
    }
    if (mobile && !patterns.mobile.test(mobile)) {
        return res.status(400).json({ message: 'Please enter a valid mobile number..!!' });
    }
    next();
};

const authenticateUser = async (req, res, next) => {
    const { email, mobile, password } = req.body;
    if (!email && !mobile) {
        return res.status(400).json({ message: 'Email or Mobile is required..!!' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password is required..!!' });
    }
    
    const user = await Student.findOne({ $or: [{ email }, { mobile }], password });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email/mobile or password..!!' });
    }
    req.user = user;
    next();
};

app.post('/register', validateInput, async (req, res) => {
    try {
        const { email, mobile, ...userData } = req.body;
        const existingUser = await Student.findOne({ $or: [{ email }, { mobile }] });
        
        if (existingUser) {
            const msg = existingUser.email === email ? 'Email' : 'Mobile';
            return res.status(400).json({ message: `${msg} already exists..!!` });
        }
        
        await Student.create({ email, mobile, ...userData, address: [] });
        res.status(201).json({ message: 'User Successfully Inserted..!!' });
    } catch (error) {
        console.error('Error in /register:', error);
        res.status(500).json({ message: 'Something Went Wrong..!!' });
    }
});

app.post('/login', authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        if (!user.token) {
            user.token = crypto.randomBytes(16).toString('hex');
            await user.save();
        }
        res.status(200).json({
            email: user.email,
            mobile: user.mobile,
            token: user.token
        });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ message: 'Internal Server Error..!!' });
    }
});

app.post('/address', authenticateUser, async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ message: 'Address cannot be empty..!!' });
        }
        
        req.user.address.push(address);
        await req.user.save();

        res.status(200).json({ message: 'User Address Added Successfully..!!' });
    } catch (error) {
        console.error('Error in /address:', error);
        res.status(500).json({ message: 'Something Went Wrong..!!' });
    }
});

app.get('/me', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required..!!' });
        }
        
        const user = await Student.findOne({ token });
        if (!user) {
            return res.status(404).json({ message: `No user found for the token ${token}` });
        }
        
        res.status(200).json({
            email: user.email,
            name: `${user.firstname} ${user.lastname}`,
            mobile: user.mobile,
            address: user.address
        });
    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({ message: 'Something Went Wrong..!!' });
    }
});

mongoose
    .connect(mongoDBUrl)
    .then(() => {
        console.log('DB connected');
        app.listen(PORT, () => console.log(`Server is running on PORT : ${PORT}`));
    })
    .catch((error) => {
        console.error('DB Connection Error:', error);
    });

import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose';
import Student from './Student.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config()
const app = express()

const PORT = process.env.PORT || 3000
const url = process.env.mongoDBUrl

app.use(cors())
app.use(express.json())

function validate(res, fields) {
    const patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        mobile: /^[6-9]\d{9}$/
    };
    for (const [field, value] of Object.entries(fields)) {
        if (!patterns[field].test(value)) {
            return returnResponse(res, `Please enter a valid ${field}..!!`, 400);
        }
    }
    return true;
}

function returnResponse(res, msg, statusCode) {
    return res.status(statusCode).json({ message: msg });
}

app.post('/register', async (req, res) => {
    try {
        const { email, mobile, ...userData } = req.body;

        if (!validate(res, { email, mobile })) return;
        const existingUser = await Student.findOne({ $or: [{ email }, { mobile }] });

        if (existingUser) {
            let msg
            if (existingUser.email === email) msg = "Email"
            if (existingUser.mobile === mobile) msg = "Mobile"
            return returnResponse(res, `${msg} already exists..!!`, 400);
        }
        await Student.create({ email, mobile, ...userData, address: [] });
        return returnResponse(res, "User Successfully Inserted..!!", 201);
    } catch (error) {
        console.error("Error in /register:", error);
        return returnResponse(res, "Something Went Wrong..!!", 500);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if (!password || (!email && !mobile)) {
            return returnResponse(res, "Email or Mobile and Password are required..!!", 400);
        }

        const user = await Student.findOne({ 
            $or: [{ email }, { mobile }], 
            password 
        });

        if (!user) return returnResponse(res, "Invalid email/mobile or password..!!", 401);

        if (!user.token) {
            user.token = crypto.randomBytes(16).toString('hex');
            await user.save();
        }

        return res.status(200).json({
            email: user.email,
            mobile: user.mobile,
            token: user.token
        });

    } catch (error) {
        console.error("Error in /login:", error);
        return returnResponse(res, "Internal Server Error..!!", 500);
    }
});


app.post('/address', async (req, res) => {
    try {
        const { email, mobile, password, address } = req.body;

        if (!email && !mobile) {
            return returnResponse(res, "Email or Mobile is required..!!", 400);
        }
        if (!password) {
            return returnResponse(res, "Password is required..!!", 400);
        }
        if (!address) {
            return returnResponse(res, "Address cannot be empty..!!", 400);
        }

        const user = await Student.findOne({ 
            $or: [{ email }, { mobile }], 
            password 
        });

        if (!user) {
            return returnResponse(res, "User does not exist, please register..!!", 400);
        }

        user.address.push(address);
        await user.save();

        return returnResponse(res, "User Address Added Successfully..!!", 200);
    } catch (error) {
        return returnResponse(res, "Something Went Wrong..!!", 500);
    }
});


app.get('/me', async (req, res) => {
    try {
        const { token } = req.body
        const user = await Student.findOne({ token })
        let msg, status = 200
        if (!user) {
            msg = `No user found for the token ${token}`
            status = 404
        } 
        msg = {
            email: user.email,
            name: user.firstname + user.lastname,
            mobile: user.mobile,
            address: user.address
        }
        return returnResponse(res, msg, status)
    } catch (error) {
        return returnResponse(res, "Something Went Wrong..!!", 500)
    }
})

mongoose
    .connect(url)
    .then(() => {
        console.log("DB connected")
        app.listen(PORT, () => console.log(`Server is running on PORT : ${PORT}`))
    })
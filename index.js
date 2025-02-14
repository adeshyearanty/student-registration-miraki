import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose';
import Student from './Student.js';
import crypto from 'crypto';

const app = express()

const PORT = 3000;
const url = `mongodb+srv://root:root@book-store-mern.gkvi8ub.mongodb.net/miraki?retryWrites=true&w=majority&appName=my-connection`

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: "Hello"
    })
})

app.post('/register', async (req, res) => {
    try {
        const { email, mobile } = req.body
        const emailExisting = await Student.findOne({ email })
        const mobileExisting = await Student.findOne({ mobile })
        if (emailExisting) {
            return res.status(400).json({
                message: "Email already exists..!!" 
            })
        } else if (mobileExisting) {
            return res.status(400).json({
                message: "Mobile already exists..!!"
            })
        }
        const user = req.body
        if (req.body.mobile.toString().length == 10) {
            user.address = []
            await Student.create(user)
            return res.status(200).json({
                message: "User Successfully Inserted..!!" 
            })
        }
        res.status(400).json({
            message: "The length of Mobile Number should be 10..!!"
        })
    } catch (error) { 
        console.error(error)
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, mobile, password } = req.body
        let user
        if (email) {
            user = await Student.findOne({ email, password })
        } else if (mobile) {
            user = await Student.findOne({ mobile, password })
        } else {
            res.status(400).json({
                message: "email or mobile is required for login..!!"
            })
        }
        if (user.token) {
            return res.status(200).json({
                email: user.email,
                token: user.token
            })
        }
        const token = crypto.randomBytes(16).toString('hex')
        user.token = token
        await user.save()
        res.status(200).json({
            email: user.email,
            token: user.token
        })
    } catch (error) {
        console.error(error)
    }
})

app.post('/address', async (req, res) => {
    try {
        const { email, mobile, password, address } = req.body
        let user
        if (email) {
            user = await Student.findOne({ email, password })
        } else if (mobile) {
            user = await Student.findOne({ mobile, password })
        } else {
            return res.status(400).json({
                message: "email or mobile is required..!!"
            })
        }
        if (!user) {
            return res.status(404).json({
                message: "User does not exist..!!"
            })
        }
        user.address.push(address)
        await user.save()
        res.status(201).json({
            message: "Address Successfully Added..!!"
        })
    } catch (error) {
        console.error(error)
    }
})

app.get('/me', async (req, res) => {
    try {
        const { token } = req.body
        const user = await Student.findOne({ token })
        if (!user) {
            return res.status(404).json({
                message: `No user found for the token ${token}`
            })
        } 
        res.status(201).json({
            email: user.email,
            name: user.firstname + user.lastname,
            mobile: user.mobile,
            address: user.address
        })
    } catch (error) {
        console.error(error)
    }
})

mongoose
    .connect(url)
    .then(() => {
        console.log("DB connected")
        app.listen(PORT, () => console.log(`Server is running on PORT : ${PORT}`))
    })
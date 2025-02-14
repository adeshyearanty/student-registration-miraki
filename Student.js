import mongoose from "mongoose";
import 'mongoose-type-email';

const StudentSchema = mongoose.Schema(
    {
        email: {
            type: mongoose.SchemaTypes.Email,
            required: true,
            unique: true
        },
        mobile: {
            type: Number,
            required: true,
            unique: true
        },
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String
        },
        password: {
            type: String,
            required: true
        },
        token: {
            type: String
        },
        address: [
            {
                hno: { type: String, required: true },
                city: { type: String, required: true },
                state: { type: String, required: true}
            }
        ]
    }
)

const Student = mongoose.model("Studentregistration", StudentSchema)
export default Student
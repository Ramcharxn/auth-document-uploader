const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {   
        user: {
            type:String,
            required: true
        },
        password: {
            type:String,
            required: true
        },
        role: {
            type:String,
            required: true
        },
        phoneNumber: {
            type:Number,
            required: true
        },
    },
)

const userModel = new mongoose.model("user", userSchema);

module.exports = userModel;
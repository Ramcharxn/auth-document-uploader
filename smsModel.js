const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema(
    {   
        name: {
            type:String,
            required: true
        },
        phoneNumber: {
            type:String,
            required: true
        },
    },
)

const smsModel = new mongoose.model("sms", smsSchema);

module.exports = smsModel;
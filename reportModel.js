const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {   
        name: {
            type:String,
            required: true
        },
        date: {
            type:String,
            required: true
        },
        verified : {
            type:String,
            required: true
        },
        file: {
            type:String,
            required: true
        },
        fileName : {
            type:String,
            required: true
        },
        fileType: {
            type:String,
            required: true
        },
        description : {
            type:String,
            // required: true
        },
        smsDetails : {
            type:Number,
            default: 0,
        },
        remarks : {
            type:String,
            // required: true
        },
    },{timestamps: true}
)

const reportModel = new mongoose.model("report", reportSchema);

module.exports = reportModel;
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
            type:Array,
            required: true
        },
        lastUpdate: {
            type: String,
        },
        updateCount :{
            type: Number,
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
        clarification : {
            type:String,
            // required: true
        },
    },{timestamps: true}
)

const reportModel = new mongoose.model("report", reportSchema);

module.exports = reportModel;
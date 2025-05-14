const mongoose = require("mongoose");


const abotSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    phoneNumber:{
        type: Number,
        required: true
    },
    message:{
        type: String,
        required: true
    }
});


module.exports = mongoose.model("About", abotSchema);
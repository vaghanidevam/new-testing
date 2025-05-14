const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true, 
    },
    password: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ["Admin", "Student", "Instructor"], 
        required: true
    },
    additionalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Profile"
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    // enrolledCourse:[
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Course"
    //     }
    // ],
    image: {
        type: String,
        required: true 
    },
    approved: {
        type: Boolean,
        default: true,
    },
    courseProgress: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CourseProgress"
        }
    ],
    resetPasswordExpires:{
        type: Date
    },active: {
        type: Boolean,
        default: true,
    },
    phoneNumver: {
        type:Number,
        required: true,
    }
});

module.exports = mongoose.model("User", userSchema);

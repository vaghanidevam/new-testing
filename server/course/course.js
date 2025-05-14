const mongoose = require("mongoose");
const { isErrored } = require("nodemailer/lib/xoauth2");

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    trim: true,
    required: true
  },
  courseDescription: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  whatYouWillLearn: {
    type: String
  },
  courseContent: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Section",
		},
	],
  ratingAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatingAndReview"
    }
  ],
  price: {
    type: Number
  },
  thumbnail: {
    type: String
  },
  tag:[

{type: String,
  required: true,}
  ] 
		
	,
  studentEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  ],
  category: {
		type: mongoose.Schema.Types.ObjectId,
		// required: true,
		ref: "Category",
	},
  status: {
    type: String,
    enum: ['pending', 'completed'],  
    default: 'pending', 
},
isEnrolled:{
  type: Boolean,
  default: false
}
});

module.exports = mongoose.model("Course", courseSchema);

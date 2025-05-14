// Import the required modules
const mongoose = require("mongoose")
const express = require("express")
const router = express.Router()
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });
const Course = require("../course/course");
const User = require("../user/user");
const Paymets = require("../payment/payment");
const {mailSender} =  require("../utils/mailSender");



const{
  createCheckoutSession
}  = require("../payment/paymentsController")

// Course Controllers Import
const {
  createCourse,
  updateCourse,
  getInstructorCourses,
  getFullCourseDetails,
  getAllCourses,
  getCourseDetails,
  UploadImage,
  publishCourse,
  getprivateCourses,
  getpublicCourses,
  deleteCourseDetails,
  getCourse,
  getCourses,
  getFullCourse,
  getMyCourses,getMyCoursesDetails
} = require("../course/courseController")

const {
  updateCourseProgress
}=require("../courseProgress/courseProgressController");

// const {stripeWebhookHandler} =  require("../payment/stripeWebhookController.js")


// Categories Controllers Import
const {
  showAllCategories,
  createCategory,
  categoryPageDetails,
} = require("../category/categoryController")

// Sections Controllers Import
const {
  createSection,
  updateSection,
  deleteSection,
  showAllSections,
} = require("../section/sectionController")

// Sub-Sections Controllers Import
const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
  getSubSection,
  getSingleSubSection,
  
} = require("../subSection/subSectionController")

// Rating Controllers Import
const {
  createRating,
  getAverageRating,
  getAllRating,
} = require("../ratingAndReview/ratingAndReviewController")

// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can Only be Created by Instructors
router.post("/createCourse", auth, createCourse);

router.post("/uploadImage",    auth,upload.single('image'), UploadImage)
//Edit Course
router.post("/updateCourse",auth,upload.single('image'),updateCourse);
// get course data 

router.get("/getCourse/:courseId", auth, getCourse);

//Instructor Courses
router.get("/getInstructorCourses",auth,isInstructor,getInstructorCourses);
//Get All courses Details
router.get("/getFullCourseDetails",auth,getFullCourseDetails);
//Add a Section to a Course`
router.post("/addSection", auth, createSection)
//get all section of course
router.get("/getAllSections", auth , showAllSections)
// Update a Section
router.post("/updateSection", auth, updateSection)
// Delete a Section
router.post("/deleteSection", auth, deleteSection)
// get all subsection as per section
router.post("/getallaubaection", auth, getSubSection)
// Edit Sub Section
router.post("/updateSubSection", auth, upload.single("video"), updateSubSection)
// Delete Sub Section
router.post("/deleteSubSection", auth, deleteSubSection)
// Add a Sub Section to a Section
router.post("/helo", auth, isInstructor, deleteCourseDetails)
router.post(
  "/addSubSection",
  auth,
  upload.single("video"), // "video" should match the key you use in frontend FormData
  createSubSection
);
// get single subsection data 
router.post("/getSingleSubSection", auth, getSingleSubSection)
// publish course

router.post("/publishCourse", auth, publishCourse);
// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)
// get public course 
router.get("/getpublicCourses", auth, getpublicCourses);
//get private course
router.get("/getprivateCourses", auth , getprivateCourses);

// router.post("/updateCourseProgress",auth,isStudent,updateCourseProgress);

//get all course data

router.get("/getCourses", getCourses)

// get full course detials 
router.get("/getFullCourse/:id",auth, getFullCourse);

// get my courses
router.get("/getMyCourses", auth, getMyCourses);



router.get("/getMyCoursesDetails/:courseId", auth, getMyCoursesDetails);
// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/createCategory", auth, createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)



// ********************************************************************************************************
//                                      payment
// ********************************************************************************************************

router.post("/create-session", auth, createCheckoutSession);
// ... (previous code remains unchanged)

// ********************************************************************************************************
//                                      payment
// ********************************************************************************************************

router.post("/create-session", auth, createCheckoutSession);


// ********************************************************************************************************
//                                      Stripe Webhook
// ********************************************************************************************************

const stripe = require('stripe')('sk_test_51RMN2bIGCsnWSTOBJI5A1xYouI452VgkkK5uwVVBc5Atx1ZtuRX6mFfsA3mq9xFLTve9DzvS843oQ78IgKgecexb00GHlGrvLl');
const endpointSecret = 'whsec_d8a3bb40fe666a2bb4dba2fc14f2e236507893a5f23009f24580665862b95bfb';

// Place this route at the top of your file
router.post('/stripe-webhook', express.raw({type: 'application/json'}), async(req, res) => {
  console.log("Webhook received");
  
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    console.log("Constructing event");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Event constructed successfully");
   
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
console.log("Event type :", event.id)
  switch (event.type) {
    case 'checkout.session.completed':
      console.log("helo")
      const paymentIntent = event.data.object;
      if (paymentIntent.status === "complete") {
     const payment =   await Paymets.create({
      courseId: paymentIntent.metadata.courseId,
      paymentStatus: 'completed',
      userId: paymentIntent.metadata.userId,
      amount: paymentIntent.metadata.amount,
    });
        const course = await Course.findByIdAndUpdate(paymentIntent.metadata.courseId,{
          $push:{studentEnrolled: paymentIntent.metadata.userId}
        });
        const user = await User.findByIdAndUpdate(paymentIntent.metadata.userId,{
          $push: {courses: paymentIntent.metadata.courseId}
        });
        console.log(
          course,
          user
        )
      }
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log('PaymentIntent failed!', failedPaymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).send('Received');
});



module.exports = router
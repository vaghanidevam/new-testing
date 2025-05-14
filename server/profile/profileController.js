const Profile = require("../profile/profile")
const User = require("../user/user")
const Course = require("../course/course")
const { uploadToCloudinary } = require('../utils/imageUpload');
const { convertSecondsToDuration } = require("../utils/secToDuration")
const CourseProgress = require('../courseProgress/courseProgress')


exports.updateProfile = async (req, res) => {
    try {
      console.log("helo")
        const { dateOfBirth = "", about = "", gender } = req.body;
        console.log(req.body)
        const id = req.user.id;
        console.log(id)
        if (!gender || !id) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }

        const user = await User.findById(id)
        const profileId = user.additionalDetails;
        const profile = await Profile.findById(profileId);
        console.log(profile)

        profile.dateOfBirth = dateOfBirth;
        profile.about = about;
        profile.gender = gender;
        const updatedDetails =   await profile.save()
   
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            updatedDetails:updatedDetails,
          })
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Couldnt update profile,please try again",
            error:error.message,
          })
    }
}


exports.deleteAccount = async (req, res) => {
    try {
        // get id
        const id = req.User.id;
        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({
                success:false,
                message:"User not found",
              })
        }
        let profileId=user.additionalDetails;
        await Profile.findByIdAndDelete({_id:profileId});
        for(cour of user.courses){
            await Course.findByIdAndDelete(cour)
        }
        await User.findByIdAndDelete({_id:id});
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully"
          })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Couldnt delete account,please try again",
            error:err.message,
          })
    }
}


//get user datials  

exports.getAllUserDetails = async (req, res) => {
  try {
 
    const id = req.user.id;
    console.log(id);

    const userDetails = await User.findById(id)
      .populate("additionalDetails") 
      .exec();

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      userDetails,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Couldn't fetch details, please try again",
      error: err.message,
    });
  }
};


exports.updateDisplayPicture = async (req, res) => {
  try {
    console.log("helo")
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

      if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageUrl = await uploadToCloudinary(req.file.path, 'my-folder');

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { image: imageUrl },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      url: imageUrl,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading image",
      error: error.message,
    });
  }
};
  

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path:"courses",
          populate:{
            path:"courseContent",
            populate:{
              path:"subSection"
            }
          }
        })
        .exec()
  
  
        const userDetailsNew = userDetails.toObject()
        var SubsectionLength = 0
        for (var i = 0; i < userDetailsNew.courses.length; i++) {
          let totalDurationInSeconds = 0
          SubsectionLength = 0
          for (var j = 0; j < userDetailsNew.courses[i].courseContent.length; j++) {
            totalDurationInSeconds += userDetailsNew.courses[i].courseContent[
              j
            ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
            userDetailsNew.courses[i].totalDuration = convertSecondsToDuration(
              totalDurationInSeconds
            )
            SubsectionLength +=
              userDetailsNew.courses[i].courseContent[j].subSection.length
          }
          let courseProgressCount = await CourseProgress.findOne({
            courseID: userDetails.courses[i]._id,
            userId: userId,
          })
          courseProgressCount = courseProgressCount?.completedVideos.length
          if (SubsectionLength === 0) {
            userDetailsNew.courses[i].progressPercentage = 100
          } else {
            // To make it up to 2 decimal point
            const multiplier = Math.pow(10, 2)
            userDetailsNew.courses[i].progressPercentage =
              Math.round(
                (courseProgressCount / SubsectionLength) * 100 * multiplier
              ) / multiplier
          }
        }
  
  
  
  
  
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetailsNew.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  };
  
  
  exports.instructorDashboard=async(req,res)=>{
    try{
      const courseDetails=await Course.find({
        instructor:req.user.id
      })
      const courseData=courseDetails?.map((course,index)=>{
        const totalStudentsEnrolled=course?.studentsEnrolled?.length;
        const totalAmountGenerated=totalStudentsEnrolled*course?.price;
  
  
        //create a new object with the additional fields
        const courseDataWithStats={
          _id:course?._id,
          courseName:course?.courseName,
          courseDescription:course?.courseDescription,
          totalStudentsEnrolled,
          totalAmountGenerated,
  
        }
  
        return courseDataWithStats;
    })
  
      return res.status(200).json({
        success:true,
        courses:courseData
      })
    }
    catch(error){
      console.error(error);
      res.status(500).json({
        success:false,
        message:"Internal Server error"
      })
    }
  }
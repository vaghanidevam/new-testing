const { UploadStream } = require("cloudinary")
const Course = require("../course/course")
const User = require("../user/user")
const { uploadToCloudinary } = require("../utils/imageUpload")
const Category = require("../category/category")
const Section = require('../section/section')
const SubSection = require('../subSection/subSection')
const mongoose = require("mongoose");


exports.createCourse = async (req, res) => {
  try {

   
    const userId = req.user.id;

    const {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag,
      category,
      status = "pending",
    } = req.body.courseData;


    // Check required fields
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !category
    ) {
 
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Fetch instructor details
    const instructorDetails = await User.findById(userId);

    if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors can create courses.",
      });
    }

    // Validate Category ObjectId
    const isValidCategoryId = mongoose.Types.ObjectId.isValid(category);

    if (!isValidCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format.",
      });
    }

    // Fetch category details
    const categoryDetails = await Category.findById(category);
   
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Create course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      tag,
      category: categoryDetails._id,
      status,
    });

    // Update instructor's course list
    await User.findByIdAndUpdate(
      userId,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    // Update category's course list
    await Category.findByIdAndUpdate(
      category,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    // Send response
    res.status(200).json({
      success: true,
      data: newCourse,
      id: newCourse._id,
      message: "Course created successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create course.",
      error: error.message,
    });
  }
};

// show or get all courses

exports.getAllCourses = async (req, res) => {

  try {
    const allCourses = await Course.find({}).populate().exec()
    return res.status(200).json({
      success: true,
      data: allCourses,
    })
  } catch (error) {
    console.log(error)
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    })
  }

}


exports.categoryPageDetails = async (req, res) => {
  try {
    const categoryId = req.body;

    const selectedCategory = await Category.findById(categoryId).populate().exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: 'data not found'
      })
    }
    const differentCategories = await Category.findById({ _id: { $ne: categoryId } }).populate().exec();

    return res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategories
      }
    })

  } catch (error) {
    console.log(error)
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    })
  }
}



// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}

exports.getFullCourseDetails = async (req, res) => {
  try {

    const { courseId } = req.query;

    const userId = req.user.id
    
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

 

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,

    })
  }
}

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
  
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec()

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.UploadImage = async (req, res) => {
  try {

    const { courseId } = req.body;
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
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { thumbnail: imageUrl },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      url: imageUrl,
      data: updatedCourse,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading image",
      error: error.message,
    });
  }
}

exports.publishCourse = async (req, res) => {
  try {

    const { courseId } = req.body;
   
    const result = await Course.findByIdAndUpdate(courseId, { status: "completed" }, { new: true });

    return res.status(200).json({
      success: true,
      message: "course published successfully",
      data: result,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.getpublicCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // 👉 Query params se page & limit lo (default: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 👉 Total course count (for frontend to calculate total pages)
    const totalCourses = await Course.countDocuments({ instructor: instructorId, status: "completed" });

    // 👉 Paginated data
    const course = await Course.find({ instructor: instructorId, status: "completed" })
      .skip(skip)
      .limit(limit).populate("category").exec();

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: course,
      pagination: {
        totalCourses,
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getprivateCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Get page and limit from query params, set defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the courses with pagination
    const courses = await Course.find({
      instructor: instructorId,
      status: "pending"
    })
      .skip(skip)
      .limit(limit).populate("category").exec();

    // Count total matching documents
    const totalCourses = await Course.countDocuments({
      instructor: instructorId,
      status: "pending"
    });

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
      pagination: {
        totalCourses,
        currentPage: page,
        totalPages: Math.ceil(totalCourses / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.deleteCourseDetails = async (req, res) => {

  try {
  
    // Retrieve courseId from headers
    const { courseId } = req.body;  // Get courseId from headers

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required in headers" });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await Category.findByIdAndUpdate(course.category, {
      $pull: { courses: courseId }
    })
    // Unenroll students from the course
    const studentsEnrolled = course.studentEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId);
      if (section) {
        const subSections = section.subSection;
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }
      await Section.findByIdAndDelete(sectionId);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }

}


exports.getCourse = async (req, res) => {
  try {
    const { courseId } = req.params; // <-- use params not query
   

    const course = await Course.findById(courseId);
  

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.updateCourse = async (req, res) => {

  try {
 
  const {courseName, whatYouWillLearn, courseDescription, price,category, tag, imageUrl, status} = req.body;
  if(imageUrl){
    await Course.findByIdAndUpdate(req.body.courseId,{
      courseName:courseName,
      courseDescription:courseDescription,
      category: category,
      price: price,
      tag:tag,
      whatYouWillLearn: whatYouWillLearn,
      thumbnail:imageUrl,
      status:status
     } )  
  }else{
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


    await Course.findByIdAndUpdate(req.body.courseId, {
      courseName:courseName,
      courseDescription:courseDescription,
      price:price,
      tag:tag,
      thumbnail:imageUrl,
      whatYouWillLearn:whatYouWillLearn,
      category:category,
      status:status,
    })
  }
 

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "server error",
      error: error.message,
    })
  }

}

exports.getCourses = async (req, res) => {
  try {

    const result = await Course.aggregate([
      {$match:{status: "completed"}},
      { $sample: { size: 5 } }
    ]);

    if (result && result.length > 0) {
      res.status(200).json({
        success: true,
        message: "5 random completed courses fetched successfully",
        data: result,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No completed courses found",
      });
    }
  } catch (error) {
    console.error(error.message);
    // Handle any errors and send the appropriate response
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.getFullCourse = async (req, res) => {
  try {

    const courseId = req.params.id;
  

    // Fetch the course details and populate related data
    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate({
        path: "category",
        select: "name description",
      })
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec();

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ✅ Only check enrollment if user is logged in

      const user = await User.findById(req.user.id);
      if (user) {
        const isEnrolled =
          Array.isArray(user.courses) &&
          user.courses.includes(courseId);
  
        courseDetails.isEnrolled = isEnrolled;
      }

    // Send response
    res.status(200).json({
      success: true,
      data: courseDetails,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




exports.getMyCourses = async (req, res) => {
  try {


    const user = await User.findById(req.user.id)
      .populate({
        path: "courses",
        select: "courseName courseDescription price", // select only required fields
        populate: {
          path: "instructor",
          select: "firstName",
        },
        populate: {
          path: "category",
          select: "name description",
        },
        populate: {
          path: "ratingAndReviews",
          select: "rating",
        },
        populate: {
          path: "courseContent",
          select: ' sectionName',
          populate: {
            path:'subSection',
            select: 'videoUrl description timeDuration title',
          },
        },
      });
    res.status(200).json({
      success: true,
      data: user.courses, // return only the courses array
    });

  } catch (error) {
    console.error("Error in getMyCourses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




exports.getMyCoursesDetails = async (req, res) => {
  try {
    const courseId =  req.params.courseId; // Get courseId from params
  
    const  course = await Course.findById(courseId).populate({
      path: 'courseContent',
      select: 'sectionName',
      populate: {
        path: 'subSection',
        select: 'videoUrl description timeDuration title'
    }}).exec();
 
     res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
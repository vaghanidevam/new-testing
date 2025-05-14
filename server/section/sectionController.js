const Section = require("../section/section");
const Course = require("../course/course")
const SubSection = require('../subSection/subSection');
const { trace } = require("../course/courseRoutes");

exports.createSection = async (req, res) => {
    try {
		console.log("helo")
        const { sectionName, courseId } = req.body;
        if (!sectionName || !courseId) {
            return res.status(400).json({
				success: false,
				message: "Missing required properties",
			});
        }
        const section = await Section.create({
            sectionName
        })
		console.log(section._id)
        const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				$push: {
					courseContent: section._id,
				},
			},
			{ new: true }
		).populate().exec();
          return  res.status(200).json({
                success: true,
                message: "Section created successfully",
                updatedCourse,
            });
    } catch (error) {
    return    res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
    }
}


// update section

exports.updateSection = async (req, res) => {
    try {
		console.log("helo this is update section")
		console.log(req.body)
		console.log(req.body.sectionUpdate.sectionId)
        const { sectionId,newSectionName  } = req.body.sectionUpdate
        const section = await Section.findByIdAndUpdate(req.body.sectionUpdate.sectionId, {
            sectionName: req.body.sectionUpdate.newSectionName,
        }, { new: true })
       return res.status(200).json({
			success: true,
			message: section,
			data:section,
		});
    } catch (error) {
        console.error("Error updating section:", error);
	return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
}


// delete section

exports.deleteSection = async (req, res) => {
    try {
		console.log("helo")
        const { sectionId , courseId} = req.body
        await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
        const section =  await Section.findById(sectionId)
        console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}
        await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

        //find the updated course and return 
		const course = await Course.findById(courseId).populate().exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});

        return console.log("section deleted")
    } catch (error) {
        console.error("Error deleting section:", error);
	return	res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
}


exports.showAllSections = async (req, res) => {
	try {
	  console.log("hello this is sub section");
	  console.log(req.query.courseId); // ✅ correct place to get it
  
	  const { courseId } = req.query;
  
	  if (!courseId) {
		return res.status(400).json({
		  success: false,
		  message: "Course id needed",
		});
	  }
  
	  const course = await Course.findById(courseId)
		.populate("courseContent")
		.exec();
  
	  if (!course) {
		return res.status(404).json({
		  success: false,
		  message: "Course not found",
		});
	  }
  
	  const sections = course.courseContent;
  
	  if (!sections) {
		return res.status(404).json({
		  success: false,
		  message: "Sections not found for this course",
		});
	  }
	  console.log("done section fetch")
	  return res.status(200).json({
		success: true,
		message: "Sections found",
		sections,
	  });
	  
	} catch (error) {
	  console.error("Error fetching sections:", error);
	  return res.status(500).json({
		success: false,
		message: "Internal Server Error",
	  });
	}
  };
  
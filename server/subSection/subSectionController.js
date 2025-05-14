const SubSection = require("../subSection/subSection");
const Section = require("../section/section");
const { uploadToCloudinaryVideo } = require("../utils/imageUpload")


// Inside your controller
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, videoName, videoDescription } = req.body;
    const file = req.file;  // This is the uploaded file from multer
   console.log(sectionId, videoName, videoDescription)
    if (!sectionId || !videoName || !videoDescription || !file) {
      return res.status(400).json({
        success: false,
        message: "All fields (sectionId, videoName, videoDescription, file) are required",
      });
    }

    // Upload the file (image or video) to Cloudinary
    const uploadDetails = await uploadToCloudinaryVideo(file, "new-folder");
    console.log("Upload complete:", uploadDetails);

    // Create the SubSection with video or image data
    const subSection = await SubSection({
      title: videoName,
      description: videoDescription,
      videoUrl: uploadDetails,  // Use the URL from Cloudinary response
      // mediaType: uploadDetails.resource_type,  // video or image
    });
 
    console.log(subSection)
subSection.save();
    // Add the new subSection to the section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $push: { subSection: subSection._id } },
      { new: true }
    ).populate("subSection");

    return res.status(200).json({
      success: true,
      message: "Subsection created successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error creating subsection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// update subsection

exports.updateSubSection = async (req, res) => {
  try {
    console.log("hello this side update subsection");
    console.log("Request Body:", req.body);

    const { title, description, subSectionId, videoUrl } = req.body;
    console.log("Received Data:", { title, description, subSectionId, videoUrl });

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Update title and description if provided
    if (title !== undefined) {
      console.log("Updating title:", title);
      subSection.title = title;
    }

    if (description !== undefined) {
      console.log("Updating description:", description);
      subSection.description = description;
    }

    // Check if videoUrl is provided and use it directly
    if (videoUrl) {
      console.log("Using provided videoUrl:", videoUrl);
      subSection.videoUrl = videoUrl;
    } 
    // If videoUrl is not provided, check for file upload
    else  {
      console.log("Video file uploaded, processing...");
      const file = req.file; 
console.log(file)
      // Upload video to cloud storage
      const uploadDetails = await uploadToCloudinaryVideo(file, "new-folder");
      console.log("Upload complete:", uploadDetails);
      
      subSection.videoUrl = uploadDetails;
    }

    // Save the updated subSection
    await subSection.save();
    console.log("SubSection updated successfully:", subSection);

    return res.json({
      success: true,
      message: "SubSection updated successfully",
      data: subSection,
    });
  } catch (error) {
    console.error("Error updating sub-section:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the sub-section",
    });
  }
};


// delete subSection

exports.deleteSubSection = async (req, res) => {
  try {
    console.log("hi");
    console.log(req.body);  // Debugging: Check if body data is correct
    
    const { subSectionId, sectionId } = req.body;

    // Remove the subSectionId from the section
    await Section.findByIdAndUpdate(sectionId, {
      $pull: {
        subSection: subSectionId,
      },
    });

    // Delete the subSection document
    const subSection = await SubSection.findByIdAndDelete(subSectionId);
    
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Fetch and return the updated section with populated subSections
    const updatedSection = await Section.findById(sectionId).populate("subSection");

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};

exports.getSubSection =  async (req, res)=>{
  try {
    console.log("helo")
    const {sectionId}  = req.body;

    const section = await Section.findById(sectionId).populate("subSection").exec();
     const subsection = section.subSection;
     
     return res.json({
      success: true,
      message: "SubSection",
      data: subsection,
    })
    
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"Internal server error"
    })
  }
}

exports.getSingleSubSection = async (req, res)=>{
try {
console.log("helo this isde get subs section")
console.log(req.body)
  const {subsectionId} = req.body;
  console.log(subsectionId)
  const subSectionData = await SubSection.findById(subsectionId);
  return res.status(200).json({
    success: true,
    message: "Subsection fetched successfully",
    data: subSectionData,
  });
  
  
} catch (error) {
  return res.status(500).json({
    success:false,
    message:"Internal server error"
  })
}
}
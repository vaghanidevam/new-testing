const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Course", // Referring to the Course model
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // Referring to the User model
  },
  sectionsProgress: [
    {
      sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Section", // Referring to the Section model
      },
      videosProgress: [
        {
          videoId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "SubSection", // Referring to the SubSection (video) model
          },
          watchedDuration: {
            type: Number,
            default: 0, // Duration in seconds
          },
          isPaused: {
            type: Boolean,
            default: false, // Track if video was paused
          },
        },
      ],
    },
  ],
  totalVideos: {
    type: Number,
    required: true,
  },
  progressPercentage: {
    type: Number,
    default: 0,
  },
  isCourseCompleted: {
    type: Boolean,
    default: false,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Method to calculate progress and update completion status
courseProgressSchema.methods.calculateProgress = function () {
  let completedVideos = 0;
  let totalWatchedDuration = 0;
  
  // Iterate through each section and video
  this.sectionsProgress.forEach(section => {
    section.videosProgress.forEach(video => {
      if (video.watchedDuration > 0) {
        completedVideos++;
        totalWatchedDuration += video.watchedDuration;
      }
    });
  });

  // Calculate progress percentage
  this.progressPercentage = (completedVideos / this.totalVideos) * 100;

  // If all videos are completed, mark the course as completed
  if (this.progressPercentage === 100) {
    this.isCourseCompleted = true;
  } else {
    this.isCourseCompleted = false;
  }

  return this.save();
};

module.exports = mongoose.model("CourseProgress", courseProgressSchema);

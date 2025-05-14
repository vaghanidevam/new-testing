// utils/upload.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (filePath, folderName) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
    });

    fs.unlinkSync(filePath); // delete local file after upload
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};



const uploadToCloudinaryVideo = async (file, folderName) => {
  try {
    const filePath = file.path;

    const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
      resource_type: resourceType,
    });

    fs.unlinkSync(filePath); // Clean up temp file

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};




module.exports = { uploadToCloudinary, uploadToCloudinaryVideo };

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Configure Cloudinary if credentials exist in env
let isCloudinaryConfigured = false;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
  console.log('Cloudinary media storage successfully configured.');
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local file storage.
 * @param {Buffer} fileBuffer - The file binary buffer
 * @param {string} originalName - The original name of the file
 * @param {string} folder - The Cloudinary target folder
 * @returns {Promise<string>} - Returns the secure URL of the file
 */
const uploadFile = (fileBuffer, originalName, folder = 'interviewai_pro') => {
  return new Promise((resolve, reject) => {
    if (isCloudinaryConfigured) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: originalName.endsWith('.pdf') ? 'raw' : 'auto',
          public_id: path.parse(originalName).name + '_' + Date.now()
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload failed, falling back to local:', error);
            // If Cloudinary fails, fallback to local write
            saveLocally(fileBuffer, originalName)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      // Write buffer to stream
      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      stream.pipe(uploadStream);
    } else {
      // Local fallback
      saveLocally(fileBuffer, originalName)
        .then(resolve)
        .catch(reject);
    }
  });
};

/**
 * Helper to save file to local server filesystem
 */
const saveLocally = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const filename = `${Date.now()}_${originalName}`;
    const localPath = path.join(__dirname, '../../uploads', filename);
    
    fs.writeFile(localPath, fileBuffer, (err) => {
      if (err) {
        reject(new Error('Failed to save file locally: ' + err.message));
      } else {
        // Return static file server endpoint reference
        resolve(`/uploads/${filename}`);
      }
    });
  });
};

module.exports = { uploadFile };

// server/src/services/storageService.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');

class StorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.ensureUploadDir();
  }

  // Ensure upload directory exists
  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log('Created uploads directory');
    }
  }

  // Configure multer storage
  getStorage(folder = 'general') {
    const folderPath = path.join(this.uploadDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, folderPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    });
  }

  // File filter
  getFileFilter(allowedTypes = ['image', 'video', 'audio', 'pdf', 'document']) {
    return (req, file, cb) => {
      const fileTypes = {
        image: /jpeg|jpg|png|gif|webp/,
        video: /mp4|webm|ogg/,
        audio: /mp3|wav|ogg/,
        pdf: /pdf/,
        document: /doc|docx|txt|md/
      };

      let isAllowed = false;
      for (const type of allowedTypes) {
        if (fileTypes[type]?.test(file.mimetype)) {
          isAllowed = true;
          break;
        }
      }

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'), false);
      }
    };
  }

  // Upload file
  async uploadFile(file, folder = 'general') {
    try {
      const fileUrl = `/uploads/${folder}/${file.filename}`;
      return {
        success: true,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        fileKey: file.filename
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileUrl) {
    try {
      const filePath = path.join(this.uploadDir, fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, message: 'File not found' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Get file info
  getFileInfo(fileUrl) {
    try {
      const filePath = path.join(this.uploadDir, fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        return {
          exists: true,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      }
      return { exists: false };
    } catch (error) {
      console.error('Error getting file info:', error);
      return { exists: false };
    }
  }

  // Configure multer middleware
  getUploadMiddleware(folder = 'general', maxSize = 5 * 1024 * 1024, allowedTypes = ['image', 'video', 'audio', 'pdf', 'document']) {
    const upload = multer({
      storage: this.getStorage(folder),
      fileFilter: this.getFileFilter(allowedTypes),
      limits: { fileSize: maxSize }
    });
    return upload;
  }
}

module.exports = new StorageService();
import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';

// Use environment variable or default paths
const STORAGE_PATH = process.env.STORAGE_PATH || (process.env.RENDER ? '/tmp' : process.cwd());
const uploadsPath = path.join(STORAGE_PATH, 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueId = nanoid();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB for free tier
  }
});

export const uploadPremium = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB for premium
  }
});

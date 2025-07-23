import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';

// Use Render's persistent disk if available, otherwise use local path
const uploadsPath = process.env.RENDER
  ? path.join('/var/data', 'uploads')
  : path.join(process.cwd(), 'uploads');

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

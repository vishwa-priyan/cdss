import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

const allowedTypes = /^image\/(jpeg|png|gif|webp)$|^application\/pdf$/;
const maxSize = env.upload.maxSizeMb * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(file.mimetype);
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.test(file.mimetype)) {
      return cb(new Error('Only PDF and images (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
    cb(null, true);
  },
});

export async function uploadLabReport(req, res) {
  const encounterId = req.params.encounterId;
  const [e] = await query('SELECT id FROM encounters WHERE id = ?', [encounterId]);
  if (!e) return res.status(404).json({ message: 'Encounter not found' });

  const run = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: `File too large. Max ${env.upload.maxSizeMb}MB` });
        return res.status(400).json({ message: err.message || 'Upload failed' });
      }
      next();
    });
  };

  run(req, res, async () => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    await query(
      'INSERT INTO lab_reports (encounter_id, file_path, file_name, mime_type) VALUES (?, ?, ?, ?)',
      [encounterId, req.file.filename, req.file.originalname, req.file.mimetype]
    );
    const [row] = await query(
      'SELECT * FROM lab_reports WHERE encounter_id = ? ORDER BY id DESC LIMIT 1',
      [encounterId]
    );
    res.status(201).json(row);
  });
}

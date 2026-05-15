const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  return cb(new Error('Solo se permiten documentos PDF'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_PDF_MB || 10) * 1024 * 1024 }
});

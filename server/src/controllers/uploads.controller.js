export function uploadFile(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido.' });
  return res.status(201).json({
    file: {
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
}

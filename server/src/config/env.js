import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  paymentsMode: process.env.PAYMENTS_MODE || 'sandbox',
};

if (process.env.NODE_ENV === 'production' && env.jwtSecret === 'development-only-change-me') {
  throw new Error('JWT_SECRET es obligatorio en producción.');
}

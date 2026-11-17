import { Router } from 'express';
import serviceRoutes from './services.routes.js';
import bookingRoutes from './bookings.routes.js';
import userRoutes from './users.routes.js';
import messageRoutes from './messages.routes.js';
import reviewRoutes from './reviews.routes.js';
import paymentRoutes from './payments.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();
router.use(serviceRoutes, bookingRoutes, userRoutes, messageRoutes, reviewRoutes, paymentRoutes);
// Montado bajo /admin: su middleware (auth + requireAdmin) no debe interceptar el resto de la API.
router.use('/admin', adminRoutes);
export default router;

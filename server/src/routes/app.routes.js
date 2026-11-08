import { Router } from 'express';
import serviceRoutes from './services.routes.js';
import bookingRoutes from './bookings.routes.js';
import userRoutes from './users.routes.js';
import messageRoutes from './messages.routes.js';
import reviewRoutes from './reviews.routes.js';

const router = Router();
router.use(serviceRoutes, bookingRoutes, userRoutes, messageRoutes, reviewRoutes);
export default router;

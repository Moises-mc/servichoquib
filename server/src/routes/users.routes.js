import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();
router.get('/contacts', auth, asyncHandler(controller.listContacts));
router.get('/conversations', auth, asyncHandler(controller.listConversations));
router.get('/users/:id', auth, asyncHandler(controller.getPublicProfile));
export default router;

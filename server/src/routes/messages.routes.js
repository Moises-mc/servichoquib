import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/messages.controller.js';

const router = Router();
router.get('/messages', auth, asyncHandler(controller.listMessages));
router.post('/messages', auth, [
  body('receiverId').trim().notEmpty().withMessage('El destinatario es obligatorio.'),
  body('text').optional().isString().isLength({ max: 5000 }),
  body('attachment').optional({ nullable: true }).isObject().withMessage('El adjunto debe ser un objeto válido.'),
  validateRequest,
], asyncHandler(controller.createMessage));
router.put('/messages/:id', auth, [
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('El mensaje no puede estar vacío.'),
  validateRequest,
], asyncHandler(controller.updateMessage));
router.delete('/messages/:id', auth, asyncHandler(controller.deleteMessage));
router.delete('/conversations/:contactId', auth, asyncHandler(controller.deleteConversation));
export default router;

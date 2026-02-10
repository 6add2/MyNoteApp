import { Router } from 'express';
import { AIWebhookController } from '../controllers/AIWebhookController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const aiController = new AIWebhookController();

// Protected AI endpoints
router.post('/ocr', authMiddleware, (req, res) => aiController.ocr(req, res));
router.post('/chat', authMiddleware, (req, res) => aiController.chat(req, res));
router.post('/summarize', authMiddleware, (req, res) => aiController.summarize(req, res));

// Webhook endpoint (for n8n, may have different auth)
router.post('/webhook', (req, res) => aiController.webhook(req, res));

export default router;

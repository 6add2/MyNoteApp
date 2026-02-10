import { Router } from 'express';
import { AuthAPIController } from '../controllers/AuthAPIController';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const authController = new AuthAPIController();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;

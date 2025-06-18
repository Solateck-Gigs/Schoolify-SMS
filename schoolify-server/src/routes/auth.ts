import { Router } from 'express';
import { login, register, logout, completeProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router; 
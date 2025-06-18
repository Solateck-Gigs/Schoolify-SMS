import express from 'express';
import { getOverallStats, getMonthlyStats } from '../controllers/statsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/overall', authenticateToken, getOverallStats);
router.get('/monthly', authenticateToken, getMonthlyStats);

export default router; 
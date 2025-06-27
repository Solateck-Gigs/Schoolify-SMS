import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as reportCardController from '../controllers/reportCardController';

const router = Router();

// Generate report cards for a class
router.post('/generate', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  reportCardController.generateClassReportCards
);

// Send report cards to parents
router.post('/send', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  reportCardController.sendReportCardsToParents
);

// Get report card for a student
router.get('/student', 
  authenticateToken, 
  reportCardController.getStudentReportCard
);

export default router; 
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createTimetableEntry,
  getClassTimetable,
  getTeacherTimetable,
  updateTimetableEntry,
  deleteTimetableEntry
} from '../controllers/timetableController';

const router = Router();

// Create timetable entry (admin and super_admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  createTimetableEntry
);

// Get timetable for a specific class
router.get(
  '/class/:classId',
  authenticateToken,
  getClassTimetable
);

// Get timetable for a specific teacher
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  getTeacherTimetable
);

// Update timetable entry (admin and super_admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  updateTimetableEntry
);

// Delete timetable entry (admin and super_admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  deleteTimetableEntry
);

export default router; 
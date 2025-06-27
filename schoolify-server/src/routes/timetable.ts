import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  createTimetableEntry,
  getClassTimetable,
  getTeacherTimetable,
  updateTimetableEntry,
  deleteTimetableEntry,
  getStudentTimetable
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

// Get timetable for the logged-in student
router.get(
  '/student',
  authenticateToken,
  requireRole(['student']),
  getStudentTimetable
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
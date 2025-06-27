import express from 'express';
import { authenticateToken as authenticate, requireRole as authorize } from '../middleware/auth';
import * as markController from '../controllers/markController';
import * as attendanceController from '../controllers/attendanceController';
import * as parentController from '../controllers/parentController';
import * as adminController from '../controllers/adminController';

const router = express.Router();

// Mark routes (for teachers)
router.get('/marks', authenticate, authorize(['teacher', 'admin']), markController.getClassMarks);
router.get('/marks/student/:studentId', authenticate, authorize(['teacher']), markController.getStudentMarks);
router.post('/marks', authenticate, authorize(['teacher']), markController.addMark);
router.post('/marks/bulk', authenticate, authorize(['teacher']), markController.bulkAddOrUpdateMarks);
router.put('/marks/:markId', authenticate, authorize(['teacher']), markController.updateMark);
router.delete('/marks/:markId', authenticate, authorize(['teacher']), markController.deleteMark);
router.get('/marks/student/:studentId/summary', authenticate, authorize(['teacher']), markController.getStudentPerformanceSummary);
router.post('/marks/send-to-parents', authenticate, authorize(['teacher']), markController.sendMarksToParents);

// Student results route
router.get('/students/:studentId/results', authenticate, authorize(['student']), markController.getStudentResults);

// Attendance routes (for teachers)
router.get('/attendance/class/:classId', authenticate, authorize(['teacher']), attendanceController.getClassAttendance);
router.get('/attendance/student/:studentId', authenticate, authorize(['teacher']), attendanceController.getStudentAttendance);
router.post('/attendance/class/:classId', authenticate, authorize(['teacher']), attendanceController.markAttendance);
router.put('/attendance/:attendanceId', authenticate, authorize(['teacher']), attendanceController.updateAttendance);
router.get('/attendance/student/:studentId/summary', authenticate, authorize(['teacher']), attendanceController.getStudentAttendanceSummary);

// Parent routes
router.get('/parent/children', authenticate, authorize(['parent']), parentController.getChildren);
router.get('/parent/child/:childId/performance', authenticate, authorize(['parent']), parentController.getChildPerformance);
router.get('/parent/child/:childId/attendance', authenticate, authorize(['parent']), parentController.getChildAttendance);
router.get('/parent/child/:childId/fees', authenticate, authorize(['parent']), parentController.getChildFees);
router.get('/parent/suggestions', authenticate, authorize(['parent']), parentController.getSuggestions);
router.post('/parent/suggestions', authenticate, authorize(['parent']), parentController.createSuggestion);

// Admin routes
router.get('/admin/students/performance', authenticate, authorize(['admin']), adminController.getAllStudentsPerformance);
router.get('/admin/students/attendance', authenticate, authorize(['admin']), adminController.getAllStudentsAttendance);
router.get('/admin/fees/status', authenticate, authorize(['admin']), adminController.getAllFeesStatus);
router.get('/admin/class/:classId/statistics', authenticate, authorize(['admin']), adminController.getClassStatistics);
router.get('/admin/suggestions', authenticate, authorize(['admin', 'super_admin']), adminController.getSuggestions);

export default router; 
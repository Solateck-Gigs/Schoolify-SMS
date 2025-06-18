import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Class } from '../models/Class';
import { Fee } from '../models/Fee';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';

const router = Router();

// Get all students (admin only)
router.get('/students', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const students = await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('class', 'name section academicYear')
      .populate('parent', 'user');
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all teachers (admin only)
router.get('/teachers', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email')
      .populate('assignedClasses', 'name section academicYear');
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all classes (admin only)
router.get('/classes', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'user')
      .populate('students', 'user');
    
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all fees (admin only)
router.get('/fees', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'user');
    
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student performance data (admin only)
router.get('/students/performance', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    // Mock performance data - replace with actual database queries
    const performanceData = [
      {
        student: {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          class: { name: 'Grade 10', section: 'A' }
        },
        performance: {
          averageScore: 85,
          grade: 'B+',
          totalAssessments: 12
        }
      },
      {
        student: {
          _id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          class: { name: 'Grade 10', section: 'A' }
        },
        performance: {
          averageScore: 92,
          grade: 'A',
          totalAssessments: 12
        }
      }
    ];
    
    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student attendance data (admin only)
router.get('/students/attendance', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    // Mock attendance data - replace with actual database queries
    const attendanceData = [
      {
        student: {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          class: { name: 'Grade 10', section: 'A' }
        },
        attendance: {
          present: 165,
          absent: 15,
          late: 3,
          presentPercentage: 91.7
        }
      },
      {
        student: {
          _id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          class: { name: 'Grade 10', section: 'A' }
        },
        attendance: {
          present: 175,
          absent: 5,
          late: 1,
          presentPercentage: 97.2
        }
      }
    ];
    
    res.json(attendanceData);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
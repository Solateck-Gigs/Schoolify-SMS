import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Class } from '../models/Class';
import { Attendance } from '../models/Attendance';
import { Mark } from '../models/Mark';

const router = Router();

// Teacher-specific routes (must come before parameterized routes)
// Get teacher's assigned classes
router.get('/classes', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    
    const classes = await Class.find({ teacher: user._id })
      .populate('teacher', 'firstName lastName')
      .sort({ gradeLevel: 1, section: 1 });
    
    res.json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Failed to fetch assigned classes' });
  }
});

// Get teacher's assigned students
router.get('/students', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    
    // Get classes assigned to this teacher
    const teacherClasses = await Class.find({ teacher: user._id });
    const classIds = teacherClasses.map(cls => cls._id);
    
    // Get students in those classes
    const students = await User.find({ 
      role: 'student',
      class: { $in: classIds }
    })
    .populate('class', 'classType gradeId section')
    .populate('parent', 'firstName lastName email')
    .sort({ firstName: 1, lastName: 1 });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({ error: 'Failed to fetch assigned students' });
  }
});

// Get teacher dashboard stats
router.get('/stats', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    
    // Get teacher's classes
    const teacherClasses = await Class.find({ teacher: user._id });
    const classIds = teacherClasses.map(cls => cls._id);
    
    // Get students count
    const totalStudents = await User.countDocuments({ 
      role: 'student',
      class: { $in: classIds }
    });
    
    // Get recent attendance for teacher's classes
    const recentAttendance = await Attendance.find({
      class: { $in: classIds },
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    // Calculate attendance rate
    const totalAttendanceRecords = recentAttendance.length;
    const presentRecords = recentAttendance.filter(record => 
      record.status === 'present'
    ).length;
    const attendanceRate = totalAttendanceRecords > 0 ? 
      Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;
    
    // Get recent marks/assessments
    const recentMarks = await Mark.find({
      teacher: user._id,
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).limit(10);
    
    // Calculate average performance
    const averageScore = recentMarks.length > 0 ? 
      Math.round(recentMarks.reduce((sum, mark) => sum + (mark.score / mark.total_score) * 100, 0) / recentMarks.length) : 0;
    
    res.json({
      totalClasses: teacherClasses.length,
      totalStudents,
      attendanceRate,
      averageScore,
      recentMarks: recentMarks.length,
      classNames: teacherClasses.map(cls => `${cls.classType} ${cls.gradeId}${cls.section ? ` - ${cls.section}` : ''}`)
    });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

// Get teacher's monthly stats
router.get('/monthly-stats', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const { months = 6 } = req.query;
    
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months as string));
    
    // Get teacher's classes
    const teacherClasses = await Class.find({ teacher: user._id });
    const classIds = teacherClasses.map(cls => cls._id);
    
    // Get monthly attendance data
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          class: { $in: classIds },
          date: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.json(attendanceData);
  } catch (error) {
    console.error('Error fetching teacher monthly stats:', error);
    res.status(500).json({ error: 'Failed to fetch monthly statistics' });
  }
});

// Admin routes for managing teachers
// Get all teachers
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .populate('assignedClasses', 'classType gradeId section')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher by ID
router.get('/:id', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .populate('assignedClasses', 'classType gradeId section')
      .select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update teacher
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, email, phone,
      employeeId, dateOfHire, subjectsTaught, assignedClasses, qualifications, experienceYears
    } = req.body;

    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      {
        firstName, lastName, email, phone,
        employeeId, dateOfHire, subjectsTaught, assignedClasses, qualifications, experienceYears
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete teacher
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
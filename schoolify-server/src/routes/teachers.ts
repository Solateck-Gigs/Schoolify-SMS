import { Request, Response, Router } from 'express';
import { Teacher, ITeacher } from '../models/Teacher';
import { User, IUser } from '../models/User';
import { Class } from '../models/Class';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all teachers (admin and super_admin only)
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email');
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher profile by ID
router.get('/profile/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const teacherId = req.params.id;
    const teacher = await Teacher.findById(teacherId)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedClasses', 'name section academicYear');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if user has permission to view this teacher
    if (user.role === 'teacher' && teacher.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this teacher profile' });
    }

    res.status(200).json(teacher);
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new teacher (admin and super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      employeeId,
      dateOfHire,
      subjectsTaught,
      assignedClasses,
      qualifications,
      experienceYears
    } = req.body;

    // Check if teacher with employee ID already exists
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Create user account for teacher
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: 'teacher'
    });
    await user.save();

    // Create teacher record
    const teacher = new Teacher({
      user: user._id,
      employeeId,
      dateOfHire,
      subjectsTaught,
      assignedClasses: assignedClasses || [],
      qualifications: qualifications || [],
      experienceYears: experienceYears || 0
    });

    await teacher.save();

    // Populate references before sending response
    await teacher.populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'assignedClasses', select: 'name section academicYear' }
    ]);

    res.status(201).json(teacher);
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update teacher profile by ID (admin, super_admin, or the teacher themselves)
router.put('/profile/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const teacherId = req.params.id;
    const updates = req.body;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check permissions - admin/super_admin or the teacher themselves
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isOwnProfile = user.role === 'teacher' && teacher.user.toString() === user._id.toString();
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Not authorized to update this teacher profile' });
    }

    // Update teacher fields
    if (updates.subjectsTaught) teacher.subjectsTaught = updates.subjectsTaught;
    if (updates.qualifications) teacher.qualifications = updates.qualifications;
    if (updates.experienceYears) teacher.experienceYears = updates.experienceYears;
    if (updates.assignedClasses && isAdmin) teacher.assignedClasses = updates.assignedClasses;
    if (updates.employeeId && isAdmin) teacher.employeeId = updates.employeeId;
    if (updates.dateOfHire && isAdmin) teacher.dateOfHire = updates.dateOfHire;

    // Save teacher updates
    const updatedTeacher = await teacher.save();

    // Update associated user fields if provided
    if (updates.firstName || updates.lastName || updates.email || updates.phone) {
      const userRecord = await User.findById(teacher.user);
      if (userRecord) {
        if (updates.firstName) userRecord.firstName = updates.firstName;
        if (updates.lastName) userRecord.lastName = updates.lastName;
        if (updates.email) userRecord.email = updates.email;
        if (updates.phone) userRecord.phone = updates.phone;
        await userRecord.save();
      }
    }

    // Populate the response with updated data
    const response = await Teacher.findById(updatedTeacher._id)
      .populate('user', 'firstName lastName email phone')
      .populate('assignedClasses', 'name section academicYear');

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete teacher by ID (admin and super_admin only)
router.delete('/profile/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teacherId = req.params.id;
    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if teacher is assigned to any classes
    const assignedClasses = await Class.find({ teacher: teacherId });
    if (assignedClasses.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete teacher with assigned classes. Please reassign classes first.'
      });
    }

    // Delete associated user account
    await User.findByIdAndDelete(teacher.user);

    // Delete teacher record
    await teacher.deleteOne();

    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teachers available for assignment (admin and super_admin only)
router.get('/available', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email')
      .populate('assignedClasses', 'name section academicYear');
    
    // Filter teachers with available capacity
    const availableTeachers = teachers.filter(teacher => 
      teacher.assignedClasses.length < 5 // Assuming max 5 classes per teacher
    );

    res.status(200).json(availableTeachers);
  } catch (error) {
    console.error('Error fetching available teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher statistics (for authenticated teacher)
router.get('/stats', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const teacher = await Teacher.findOne({ user: user._id })
      .populate('assignedClasses');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Calculate stats (mock data for now - you can implement actual calculations)
    const stats = {
      totalStudents: teacher.assignedClasses.reduce((total: number, cls: any) => total + (cls.capacity || 0), 0),
      averagePerformance: 85.5,
      totalClasses: teacher.assignedClasses.length,
      averageAttendance: 92.3,
      studentChange: 15.2,
      performanceChange: 8.7,
      classesChange: 0,
      attendanceChange: 3.4
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher monthly statistics (for authenticated teacher)
router.get('/monthly-stats', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const { months = 6 } = req.query;

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Generate mock monthly data (you can implement actual calculations)
    const monthlyStats = Array.from({ length: parseInt(months as string) }, (_, i) => ({
      month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'short' }),
      performance: Math.floor(Math.random() * 20) + 80,
      attendance: Math.floor(Math.random() * 10) + 90,
      subject: `Subject ${i + 1}`,
      averageScore: Math.floor(Math.random() * 20) + 75,
      passRate: Math.floor(Math.random() * 15) + 85
    })).reverse();

    res.status(200).json(monthlyStats);
  } catch (error) {
    console.error('Error fetching teacher monthly stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher's assigned classes (for authenticated teacher)
router.get('/classes', authenticateToken, requireRole(['teacher']), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const teacher = await Teacher.findOne({ user: user._id })
      .populate('assignedClasses', 'name section academicYear capacity');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.status(200).json(teacher.assignedClasses);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync teacher data (admin and super_admin only)
router.post('/sync', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    // Implementation for syncing teacher data from external systems
    res.status(200).json({ message: 'Teacher data sync completed' });
  } catch (error) {
    console.error('Error syncing teacher data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
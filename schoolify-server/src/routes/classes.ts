import { Request, Response, Router } from 'express';
import { Class, IClass } from '../models/Class';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all classes (admin and super_admin only)
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'firstName lastName email');
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class details by ID
router.get('/details/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const classId = req.params.id;
    const classData = await Class.findById(classId)
      .populate('teacher', 'firstName lastName email');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if user has permission to view this class
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isClassTeacher = user.role === 'teacher' && classData.teacher._id.toString() === user._id.toString();
    
    if (!isAdmin && !isClassTeacher) {
      return res.status(403).json({ error: 'Not authorized to view this class' });
    }

    res.status(200).json(classData);
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new class (admin and super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      name,
      section,
      academicYear,
      teacher,
      capacity,
      description
    } = req.body;

    if (!name || !section || !academicYear || !teacher) {
      return res.status(400).json({ error: 'Name, section, academic year, and teacher are required' });
    }

    // Check if class with same name and section already exists for the academic year
    const existingClass = await Class.findOne({ 
      name, 
      section, 
      academicYear 
    });
    
    if (existingClass) {
      return res.status(400).json({ 
        error: 'Class with this name and section already exists for the academic year' 
      });
    }

    const newClass = new Class({
      name,
      section,
      academicYear,
      teacher,
      capacity: capacity || 30,
      description: description || ''
    });

    await newClass.save();

    // Populate teacher details before sending response
    await newClass.populate('teacher', 'firstName lastName email');

    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update class by ID (admin and super_admin only)
router.put('/details/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const classId = req.params.id;
    const updates = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class fields
    if (updates.name) classData.name = updates.name;
    if (updates.section) classData.section = updates.section;
    if (updates.academicYear) classData.academicYear = updates.academicYear;
    if (updates.teacher) classData.teacher = updates.teacher;
    if (updates.capacity) classData.capacity = updates.capacity;
    if (updates.description !== undefined) classData.description = updates.description;

    const updatedClass = await classData.save();

    // Populate teacher details before sending response
    await updatedClass.populate('teacher', 'firstName lastName email');

    res.status(200).json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete class by ID (admin and super_admin only)
router.delete('/details/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class has students
    const studentCount = await User.countDocuments({ role: 'student', class: classId });
    if (studentCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete class with enrolled students. Please reassign or remove students first.'
      });
    }

    await classData.deleteOne();
    res.status(200).json({ 
      success: true, 
      message: 'Class deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class statistics by ID (admin, super_admin, or class teacher)
router.get('/stats/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const classId = req.params.id;

    const classData = await Class.findById(classId)
      .populate('teacher', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isClassTeacher = user.role === 'teacher' && classData.teacher._id.toString() === user._id.toString();
    
    if (!isAdmin && !isClassTeacher) {
      return res.status(403).json({ error: 'Not authorized to view class statistics' });
    }

    // Get class statistics
    const totalStudents = await User.countDocuments({ role: 'student', class: classId });
    const maleStudents = await User.countDocuments({ role: 'student', class: classId, gender: 'male' });
    const femaleStudents = await User.countDocuments({ role: 'student', class: classId, gender: 'female' });

    const stats = {
      classInfo: {
        name: classData.name,
        section: classData.section,
        academicYear: classData.academicYear,
        capacity: classData.capacity
      },
      studentStats: {
        total: totalStudents,
        male: maleStudents,
        female: femaleStudents,
        occupancyRate: classData.capacity ? (totalStudents / classData.capacity) * 100 : 0
      },
      teacher: classData.teacher
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get students in a class (admin, super_admin, or class teacher)
router.get('/students/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const classId = req.params.id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isClassTeacher = user.role === 'teacher' && classData.teacher.toString() === user._id.toString();
    
    if (!isAdmin && !isClassTeacher) {
      return res.status(403).json({ error: 'Not authorized to view class students' });
    }

    const students = await User.find({ role: 'student', class: classId })
      .select('-password');

    res.status(200).json({
      classInfo: {
        name: classData.name,
        section: classData.section,
        academicYear: classData.academicYear
      },
      students
    });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
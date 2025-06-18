import { Router, Request, Response } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all classes
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'firstName lastName email');
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const classData = await Class.findById(req.params.id)
      .populate('teacher', 'firstName lastName email');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new class (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name,
      section,
      academicYear,
      teacherId,
      capacity,
      description
    } = req.body;

    // Check if class with same name, section, and academicYear already exists
    const existingClass = await Class.findOne({
      name,
      section,
      academicYear
    });

    if (existingClass) {
      return res.status(400).json({
        error: 'Class with this name, section, and academic year already exists'
      });
    }

    const classData = new Class({
      name,
      section,
      academicYear,
      teacher: teacherId,
      capacity,
      description
    });

    await classData.save();

    // Populate teacher details before sending response
    await classData.populate('teacher', 'firstName lastName email');

    res.status(201).json(classData);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update class (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name,
      section,
      academicYear,
      teacherId,
      capacity,
      description
    } = req.body;

    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if updating to a combination that already exists
    if (name && section && academicYear) {
      const existingClass = await Class.findOne({
        name,
        section,
        academicYear,
        _id: { $ne: req.params.id }
      });

      if (existingClass) {
        return res.status(400).json({
          error: 'Class with this name, section, and academic year already exists'
        });
      }
    }

    // Update class fields
    if (name) classData.name = name;
    if (section) classData.section = section;
    if (academicYear) classData.academicYear = academicYear;
    if (teacherId) classData.teacher = teacherId;
    if (capacity) classData.capacity = capacity;
    if (description) classData.description = description;

    await classData.save();

    // Populate teacher details before sending response
    await classData.populate('teacher', 'firstName lastName email');

    res.json(classData);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete class (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class has students
    const studentCount = await Student.countDocuments({ class: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete class with enrolled students. Please reassign or remove students first.'
      });
    }

    await classData.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get classes by teacher ID
router.get('/teacher/:teacherId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const classes = await Class.find({ teacher: req.params.teacherId });
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes by teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get class statistics (admin only)
router.get('/:id/stats', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentCount = await Student.countDocuments({ class: req.params.id });
    const genderStats = await Student.aggregate([
      { $match: { class: classData._id } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    res.json({
      totalStudents: studentCount,
      capacity: classData.capacity,
      availableSlots: classData.capacity - studentCount,
      genderDistribution: genderStats
    });
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
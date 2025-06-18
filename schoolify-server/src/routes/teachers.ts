import { Router, Request, Response } from 'express';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all teachers
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'firstName lastName email');
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get teacher by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new teacher (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      dateOfHire,
      subjectsTaught,
      qualifications,
      experienceYears
    } = req.body;

    // Check if employee ID already exists
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
      role: 'teacher'
    });
    await user.save();

    // Create teacher record
    const teacher = new Teacher({
      user: user._id,
      employeeId,
      dateOfHire,
      subjectsTaught,
      qualifications,
      experienceYears
    });

    await teacher.save();

    // Populate user details before sending response
    await teacher.populate('user', 'firstName lastName email');

    res.status(201).json(teacher);
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update teacher (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      dateOfHire,
      subjectsTaught,
      qualifications,
      experienceYears
    } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Update teacher fields
    if (dateOfHire) teacher.dateOfHire = dateOfHire;
    if (subjectsTaught) teacher.subjectsTaught = subjectsTaught;
    if (qualifications) teacher.qualifications = qualifications;
    if (experienceYears) teacher.experienceYears = experienceYears;

    await teacher.save();

    // Populate user details before sending response
    await teacher.populate('user', 'firstName lastName email');

    res.json(teacher);
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if teacher is assigned to any classes
    const classCount = await Class.countDocuments({ teacher: req.params.id });
    if (classCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete teacher assigned to classes. Please reassign classes first.'
      });
    }

    // Delete associated user account
    await User.findByIdAndDelete(teacher.user);

    // Delete teacher record
    await teacher.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all teachers
router.get('/fetch', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' }, 'firstName lastName email phone');
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync teachers collection with users collection
router.post('/sync-from-users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 'teacher' });
    let created = 0;
    let existed = 0;
    for (const user of users) {
      const existing = await Teacher.findOne({ user: user._id });
      if (existing) {
        existed++;
        continue;
      }
      await Teacher.create({
        user: user._id,
        qualifications: '',
        dateOfHire: new Date(),
        subjectsTaught: [],
        classesTaught: []
      });
      created++;
    }
    res.json({ success: true, created, existed, total: users.length });
  } catch (error) {
    console.error('Error syncing teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
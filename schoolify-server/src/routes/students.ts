import { Router, Request, Response } from 'express';
import { Student, IStudent } from '../models/Student';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all students (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const students = await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('class', 'name section academicYear');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const student = await Student.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('parent', 'firstName lastName email')
      .populate('class', 'name section academicYear');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if user has permission to view this student
    if (user.role === 'parent' && student.parent.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this student' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new student (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      admissionNumber,
      dateOfBirth,
      gender,
      classId,
      parentId,
      medicalConditions,
      bloodType,
      allergies,
      specialNeeds,
      notes
    } = req.body;

    // Check if student with admission number already exists
    const existingStudent = await Student.findOne({ admissionNumber });
    if (existingStudent) {
      return res.status(400).json({ error: 'Admission number already exists' });
    }

    // Create user account for student
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'student'
    });
    await user.save();

    // Create student record
    const student = new Student({
      user: user._id,
      admissionNumber,
      dateOfBirth,
      gender,
      class: classId,
      parent: parentId,
      medicalConditions,
      bloodType,
      allergies,
      specialNeeds,
      notes
    });

    await student.save();

    // Populate references before sending response
    await student.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'parent', select: 'firstName lastName email' },
      { path: 'class', select: 'name section academicYear' }
    ]);

    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      dateOfBirth,
      gender,
      classId,
      parentId,
      medicalConditions,
      bloodType,
      allergies,
      specialNeeds,
      notes
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student fields
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (classId) student.class = classId;
    if (parentId) student.parent = parentId;
    if (medicalConditions) student.medicalConditions = medicalConditions;
    if (bloodType) student.bloodType = bloodType;
    if (allergies) student.allergies = allergies;
    if (specialNeeds) student.specialNeeds = specialNeeds;
    if (notes) student.notes = notes;

    await student.save();

    // Populate references before sending response
    await student.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'parent', select: 'firstName lastName email' },
      { path: 'class', select: 'name section academicYear' }
    ]);

    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete associated user account
    await User.findByIdAndDelete(student.user);

    // Delete student record
    await student.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
import { Router } from 'express';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('class', 'name gradeLevel section')
      .populate('parent', 'firstName lastName phone')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new student
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, user_id_number,
      admissionNumber, dateOfBirth, parentName, parentPhone,
      address, bloodGroup, emergencyContact, classId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { user_id_number },
        { admissionNumber }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email, ID number, or admission number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'student123', 10);

    // Create student
    const student = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'student',
      user_id_number,
      admissionNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      parentName,
      parentPhone,
      address,
      bloodGroup,
      emergencyContact,
      class: classId || undefined,
      isActive: true
    });

    await student.save();

    // Return student without password
    const studentResponse = await User.findById(student._id)
      .populate('class', 'name gradeLevel section')
      .select('-password');

    res.status(201).json(studentResponse);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .populate('class', 'name')
      .populate('parent', 'firstName lastName phone')
      .select('-password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      admissionNumber, dateOfBirth, gender, classId, parentId,
      medicalConditions, bloodType, allergies, specialNeeds, studentNotes
    } = req.body;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      {
        firstName, lastName, email, phone,
        admissionNumber, dateOfBirth, gender, 
        class: classId, parent: parentId,
        medicalConditions, bloodType, allergies, specialNeeds, studentNotes
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get students by class
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const students = await User.find({ 
      role: 'student', 
      class: req.params.classId 
    })
    .populate('parent', 'firstName lastName phone')
    .select('-password')
    .sort({ firstName: 1, lastName: 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
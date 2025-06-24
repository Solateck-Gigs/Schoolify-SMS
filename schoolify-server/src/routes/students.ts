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
      .populate('parent', 'firstName lastName phone email')
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
      address, bloodGroup, emergencyContact, classId, parentId
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
      parent: parentId || undefined,
      isActive: true
    });

    await student.save();

    // If parent ID is provided, update the parent's children array
    if (parentId) {
      await User.findByIdAndUpdate(
        parentId,
        { $addToSet: { children: student._id } }
      );
    }

    // Return student without password
    const studentResponse = await User.findById(student._id)
      .populate('class', 'name gradeLevel section')
      .populate('parent', 'firstName lastName email phone')
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
      .populate('parent', 'firstName lastName phone email')
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
      medicalConditions, bloodType, allergies, specialNeeds, studentNotes,
      isActive
    } = req.body;

    // Get current student to check if parent is changing
    const currentStudent = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const oldParentId = currentStudent.parent ? currentStudent.parent.toString() : null;

    // Update student
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      {
        firstName, lastName, email, phone,
        admissionNumber, dateOfBirth, gender, 
        class: classId, parent: parentId,
        medicalConditions, bloodType, allergies, specialNeeds, studentNotes,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Handle parent relationship updates
    if (parentId !== oldParentId) {
      // Remove student from old parent's children array if exists
      if (oldParentId) {
        await User.findByIdAndUpdate(
          oldParentId,
          { $pull: { children: req.params.id } }
        );
      }

      // Add student to new parent's children array if exists
      if (parentId) {
        await User.findByIdAndUpdate(
          parentId,
          { $addToSet: { children: req.params.id } }
        );
      }
    }

    // Return updated student with populated fields
    const updatedStudent = await User.findById(student._id)
      .populate('class', 'name gradeLevel section')
      .populate('parent', 'firstName lastName email phone')
      .select('-password');

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle student active status
router.put('/:id/toggle-status', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
      student
    });
  } catch (error) {
    console.error('Error toggling student status:', error);
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
    .populate('parent', 'firstName lastName phone email')
    .select('-password')
    .sort({ firstName: 1, lastName: 1 });

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
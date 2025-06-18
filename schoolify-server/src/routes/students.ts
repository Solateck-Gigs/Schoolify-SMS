import { Request, Response, Router } from 'express';
import { Student, IStudent } from '../models/Student';
import { User, IUser } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Get all students (admin and super_admin only)
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const students = await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('class', 'name section academicYear');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student profile by ID
router.get('/profile/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const studentId = req.params.id;
    const student = await Student.findById(studentId)
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

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new student (admin and super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
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

// Update student profile by ID (admin and super_admin only)
router.put('/profile/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student fields
    if (updates.dateOfBirth) student.dateOfBirth = updates.dateOfBirth;
    if (updates.gender) student.gender = updates.gender;
    if (updates.classId) student.class = updates.classId;
    if (updates.parentId) student.parent = updates.parentId;
    if (updates.medicalConditions) student.medicalConditions = updates.medicalConditions;
    if (updates.bloodType) student.bloodType = updates.bloodType;
    if (updates.allergies) student.allergies = updates.allergies;
    if (updates.specialNeeds) student.specialNeeds = updates.specialNeeds;
    if (updates.notes) student.notes = updates.notes;

    // Save student updates
    const updatedStudent = await student.save();

    // Update associated user fields if provided
    if (updates.firstName || updates.lastName || updates.email) {
      const user = await User.findById(student.user);
      if (user) {
        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName) user.lastName = updates.lastName;
        if (updates.email) user.email = updates.email;
        await user.save();
      }
    }

    // Populate the response with updated data
    const response = await Student.findById(updatedStudent._id)
      .populate('user', 'firstName lastName email')
      .populate('parent', 'firstName lastName email')
      .populate('class', 'name section academicYear');

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student by ID (admin and super_admin only)
router.delete('/profile/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete associated user account
    await User.findByIdAndDelete(student.user);

    // Delete student record
    await student.deleteOne();

    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student statistics by ID (student, parent, teacher, admin, super_admin)
router.get('/profile/:id/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const studentId = req.params.id;

    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName')
      .populate('parent', 'user')
      .populate('class', 'teacher');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check permissions
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isStudent = user.role === 'student' && student.user._id.toString() === user._id.toString();
    
    // Type-safe parent check
    let isParent = false;
    if (user.role === 'parent' && student.parent) {
      const parentData = student.parent as any;
      if (parentData.user) {
        isParent = parentData.user.toString() === user._id.toString();
      }
    }
    
    // Type-safe teacher check
    let isTeacher = false;
    if (user.role === 'teacher' && student.class) {
      const classData = student.class as any;
      if (classData.teacher) {
        isTeacher = classData.teacher.toString() === user._id.toString();
      }
    }

    if (!isAdmin && !isStudent && !isParent && !isTeacher) {
      return res.status(403).json({ error: 'Not authorized to view student statistics' });
    }

    // Generate mock statistics (you can implement actual calculations)
    const stats = {
      academicPerformance: {
        overallGrade: 'B+',
        gpa: 3.5,
        rank: 15,
        totalStudentsInClass: 45,
        subjectGrades: {
          Mathematics: 'A',
          English: 'B+',
          Science: 'A-',
          History: 'B',
          Geography: 'B+'
        }
      },
      attendance: {
        totalDays: 180,
        presentDays: 165,
        absentDays: 15,
        attendancePercentage: 91.7,
        lateArrivals: 8
      },
      fees: {
        totalFees: 5000,
        paidAmount: 4500,
        pendingAmount: 500,
        paymentStatus: 'Partially Paid'
      },
      behavior: {
        conduct: 'Good',
        disciplinaryActions: 0,
        achievements: ['Science Fair Winner', 'Perfect Attendance Month']
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
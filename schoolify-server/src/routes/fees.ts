import { Router, Request, Response } from 'express';
import { Fee } from '../models/Fee';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Types } from 'mongoose';
import { IUser } from '../models/User';
import { Class } from '../models/Class';
import { AuthRequest } from '../types/express';

const router = Router();

// Debug route
router.get('/debug-user', authenticateToken, async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const fullUser = await User.findById(user._id);
  res.json({ tokenUser: user, dbUser: fullUser });
});

// Test route to check current user info (for debugging)
router.get('/test-auth', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    console.log('Test auth - Token user:', user);
    
    // Get full user details from database
    const fullUser = await User.findById(user._id);
    console.log('Test auth - DB user:', fullUser ? {
      _id: fullUser._id,
      email: fullUser.email,
      role: fullUser.role,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName
    } : 'User not found');
    
    res.json({
      tokenUser: user,
      dbUser: fullUser ? {
        _id: fullUser._id,
        email: fullUser.email,
        role: fullUser.role,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName
      } : null
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all fees (admin and super_admin only)
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'firstName lastName admissionNumber user_id_number');
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug route to check current user (no role restriction)
router.get('/current-user', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const fullUser = await User.findById(user._id);
    res.json({
      tokenUser: user,
      dbUser: fullUser ? {
        _id: fullUser._id,
        email: fullUser.email,
        role: fullUser.role,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName
      } : null
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fee by ID (admin, parent of student, or teacher of student's class)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    const fee = await Fee.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber user_id_number role class parent');

    if (!fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    const student = fee.student as any;

    // Authorization check - simplified since all data is in User model
    if (
      user.role === 'admin' ||
      (user.role === 'parent' && student.parent?.toString() === user._id.toString()) ||
      (user.role === 'teacher' && student.class && await User.findOne({ _id: user._id, assignedClasses: student.class }))
    ) {
      res.json(fee);
    } else {
      res.status(403).json({ error: 'Not authorized to view this fee record' });
    }
  } catch (error) {
    console.error('Error fetching fee:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new fee record (admin and super_admin only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    console.log('Creating fee record - User role:', user.role, 'User ID:', user._id);

    const {
      studentId,
      academicYear,
      term,
      amountDue,
      dueDate,
      amountPaid = 0 // Default to 0
    } = req.body;

    console.log('Fee creation data:', { studentId, academicYear, term, amountDue, dueDate });

    // Check if student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log('Found student:', student.firstName, student.lastName);

    const newFee = new Fee({
      student: studentId,
      academicYear,
      term,
      amountDue,
      amountPaid,
      dueDate
    });

    await newFee.save();
    console.log('Fee record saved successfully');

    await newFee.populate('student', 'firstName lastName admissionNumber user_id_number');
    res.status(201).json(newFee);
  } catch (error) {
    console.error('Error creating fee record:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update fee record (admin and super_admin only)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const {
      academicYear,
      term,
      amountDue,
      amountPaid,
      dueDate,
      status
    } = req.body;

    const fee = await Fee.findById(req.params.id)
      .populate('student', 'firstName lastName admissionNumber user_id_number');

    if (!fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    // Update fee fields
    if (academicYear) fee.academicYear = academicYear;
    if (term) fee.term = term;
    if (amountDue) fee.amountDue = amountDue;
    if (amountPaid !== undefined) fee.amountPaid = amountPaid;
    if (dueDate) fee.dueDate = dueDate;
    if (status) fee.status = status;

    await fee.save();
    res.json(fee);
  } catch (error) {
    console.error('Error updating fee record:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete fee record (admin and super_admin only)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    await fee.deleteOne();
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee record:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fees by student ID (admin, parent, or teacher of student's class)
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    const student = await User.findOne({ _id: req.params.studentId, role: 'student' });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization check - simplified since all data is in User model
    if (
      user.role === 'admin' ||
      (user.role === 'parent' && student.parent?.toString() === user._id.toString()) ||
      (user.role === 'teacher' && student.class && await User.findOne({ _id: user._id, assignedClasses: student.class }))
    ) {
      const fees = await Fee.find({ student: req.params.studentId })
        .populate('student', 'firstName lastName admissionNumber user_id_number');
      res.json(fees);
    } else {
      res.status(403).json({ error: 'Not authorized to view fees for this student' });
    }
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fees by class ID (admin or teacher of class)
router.get('/class/:classId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    // Check if class exists and user has permission
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check
    if (user.role === 'admin' || (user.role === 'teacher' && classData.teacher && classData.teacher.toString() === user._id.toString())) {
      // Get students in this class and their fees
      const students = await User.find({ role: 'student', class: req.params.classId });
      const studentIds = students.map(s => s._id);
      
      const fees = await Fee.find({ student: { $in: studentIds } })
        .populate('student', 'firstName lastName admissionNumber user_id_number');
      res.json(fees);
    } else {
      res.status(403).json({ error: 'Not authorized to view fees for this class' });
    }
  } catch (error) {
    console.error('Error fetching class fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
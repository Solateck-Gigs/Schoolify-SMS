import { Router, Request, Response } from 'express';
import { Fee } from '../models/Fee';
import { Student } from '../models/Student';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Types } from 'mongoose';
import { IUser } from '../models/User';
import { Class } from '../models/Class';
import { AuthRequest } from '../types/express';

// Type guard for populated student
interface PopulatedStudent {
  parent?: { user: Types.ObjectId };
  class?: { teacher: Types.ObjectId };
  [key: string]: any;
}

function isPopulatedStudent(student: any): student is PopulatedStudent {
  return student && (
    (!student.parent || student.parent.user instanceof Types.ObjectId) &&
    (!student.class || student.class.teacher instanceof Types.ObjectId)
  );
}

const router = Router();

// Get all fees (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'firstName lastName admissionNumber');
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get fee by ID (admin, parent of student, or teacher of student's class)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'firstName lastName admissionNumber parent class',
        populate: [
          { path: 'parent', select: 'user' },
          { path: 'class', select: 'teacher' }
        ]
      });

    if (!fee) {
      return res.status(404).json({ error: 'Fee record not found' });
    }

    const populatedStudent = fee.student as unknown as PopulatedStudent;
    if (!isPopulatedStudent(populatedStudent)) {
      throw new Error('Failed to populate student');
    }

    // Authorization check
    if (
      user.role === 'admin' ||
      (user.role === 'parent' && populatedStudent.parent?.user.toString() === user._id.toString()) ||
      (user.role === 'teacher' && populatedStudent.class?.teacher.toString() === user._id.toString())
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

// Create new fee record (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    const {
      studentId,
      academicYear,
      term,
      amountDue,
      dueDate,
      amountPaid = 0 // Default to 0
    } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const newFee = new Fee({
      student: studentId,
      academicYear,
      term,
      amountDue,
      amountPaid,
      dueDate
    });

    await newFee.save();

    await newFee.populate('student', 'firstName lastName admissionNumber');
    res.status(201).json(newFee);
  } catch (error) {
    console.error('Error creating fee record:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update fee record (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
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
      .populate({
        path: 'student',
        select: 'firstName lastName admissionNumber parent class',
        populate: [
          { path: 'parent', select: 'user' },
          { path: 'class', select: 'teacher' }
        ]
      });

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

// Delete fee record (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
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

    const student = await Student.findById(req.params.studentId)
      .populate('parent', 'user')
      .populate('class', 'teacher');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const populatedStudent = student as unknown as PopulatedStudent;
    if (!isPopulatedStudent(populatedStudent)) {
      throw new Error('Failed to populate student');
    }

    // Authorization check
    if (
      user.role === 'admin' ||
      (user.role === 'parent' && populatedStudent.parent?.user.toString() === user._id.toString()) ||
      (user.role === 'teacher' && populatedStudent.class?.teacher.toString() === user._id.toString())
    ) {
      const fees = await Fee.find({ student: req.params.studentId })
        .populate('student', 'firstName lastName admissionNumber');
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
    if (user.role === 'admin' || (user.role === 'teacher' && classData.teacher.toString() === user._id.toString())) {
      const fees = await Fee.find({ 'student.class': req.params.classId })
        .populate('student', 'firstName lastName admissionNumber');
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
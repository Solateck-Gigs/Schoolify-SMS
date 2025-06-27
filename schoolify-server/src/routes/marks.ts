import { Router, Request, Response } from 'express';
import { Mark } from '../models/Mark';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get marks for a specific class (teachers can only see their assigned classes)
router.get('/class/:classId', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const { classId } = req.params;

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check - teachers can only view marks for their assigned classes
    if (user.role === 'teacher') {
      if (classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view marks for this class' });
      }
    }

    const marks = await Mark.find({ class: classId })
      .populate('student', 'firstName lastName user_id_number admissionNumber')
      .populate('teacher', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching class marks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get marks for a specific student
router.get('/student/:studentId', authenticateToken, requireRole(['admin', 'super_admin', 'teacher', 'parent']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const { studentId } = req.params;

    // Get student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization check
    if (user.role === 'parent') {
      // Parent can only view their own child's marks
      if (student.parent?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view marks for this student' });
      }
    } else if (user.role === 'teacher') {
      // Teacher can only view students from their assigned classes
      const classData = await Class.findById(student.class);
      if (!classData || classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view marks for this student' });
      }
    }

    const marks = await Mark.find({ student: studentId })
      .populate('teacher', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (error) {
    console.error('Error fetching student marks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new mark (teachers only for their assigned classes)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const { studentId, classId, subject, score, totalScore, assessmentType, term, remarks } = req.body;

    // Validate required fields
    if (!studentId || !classId || !subject || score === undefined || !totalScore || !assessmentType || !term) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if class exists and teacher is authorized
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (user.role === 'teacher') {
      if (classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to add marks for this class' });
      }
    }

    // Check if student exists and is in the class
    const student = await User.findOne({ _id: studentId, role: 'student', class: classId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found in this class' });
    }

    // Calculate grade based on percentage
    const percentage = (score / totalScore) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';

    const mark = new Mark({
      student: studentId,
      class: classId,
      subject,
      score,
      totalScore,
      grade,
      assessmentType,
      term,
      remarks,
      teacher: user._id,
      academicYear: new Date().getFullYear().toString()
    });

    await mark.save();
    await mark.populate('student', 'firstName lastName user_id_number admissionNumber');
    await mark.populate('teacher', 'firstName lastName');

    res.status(201).json(mark);
  } catch (error) {
    console.error('Error adding mark:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk save marks
router.post('/bulk', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req;
    const { marks } = req.body;

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ error: 'Invalid marks data' });
    }

    const savedMarks = [];
    
    for (const markData of marks) {
      const { studentId, classId, subject, score, totalScore, assessmentType, term, remarks } = markData;

      // Check authorization for each class
      const classData = await Class.findById(classId);
      if (!classData) continue;

      if (user.role === 'teacher' && classData.teacher?.toString() !== user._id.toString()) {
        continue; // Skip unauthorized classes
      }

      // Calculate grade
      const percentage = (score / totalScore) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';

      // Check if mark already exists, update or create
      const existingMark = await Mark.findOne({
        student: studentId,
        class: classId,
        subject,
        assessmentType,
        term,
        academicYear: new Date().getFullYear().toString()
      });

      if (existingMark) {
        existingMark.score = score;
        existingMark.totalScore = totalScore;
        existingMark.grade = grade;
        existingMark.remarks = remarks;
        existingMark.teacher = user._id;
        await existingMark.save();
        savedMarks.push(existingMark);
      } else {
        const newMark = new Mark({
          student: studentId,
          class: classId,
          subject,
          score,
          totalScore,
          grade,
          assessmentType,
          term,
          remarks,
          teacher: user._id,
          academicYear: new Date().getFullYear().toString()
        });
        await newMark.save();
        savedMarks.push(newMark);
      }
    }

    res.json({ message: `${savedMarks.length} marks saved successfully`, marks: savedMarks });
  } catch (error) {
    console.error('Error saving bulk marks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Mark } from '../models/Mark';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Class } from '../models/Class';

// Get marks for a specific class
export const getClassMarks = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(new mongoose.Types.ObjectId(classId))) {
      return res.status(403).json({ error: 'Not authorized to view marks for this class' });
    }

    const marks = await Mark.find({ class: classId })
      .populate('student', 'user')
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching marks' });
  }
};

// Get marks for a specific student
export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user!._id;

    // Get student's class
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher is assigned to student's class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(student.class._id)) {
      return res.status(403).json({ error: 'Not authorized to view marks for this student' });
    }

    const marks = await Mark.find({ student: studentId })
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 });

    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student marks' });
  }
};

// Add a new mark
export const addMark = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, subject, academicYear, term, assessmentType, score, totalScore, remarks } = req.body;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(new mongoose.Types.ObjectId(classId))) {
      return res.status(403).json({ error: 'Not authorized to add marks for this class' });
    }

    // Calculate grade based on score percentage
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
      academicYear: academicYear,
      term,
      assessmentType: assessmentType,
      score,
      totalScore: totalScore,
      grade,
      remarks,
      teacher: teacherId,
      date: new Date()
    });

    await mark.save();
    res.status(201).json(mark);
  } catch (error) {
    res.status(500).json({ error: 'Error adding mark' });
  }
};

// Update a mark
export const updateMark = async (req: Request, res: Response) => {
  try {
    const { markId } = req.params;
    const { score, totalScore, remarks } = req.body;
    const teacherId = req.user!._id;

    const mark = await Mark.findById(markId);
    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    // Verify teacher owns this mark
    if (mark.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this mark' });
    }

    // Recalculate grade if score or total score changed
    if (score !== undefined && totalScore !== undefined) {
      const percentage = (score / totalScore) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';

      mark.score = score;
      mark.totalScore = totalScore;
      mark.grade = grade;
    }

    if (remarks !== undefined) {
      mark.remarks = remarks;
    }

    await mark.save();
    res.json(mark);
  } catch (error) {
    res.status(500).json({ error: 'Error updating mark' });
  }
};

// Delete a mark
export const deleteMark = async (req: Request, res: Response) => {
  try {
    const { markId } = req.params;
    const teacherId = req.user!._id;

    const mark = await Mark.findById(markId);
    if (!mark) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    // Verify teacher owns this mark
    if (mark.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this mark' });
    }

    await mark.deleteOne();
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting mark' });
  }
};

// Get student performance summary
export const getStudentPerformanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    const teacherId = req.user!._id;

    // Get student's class
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher is assigned to student's class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(student.class._id)) {
      return res.status(403).json({ error: 'Not authorized to view performance for this student' });
    }

    // Build query based on filters
    const query: any = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;

    const marks = await Mark.find(query)
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 });

    // Calculate performance summary
    const summary = {
      totalAssessments: marks.length,
      averageScore: 0,
      subjectAverages: {} as { [key: string]: { total: number; count: number; average: number } },
      gradeDistribution: {
        'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0
      } as { [key: string]: number }
    };

    let totalPercentage = 0;

    marks.forEach(mark => {
      if (!summary.subjectAverages[mark.subject]) {
        summary.subjectAverages[mark.subject] = { total: 0, count: 0, average: 0 };
      }
      const percentage = (mark.score / mark.totalScore) * 100;
      summary.subjectAverages[mark.subject].total += percentage;
      summary.subjectAverages[mark.subject].count++;
      totalPercentage += percentage;

      // Update grade distribution
      if (mark.grade in summary.gradeDistribution) {
        summary.gradeDistribution[mark.grade]++;
      }
    });

    summary.averageScore = marks.length > 0 ? totalPercentage / marks.length : 0;
    Object.keys(summary.subjectAverages).forEach(subject => {
      const subjectData = summary.subjectAverages[subject];
      subjectData.average = subjectData.total / subjectData.count;
    });

    res.json({
      student,
      marks,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student performance summary' });
  }
}; 
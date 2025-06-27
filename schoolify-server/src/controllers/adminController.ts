import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Mark } from '../models/Mark';
import { Attendance } from '../models/Attendance';
import { Fee } from '../models/Fee';
import { Class } from '../models/Class';
import { Message } from '../models/Message';
import { AuthRequest } from '../types/express';

// Get all students with their performance
export const getAllStudentsPerformance = async (req: Request, res: Response) => {
  try {
    const { academicYear, term, classId } = req.query;

    // Build query based on filters
    const studentQuery: any = { role: 'student' };
    if (classId) studentQuery.class = classId;

    const students = await User.find(studentQuery)
      .populate('class')
      .select('-password');

    const studentsData = await Promise.all(students.map(async (student) => {
      // Get marks
      const marksQuery: any = { student: student._id };
      if (academicYear) marksQuery.academicYear = academicYear;
      if (term) marksQuery.term = term;

      const marks = await Mark.find(marksQuery);

      // Calculate performance summary
      const summary = {
        totalAssessments: marks.length,
        averageScore: 0,
        subjectAverages: {} as { [key: string]: { total: number; count: number; average: number } }
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
      });

      summary.averageScore = marks.length > 0 ? totalPercentage / marks.length : 0;
      Object.keys(summary.subjectAverages).forEach(subject => {
        const subjectData = summary.subjectAverages[subject];
        subjectData.average = subjectData.total / subjectData.count;
      });

      return {
        student,
        performance: summary
      };
    }));

    res.json(studentsData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students performance' });
  }
};

// Get all students attendance
export const getAllStudentsAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, classId } = req.query;

    // Build query based on filters
    const studentQuery: any = { role: 'student' };
    if (classId) studentQuery.class = classId;

    const students = await User.find(studentQuery)
      .populate('class')
      .select('-password');

    const studentsData = await Promise.all(students.map(async (student) => {
      // Get attendance records
      const attendanceQuery: any = { student: student._id };
      if (startDate && endDate) {
        attendanceQuery.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const attendance = await Attendance.find(attendanceQuery);

      // Calculate attendance summary
      const summary = {
        totalDays: attendance.length,
        present: 0,
        absent: 0,
        late: 0,
        presentPercentage: 0,
        absentPercentage: 0,
        latePercentage: 0
      };

      attendance.forEach(record => {
        switch (record.status) {
          case 'present':
            summary.present++;
            break;
          case 'absent':
            summary.absent++;
            break;
          case 'late':
            summary.late++;
            break;
        }
      });

      if (summary.totalDays > 0) {
        summary.presentPercentage = (summary.present / summary.totalDays) * 100;
        summary.absentPercentage = (summary.absent / summary.totalDays) * 100;
        summary.latePercentage = (summary.late / summary.totalDays) * 100;
      }

      return {
        student,
        attendance: summary
      };
    }));

    res.json(studentsData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students attendance' });
  }
};

// Get all fees status
export const getAllFeesStatus = async (req: Request, res: Response) => {
  try {
    const { academicYear, term, classId } = req.query;

    // Build query based on filters
    const studentQuery: any = { role: 'student' };
    if (classId) studentQuery.class = classId;

    const students = await User.find(studentQuery)
      .populate('class')
      .select('-password');

    const feesData = await Promise.all(students.map(async (student) => {
      // Get fee records
      const feesQuery: any = { student: student._id };
      if (academicYear) feesQuery.academicYear = academicYear;
      if (term) feesQuery.term = term;

      const fees = await Fee.find(feesQuery);

      // Calculate fees summary
      const summary = {
        totalFees: 0,
        paidFees: 0,
        outstandingFees: 0,
        paymentStatus: {
          paid: 0,
          partially_paid: 0,
          unpaid: 0
        }
      };

      fees.forEach(fee => {
        summary.totalFees += fee.amountDue;
        summary.paidFees += fee.amountPaid;
        summary.outstandingFees += (fee.amountDue - fee.amountPaid);
        summary.paymentStatus[fee.status]++;
      });

      return {
        student,
        fees: summary
      };
    }));

    res.json(feesData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching fees status' });
  }
};

// Get class statistics
export const getClassStatistics = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { academicYear, term } = req.query;

    const classData = await Class.findById(classId)
      .populate('teacher', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get all students in class
    const students = await User.find({ role: 'student', class: classId })
      .select('-password');

    // Get marks for class
    const marksQuery: any = { class: classId };
    if (academicYear) marksQuery.academicYear = academicYear;
    if (term) marksQuery.term = term;

    const marks = await Mark.find(marksQuery);

    // Get attendance for class
    const attendance = await Attendance.find({ class: classId });

    // Calculate statistics
    const statistics = {
      totalStudents: students.length,
      performance: {
        averageScore: 0,
        subjectAverages: {} as { [key: string]: { total: number; count: number; average: number } },
        gradeDistribution: {
          'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0
        } as { [key: string]: number }
      },
      attendance: {
        totalDays: attendance.length / students.length,
        averagePresent: 0,
        averageAbsent: 0,
        averageLate: 0
      }
    };

    // Calculate performance statistics
    let totalPercentage = 0;
    marks.forEach(mark => {
      if (!statistics.performance.subjectAverages[mark.subject]) {
        statistics.performance.subjectAverages[mark.subject] = { total: 0, count: 0, average: 0 };
      }
      const percentage = (mark.score / mark.totalScore) * 100;
      statistics.performance.subjectAverages[mark.subject].total += percentage;
      statistics.performance.subjectAverages[mark.subject].count++;
      totalPercentage += percentage;

      // Update grade distribution
      if (mark.grade in statistics.performance.gradeDistribution) {
        statistics.performance.gradeDistribution[mark.grade]++;
      }
    });

    statistics.performance.averageScore = marks.length > 0 ? totalPercentage / marks.length : 0;
    Object.keys(statistics.performance.subjectAverages).forEach(subject => {
      const subjectData = statistics.performance.subjectAverages[subject];
      subjectData.average = subjectData.total / subjectData.count;
    });

    // Calculate attendance statistics
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    attendance.forEach(record => {
      switch (record.status) {
        case 'present':
          totalPresent++;
          break;
        case 'absent':
          totalAbsent++;
          break;
        case 'late':
          totalLate++;
          break;
      }
    });

    if (statistics.attendance.totalDays > 0) {
      statistics.attendance.averagePresent = (totalPresent / attendance.length) * 100;
      statistics.attendance.averageAbsent = (totalAbsent / attendance.length) * 100;
      statistics.attendance.averageLate = (totalLate / attendance.length) * 100;
    }

    res.json({
      class: classData,
      statistics
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching class statistics' });
  }
};

// Get all suggestions sent to admin
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    console.log('Admin getSuggestions controller called');
    const user = (req as AuthRequest).user;
    if (!user) {
      console.log('User not authenticated in getSuggestions');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Authenticated user in getSuggestions:', user._id, user.role);

    // Find all suggestion/question type messages
    const suggestions = await Message.find({
      type: { $in: ['suggestion', 'question'] }
    })
    .populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ])
    .sort({ created_at: -1 });

    console.log(`Found ${suggestions.length} suggestions`);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching admin suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';

// Get attendance for a specific class
export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(new mongoose.Types.ObjectId(classId))) {
      return res.status(403).json({ error: 'Not authorized to view attendance for this class' });
    }

    const query: any = { class: classId };
    if (date) {
      const queryDate = new Date(date as string);
      query.date = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'user firstName lastName')
      .populate('marked_by', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance' });
  }
};

// Get attendance for a specific student
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    const teacherId = req.user!._id;

    // Get student's class
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher is assigned to student's class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(student.class._id)) {
      return res.status(403).json({ error: 'Not authorized to view attendance for this student' });
    }

    const query: any = { student: studentId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('marked_by', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching student attendance' });
  }
};

// Mark attendance for a class
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { attendanceRecords } = req.body;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const teacher = await Teacher.findOne({ user: teacherId });
    if (!teacher || !teacher.assignedClasses.includes(new mongoose.Types.ObjectId(classId))) {
      return res.status(403).json({ error: 'Not authorized to mark attendance for this class' });
    }

    // Validate attendance records
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ error: 'Invalid attendance records' });
    }

    const date = new Date();
    const academicYear = new Date().getFullYear().toString();
    const month = date.getMonth() + 1;
    let term: string;
    
    // Determine current term based on month
    if (month >= 9 && month <= 12) term = 'Term 1';
    else if (month >= 1 && month <= 4) term = 'Term 2';
    else term = 'Term 3';

    // Create attendance records
    const attendancePromises = attendanceRecords.map(record => {
      const attendance = new Attendance({
        student: record.studentId,
        class: classId,
        date,
        status: record.status,
        academic_year: academicYear,
        term,
        marked_by: teacherId,
        reason: record.reason
      });
      return attendance.save();
    });

    await Promise.all(attendancePromises);
    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    if ((error as any).code === 11000) {
      res.status(400).json({ error: 'Attendance already marked for some students today' });
    } else {
      res.status(500).json({ error: 'Error marking attendance' });
    }
  }
};

// Update attendance record
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;
    const { status, reason } = req.body;
    const teacherId = req.user!._id;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Verify teacher marked this attendance
    if (attendance.marked_by.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this attendance record' });
    }

    attendance.status = status;
    if (reason !== undefined) {
      attendance.reason = reason;
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Error updating attendance' });
  }
};

// Get attendance summary for a student
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
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
      return res.status(403).json({ error: 'Not authorized to view attendance summary for this student' });
    }

    // Build query based on filters
    const query: any = { student: studentId };
    if (academicYear) query.academic_year = academicYear;
    if (term) query.term = term;

    const attendance = await Attendance.find(query);

    // Calculate summary statistics
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

    res.json({
      student,
      attendance,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching attendance summary' });
  }
}; 
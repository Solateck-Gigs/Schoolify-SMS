import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';
import { Class } from '../models/Class';

// Define result types for attendance processing
interface SuccessResult {
  studentId: string;
  name: string;
  status: string;
  updated: boolean;
}

interface ErrorResult {
  studentId: string;
  name?: string;
  error: string;
}

interface InactiveResult {
  studentId: string;
  name: string;
  message: string;
}

interface AttendanceResults {
  success: SuccessResult[];
  failed: ErrorResult[];
  inactive: InactiveResult[];
}

// Get attendance records for a class
export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const query: any = { class: classId };
    
    if (date) {
      // If date is provided, get attendance for that specific date
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else {
      // If no date is provided, get today's attendance
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

    // Get all students in the class
    const students = await User.find({ class: classId, role: 'student', isActive: true })
      .select('_id firstName lastName admissionNumber')
      .sort({ lastName: 1, firstName: 1 });

    // Create a map of student IDs to attendance records
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.student._id.toString(), record);
    });

    // Create response with attendance status for all students
    const response = students.map(student => {
      const record = attendanceMap.get(student._id.toString());
      return {
        _id: record?._id || null,
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber
        },
        status: record?.status || null,
        date: record?.date || null,
        reason: record?.reason || null,
        recordedBy: record?.recordedBy ? {
          _id: record.recordedBy._id,
          firstName: record.recordedBy.firstName,
          lastName: record.recordedBy.lastName
        } : null
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Error getting class attendance:', error);
    res.status(500).json({ error: 'Error getting class attendance' });
  }
};

// Get attendance for a specific student
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, academicYear, term } = req.query;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Verify user has permission (teacher of this student's class, admin, or parent of the student)
    let hasPermission = false;

    if (userRole === 'admin' || userRole === 'super_admin') {
      hasPermission = true;
    } else if (userRole === 'teacher') {
      const student = await User.findOne({ _id: studentId, role: 'student' })
        .populate('class');
      
      if (student && student.class) {
        const teacher = await User.findOne({ 
          _id: userId,
          assignedClasses: student.class._id
        });
        hasPermission = !!teacher;
      }
    } else if (userRole === 'parent') {
      const parent = await User.findOne({ 
        _id: userId,
        role: 'parent',
        children: new mongoose.Types.ObjectId(studentId)
      });
      hasPermission = !!parent;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to view attendance for this student' });
    }

    // Build query
    const query: any = { student: studentId };
    
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (academicYear) {
      query.academic_year = academicYear;
    }
    
    if (term) {
      query.term = term;
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
};

// Mark attendance for a student
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, classId, status, reason, date } = req.body;
    const teacherId = req.user!._id;

    // Validate status
    if (!['present', 'absent', 'tardy'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be present, absent, or tardy' });
    }

    // Parse date or use current date
    const attendanceDate = date ? new Date(date) : new Date();

    // Check if an attendance record already exists for this student on this date
    const existingRecord = await Attendance.findOne({
      student: studentId,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lte: new Date(attendanceDate.setHours(23, 59, 59, 999))
      }
    });

    if (existingRecord) {
      // Update existing record
      existingRecord.status = status;
      existingRecord.reason = reason || existingRecord.reason;
      existingRecord.recordedBy = teacherId;
      await existingRecord.save();
      
      return res.json({
        message: 'Attendance updated successfully',
        attendance: existingRecord
      });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      student: studentId,
      class: classId,
      date: attendanceDate,
      status,
      reason,
      term: req.body.term || 'Term 1', // Default to Term 1 if not provided
      academicYear: req.body.academicYear || '2023-2024', // Default to current academic year if not provided
      recordedBy: teacherId
    });

    await newAttendance.save();

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: newAttendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Error marking attendance' });
  }
};

// Update a specific attendance record
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;
    const { status, reason } = req.body;
    const teacherId = req.user!._id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Verify teacher is authorized (either created the record or is assigned to the class)
    const isCreator = attendance.recordedBy.toString() === teacherId.toString();
    
    if (!isCreator) {
      const isAssignedTeacher = await User.findOne({
        _id: teacherId,
        role: 'teacher',
        assignedClasses: attendance.class
      });
      
      if (!isAssignedTeacher) {
        return res.status(403).json({ error: 'Not authorized to update this attendance record' });
      }
    }

    // Check if student is active
    const student = await User.findOne({ _id: attendance.student });
    if (!student || !student.isActive) {
      return res.status(403).json({
        error: 'Cannot update attendance for inactive students',
        message: `Student ${student ? student.firstName + ' ' + student.lastName : ''} is currently inactive`
      });
    }

    // Update the record
    attendance.status = status;
    if (reason !== undefined) {
      attendance.reason = reason;
    }
    attendance.recordedBy = teacherId;  // Update who made the change
    
    await attendance.save();
    
    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Get attendance statistics for a student
export const getStudentAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { studentId, term, academicYear } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Build query
    const query: any = { student: studentId };
    
    if (term) {
      query.term = term;
    }
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Get attendance records
    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    // Calculate summary
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const tardy = attendance.filter(a => a.status === 'tardy').length;
    
    // Calculate attendance rate
    const attendanceRate = total > 0 ? ((present + (tardy * 0.5)) / total) * 100 : 0;
    
    res.json({
      studentId,
      summary: {
        totalDays: total,
        present,
        absent,
        tardy,
        attendanceRate: Math.round(attendanceRate)
      },
      records: attendance.map(record => ({
        date: record.date,
        status: record.status,
        reason: record.reason
      }))
    });
  } catch (error) {
    console.error('Error getting student attendance stats:', error);
    res.status(500).json({ error: 'Error getting student attendance stats' });
  }
}; 
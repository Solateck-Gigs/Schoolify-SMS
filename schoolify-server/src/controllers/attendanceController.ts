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

// Get attendance for a specific class on a given date
export const getClassAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.params;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const teacher = await User.findOne({ 
      _id: teacherId, 
      role: 'teacher',
      assignedClasses: new mongoose.Types.ObjectId(classId)
    });

    if (!teacher) {
      return res.status(403).json({ error: 'Not authorized to view attendance for this class' });
    }

    // Get all students in this class
    const students = await User.find({ 
      role: 'student', 
      class: classId,
      // We still get inactive students to show their status
    }).select('firstName lastName user_id_number isActive');

    // Get attendance records for the specified date
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(attendanceDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { 
        $gte: attendanceDate,
        $lte: endDate
      }
    });

    // Map attendance records to students
    const studentAttendance = students.map(student => {
      const record = attendanceRecords.find(
        record => record.student.toString() === student._id.toString()
      );
      
      return {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        studentNumber: student.user_id_number,
        isActive: student.isActive,
        status: record ? record.status : 'not-marked',
        attendanceId: record ? record._id : null,
        reason: record ? record.reason : null
      };
    });

    res.json({
      classId,
      date: attendanceDate,
      students: studentAttendance
    });
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
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
      .populate('marked_by', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
};

// Mark attendance for students in a class
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user!._id;
    const { date, attendanceData, academicYear, term } = req.body;

    if (!date || !Array.isArray(attendanceData) || !academicYear || !term) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify teacher is assigned to this class
    const teacher = await User.findOne({ 
      _id: teacherId, 
      role: 'teacher',
      assignedClasses: new mongoose.Types.ObjectId(classId)
    });

    if (!teacher) {
      return res.status(403).json({ error: 'Not authorized to mark attendance for this class' });
    }

    // Format date
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Process attendance records
    const results: AttendanceResults = {
      success: [],
      failed: [],
      inactive: []
    };

    for (const record of attendanceData) {
      const { studentId, status, reason } = record;
      
      // Check if student is active
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) {
        results.failed.push({
          studentId,
          error: 'Student not found'
        });
        continue;
      }
      
      if (!student.isActive) {
        results.inactive.push({
          studentId,
          name: `${student.firstName} ${student.lastName}`,
          message: 'Cannot mark attendance for inactive students'
        });
        continue;
      }

      try {
        // Check if attendance record already exists for this date and student
        const existingRecord = await Attendance.findOne({
          student: studentId,
          class: classId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingRecord) {
          // Update existing record
          existingRecord.status = status;
          existingRecord.reason = reason;
          await existingRecord.save();
          
          results.success.push({
            studentId,
            name: `${student.firstName} ${student.lastName}`,
            status,
            updated: true
          });
        } else {
          // Create new record
          const newAttendance = new Attendance({
            student: studentId,
            class: classId,
            date: attendanceDate,
            status,
            academic_year: academicYear,
            term,
            marked_by: teacherId,
            reason
          });
          
          await newAttendance.save();
          
          results.success.push({
            studentId,
            name: `${student.firstName} ${student.lastName}`,
            status,
            updated: false
          });
        }
      } catch (error) {
        console.error(`Error marking attendance for student ${studentId}:`, error);
        results.failed.push({
          studentId,
          name: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          error: 'Database error'
        });
      }
    }

    res.status(200).json({
      message: 'Attendance processed',
      results
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
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
    const isCreator = attendance.marked_by.toString() === teacherId.toString();
    
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
    attendance.marked_by = teacherId;  // Update who made the change
    
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

// Get attendance summary for a student
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { academicYear, term } = req.query;
    
    // Build query
    const query: any = { student: studentId };
    
    if (academicYear) {
      query.academic_year = academicYear;
    }
    
    if (term) {
      query.term = term;
    }

    const attendance = await Attendance.find(query);
    
    // Calculate summary
    const totalDays = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    
    // Calculate attendance rate
    const attendanceRate = totalDays > 0 ? ((present + (late * 0.5)) / totalDays) * 100 : 0;
    
    res.json({
      studentId,
      summary: {
        totalDays,
        present,
        absent,
        late,
        attendanceRate: parseFloat(attendanceRate.toFixed(2))
      },
      records: attendance
    });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
}; 
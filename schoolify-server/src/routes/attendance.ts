import { Router, Request, Response } from 'express';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/express';

const router = Router();

// Get attendance for a specific class (admin and teacher only)
router.get('/class/:classId', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { classId } = req.params;
    const { date } = req.query;

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check - admin can view all, teacher can only view their assigned classes
    if (user.role === 'teacher') {
      // Check if this teacher is assigned to this class
      if (classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view attendance for this class' });
      }
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
      .populate('student', 'firstName lastName user_id_number admissionNumber')
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get students for a class with attendance status for a specific date
router.get('/class/:classId/students', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { classId } = req.params;
    const { date } = req.query;

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check - admin can view all, teacher can only view their assigned classes
    if (user.role === 'teacher') {
      // Check if this teacher is assigned to this class
      if (classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view students for this class' });
      }
    }

    // Get all students in the class
    const students = await User.find({ 
      role: 'student', 
      class: classId 
    }).select('firstName lastName user_id_number admissionNumber email isActive');

    // If date is provided, get attendance records for that date
    let attendanceRecords: any[] = [];
    if (date) {
      const queryDate = new Date(date as string);
      attendanceRecords = await Attendance.find({
        class: classId,
        date: {
          $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
          $lt: new Date(queryDate.setHours(23, 59, 59, 999))
        }
      });
    }

    // Merge student data with attendance data
    const studentsWithAttendance = students.map(student => {
      const attendanceRecord = attendanceRecords.find(
        record => record.student.toString() === student._id.toString()
      );
      
      return {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        user_id_number: student.user_id_number,
        admissionNumber: student.admissionNumber,
        email: student.email,
        isActive: student.isActive || false,
        present: attendanceRecord ? attendanceRecord.status === 'present' : false,
        status: attendanceRecord ? attendanceRecord.status : null,
        reason: attendanceRecord ? attendanceRecord.reason : null
      };
    });

    res.json(studentsWithAttendance);
  } catch (error) {
    console.error('Error fetching students with attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance for a specific student (admin, teacher, or parent of student)
router.get('/student/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Get student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization check
    if (user.role === 'parent') {
      // Parent can only view their own child's attendance
      if (student.parent?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view attendance for this student' });
      }
    } else if (user.role === 'teacher') {
      // Teacher can only view students from their assigned classes
      const teacherUser = await User.findById(user._id);
      if (!student.class || !teacherUser?.assignedClasses?.includes(student.class)) {
        return res.status(403).json({ error: 'Not authorized to view attendance for this student' });
      }
    }
    // Admin can view all

    const query: any = { student: studentId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark attendance for students (admin and teacher only)
router.post('/mark', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { classId, date, attendanceRecords } = req.body;

    console.log('Attendance marking request:', { classId, date, attendanceRecordsCount: attendanceRecords?.length });

    // Validate input
    if (!classId || !date || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      console.log('Invalid input data:', { classId, date, attendanceRecords });
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // Validate date format
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      console.log('Class not found:', classId);
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check - admin can mark all, teacher can only mark their assigned classes
    if (user.role === 'teacher') {
      // Check if this teacher is assigned to this class
      if (classData.teacher?.toString() !== user._id.toString()) {
        console.log('Teacher not authorized for class:', { teacherId: user._id, classTeacher: classData.teacher });
        return res.status(403).json({ error: 'Not authorized to mark attendance for this class' });
      }
    }

    const academicYear = attendanceDate.getFullYear().toString();
    const month = attendanceDate.getMonth() + 1;
    
    // Determine current term based on month
    let term: string;
    if (month >= 9 && month <= 12) term = 'Term 1';
    else if (month >= 1 && month <= 4) term = 'Term 2';
    else term = 'Term 3';

    console.log('Processing attendance for:', { academicYear, term, recordsCount: attendanceRecords.length });

    // Track successful, failed and inactive student records
    const results = {
      success: [] as any[],
      failed: [] as any[],
      inactive: [] as any[]
    };

    // Create or update attendance records
    const attendancePromises = attendanceRecords.map(async (record: any) => {
      try {
        // Validate record structure
        if (!record.studentId || !record.status) {
          console.log('Invalid attendance record:', record);
          throw new Error('Invalid attendance record structure');
        }

        // Check if student is active
        const student = await User.findOne({ _id: record.studentId, role: 'student' });
        if (!student) {
          results.failed.push({
            studentId: record.studentId,
            error: 'Student not found'
          });
          return;
        }
        
        // Skip inactive students
        if (!student.isActive) {
          console.log(`Student ${record.studentId} (${student.firstName} ${student.lastName}) is inactive. Attendance not recorded.`);
          results.inactive.push({
            studentId: record.studentId,
            name: `${student.firstName} ${student.lastName}`,
            message: 'Cannot mark attendance for inactive students'
          });
          return;
        }

        // Create a fresh date object for each iteration to avoid mutation
        const searchDate = new Date(date);
        
        const existingAttendance = await Attendance.findOne({
          student: record.studentId,
          class: classId,
          date: {
            $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
            $lt: new Date(searchDate.setHours(23, 59, 59, 999))
          }
        });

        if (existingAttendance) {
          // Update existing record
          existingAttendance.status = record.status;
          existingAttendance.reason = record.reason;
          existingAttendance.recordedBy = user._id;
          await existingAttendance.save();
          
          results.success.push({
            studentId: record.studentId,
            name: `${student.firstName} ${student.lastName}`,
            status: record.status,
            updated: true
          });
        } else {
          // Create new record with a fresh date object
          const recordDate = new Date(date);
          const attendance = new Attendance({
            student: record.studentId,
            class: classId,
            date: recordDate,
            status: record.status,
            academicYear: academicYear,
            term,
            recordedBy: user._id,
            reason: record.reason
          });
          await attendance.save();
          
          results.success.push({
            studentId: record.studentId,
            name: `${student.firstName} ${student.lastName}`,
            status: record.status,
            updated: false
          });
        }
      } catch (recordError) {
        console.error('Error processing individual attendance record:', recordError);
        throw recordError;
      }
    });

    await Promise.all(attendancePromises);
    
    console.log('Attendance marked successfully', {
      success: results.success.length,
      failed: results.failed.length,
      inactive: results.inactive.length
    });
    
    // Return the results so frontend can show appropriate messages
    res.status(201).json({ 
      message: 'Attendance processed',
      results
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update single attendance record (admin and teacher only)
router.put('/:attendanceId', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { attendanceId } = req.params;
    const { status, reason } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Authorization check - admin can update all, teacher can only update records they marked
    if (user.role === 'teacher' && attendance.recordedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this attendance record' });
    }
    
    // Check if student is active
    const student = await User.findOne({ _id: attendance.student });
    if (!student || !student.isActive) {
      return res.status(403).json({
        error: 'Cannot update attendance for inactive students',
        message: `Student ${student ? student.firstName + ' ' + student.lastName : ''} is currently inactive`
      });
    }

    attendance.status = status;
    if (reason !== undefined) {
      attendance.reason = reason;
    }

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance summary for a student (admin, teacher, or parent of student)
router.get('/student/:studentId/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { studentId } = req.params;
    const { academicYear, term } = req.query;

    // Get student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization check
    if (user.role === 'parent') {
      // Parent can only view their own child's attendance
      if (student.parent?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view attendance summary for this student' });
      }
    } else if (user.role === 'teacher') {
      // Teacher can only view students from their assigned classes
      const teacherUser = await User.findById(user._id);
      if (!student.class || !teacherUser?.assignedClasses?.includes(student.class)) {
        return res.status(403).json({ error: 'Not authorized to view attendance summary for this student' });
      }
    }
    // Admin can view all

    // Build query based on filters
    const query: any = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;

    const attendance = await Attendance.find(query);

    // Calculate summary statistics
    const summary = {
      totalDays: attendance.length,
      present: 0,
      absent: 0,
      tardy: 0,
      presentPercentage: 0,
      absentPercentage: 0,
      tardyPercentage: 0
    };

    attendance.forEach(record => {
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'absent':
          summary.absent++;
          break;
        case 'tardy':
          summary.tardy++;
          break;
      }
    });

    if (summary.totalDays > 0) {
      summary.presentPercentage = Math.round((summary.present / summary.totalDays) * 100);
      summary.absentPercentage = Math.round((summary.absent / summary.totalDays) * 100);
      summary.tardyPercentage = Math.round((summary.tardy / summary.totalDays) * 100);
    }

    res.json({
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        user_id_number: student.user_id_number,
        admissionNumber: student.admissionNumber
      },
      attendance,
      summary
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance history summary (admin and teacher only)
router.get('/summary', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    console.log('Fetching attendance summary for user:', { userId: user._id, role: user.role });

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            class: "$class"
          },
          totalStudents: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          },
          tardyCount: {
            $sum: { $cond: [{ $eq: ["$status", "tardy"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id.class',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $unwind: '$classInfo'
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: ["$presentCount", "$totalStudents"] },
              100
            ]
          }
        }
      },
      {
        $project: {
          date: '$_id.date',
          class: {
            _id: '$classInfo._id',
            name: '$classInfo.name',
            gradeLevel: '$classInfo.gradeLevel',
            section: '$classInfo.section'
          },
          totalStudents: 1,
          presentCount: 1,
          absentCount: 1,
          tardyCount: 1,
          attendanceRate: { $round: ['$attendanceRate', 1] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ];

    // If user is a teacher, filter to only their assigned classes
    if (user.role === 'teacher') {
      // Find classes where this teacher is assigned
      const teacherClasses = await Class.find({ teacher: user._id }).select('_id');
      const teacherClassIds = teacherClasses.map(cls => cls._id);
      
      console.log('Teacher assigned classes:', teacherClassIds);
      
      if (teacherClassIds.length > 0) {
        pipeline.unshift({
          $match: {
            class: { $in: teacherClassIds }
          }
        });
      } else {
        // Teacher has no assigned classes
        console.log('Teacher has no assigned classes');
        return res.json([]);
      }
    }

    console.log('Aggregation pipeline:', JSON.stringify(pipeline, null, 2));

    const summaryData = await Attendance.aggregate(pipeline);
    console.log('Summary data result:', summaryData.length, 'records');
    
    res.json(summaryData);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed attendance records for a specific class and date (admin and teacher only)
router.get('/details', authenticateToken, requireRole(['admin', 'super_admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ error: 'Class ID and date are required' });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Authorization check - admin can view all, teacher can only view their assigned classes
    if (user.role === 'teacher') {
      // Check if this teacher is assigned to this class
      if (classData.teacher?.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to view attendance details for this class' });
      }
    }

    const queryDate = new Date(date as string);
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      }
    })
    .populate('student', 'firstName lastName user_id_number admissionNumber')
    .populate('recordedBy', 'firstName lastName')
    .populate('class', 'name gradeLevel section')
    .sort({ createdAt: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
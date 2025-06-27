import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReportCard } from '../models/ReportCard';
import { User } from '../models/User';
import { Mark } from '../models/Mark';
import { Class } from '../models/Class';
import { Attendance } from '../models/Attendance';
import { Message } from '../models/Message';

// Generate report cards for an entire class
export const generateClassReportCards = async (req: Request, res: Response) => {
  try {
    const { classId, term, academicYear } = req.body;
    const teacherId = req.user!._id;

    console.log('Generating report cards for class:', classId, 'term:', term, 'academicYear:', academicYear);

    // Verify teacher is assigned to this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if the teacher is assigned to this class
    if (classData.teacher?.toString() !== teacherId.toString()) {
      console.log('Teacher not assigned to class:', classId);
      return res.status(403).json({ error: 'Not authorized to generate report cards for this class' });
    }

    // Get all students in the class
    const students = await User.find({ role: 'student', class: classId, isActive: true })
      .select('_id firstName lastName admissionNumber')
      .lean();

    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found in this class' });
    }

    console.log(`Found ${students.length} students in class`);

    // Process each student
    const reportCards = [];
    let positionData: { studentId: string, totalScore: number }[] = [];

    // First pass: Calculate scores for each student to determine positions
    for (const student of students) {
      // Get all test marks for this student
      const testMarks = await Mark.find({
        student: student._id,
        class: classId,
        term,
        academicYear,
        assessmentType: 'test'
      }).lean();

      // Get all exam marks for this student
      const examMarks = await Mark.find({
        student: student._id,
        class: classId,
        term,
        academicYear,
        assessmentType: 'exam'
      }).lean();

      // Get attendance records for this student
      const attendanceRecords = await Attendance.find({
        student: student._id,
        class: classId,
        term,
        academicYear
      }).lean();

      // Process subjects
      const subjects: any[] = [];
      const uniqueSubjects = new Set([
        ...testMarks.map(mark => mark.subject),
        ...examMarks.map(mark => mark.subject)
      ]);

      let totalScore = 0;
      let subjectCount = 0;

      // For each subject, calculate combined score
      for (const subject of uniqueSubjects) {
        const testMark = testMarks.find(mark => mark.subject === subject);
        const examMark = examMarks.find(mark => mark.subject === subject);

        // Skip if we don't have both test and exam scores
        if (!testMark || !examMark) continue;

        // Calculate weighted total (test 40%, exam 60%)
        const testWeight = 0.4;
        const examWeight = 0.6;
        const combinedScore = (testMark.score * testWeight) + (examMark.score * examWeight);
        
        // Determine grade and remarks
        const grade = calculateGrade(combinedScore);
        const remarks = calculateRemarks(combinedScore);

        subjects.push({
          subject,
          testScore: testMark.score,
          examScore: examMark.score,
          totalScore: combinedScore,
          grade,
          remarks,
          teacherComment: examMark.remarks || ''
        });

        totalScore += combinedScore;
        subjectCount++;
      }

      // Calculate average score
      const averageScore = subjectCount > 0 ? totalScore / subjectCount : 0;

      // Add to position data array
      positionData.push({
        studentId: student._id.toString(),
        totalScore: averageScore
      });
    }

    // Sort by total score to determine positions
    positionData.sort((a, b) => b.totalScore - a.totalScore);
    
    // Add position to each student's data
    const positionMap = new Map();
    positionData.forEach((data, index) => {
      positionMap.set(data.studentId, index + 1);
    });

    // Second pass: Create report cards with positions
    for (const student of students) {
      // Get all test marks for this student
      const testMarks = await Mark.find({
        student: student._id,
        class: classId,
        term,
        academicYear,
        assessmentType: 'test'
      }).lean();

      // Get all exam marks for this student
      const examMarks = await Mark.find({
        student: student._id,
        class: classId,
        term,
        academicYear,
        assessmentType: 'exam'
      }).lean();

      // Get attendance records for this student
      const attendanceRecords = await Attendance.find({
        student: student._id,
        class: classId,
        term,
        academicYear
      }).lean();

      // Calculate attendance statistics
      const totalDays = 60; // Standard term length
      const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
      const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
      const tardyDays = attendanceRecords.filter(record => record.status === 'tardy').length;
      const attendancePercentage = (presentDays / totalDays) * 100;

      // Process subjects
      const subjects: any[] = [];
      const uniqueSubjects = new Set([
        ...testMarks.map(mark => mark.subject),
        ...examMarks.map(mark => mark.subject)
      ]);

      let totalScore = 0;
      let subjectCount = 0;

      // For each subject, calculate combined score
      for (const subject of uniqueSubjects) {
        const testMark = testMarks.find(mark => mark.subject === subject);
        const examMark = examMarks.find(mark => mark.subject === subject);

        // Skip if we don't have both test and exam scores
        if (!testMark || !examMark) continue;

        // Calculate weighted total (test 40%, exam 60%)
        const testWeight = 0.4;
        const examWeight = 0.6;
        const combinedScore = (testMark.score * testWeight) + (examMark.score * examWeight);
        
        // Determine grade and remarks
        const grade = calculateGrade(combinedScore);
        const remarks = calculateRemarks(combinedScore);

        subjects.push({
          subject,
          testScore: testMark.score,
          examScore: examMark.score,
          totalScore: combinedScore,
          grade,
          remarks,
          teacherComment: examMark.remarks || ''
        });

        totalScore += combinedScore;
        subjectCount++;
      }

      // Calculate average score
      const averageScore = subjectCount > 0 ? totalScore / subjectCount : 0;
      
      // Get position from map
      const position = positionMap.get(student._id.toString()) || 0;

      // Determine promotion status
      const promotionStatus = determinePromotionStatus(averageScore, subjects.length);

      // Generate teacher remarks based on performance
      const classTeacherRemarks = generateTeacherRemarks(averageScore, attendancePercentage);

      // Check if a report card already exists for this student/term
      const existingReportCard = await ReportCard.findOne({
        student: student._id,
        class: classId,
        term,
        academicYear
      });

      if (existingReportCard) {
        // Update existing report card
        existingReportCard.subjects = subjects;
        existingReportCard.totalScore = totalScore;
        existingReportCard.averageScore = averageScore;
        existingReportCard.position = position;
        existingReportCard.attendance = {
          totalDays,
          present: presentDays,
          absent: absentDays,
          tardy: tardyDays,
          percentage: attendancePercentage
        };
        existingReportCard.classTeacherRemarks = classTeacherRemarks;
        existingReportCard.promotionStatus = promotionStatus;
        
        await existingReportCard.save();
        reportCards.push(existingReportCard);
      } else {
        // Create new report card
        const newReportCard = new ReportCard({
          student: student._id,
          class: classId,
          term,
          academicYear,
          subjects,
          totalScore,
          averageScore,
          position,
          attendance: {
            totalDays,
            present: presentDays,
            absent: absentDays,
            tardy: tardyDays,
            percentage: attendancePercentage
          },
          classTeacherRemarks,
          promotionStatus,
          generatedBy: teacherId,
          generatedAt: new Date()
        });

        await newReportCard.save();
        reportCards.push(newReportCard);
      }
    }

    res.json({
      success: true,
      message: `Generated ${reportCards.length} report cards`,
      reportCards
    });
  } catch (error) {
    console.error('Error generating report cards:', error);
    res.status(500).json({ error: 'Failed to generate report cards' });
  }
};

// Send report cards to parents
export const sendReportCardsToParents = async (req: Request, res: Response) => {
  try {
    const { classId, term, academicYear } = req.body;
    const teacherId = req.user!._id;

    // Verify teacher is assigned to this class
    const classData = await Class.findById(classId).populate('teacher');
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if the teacher is assigned to this class
    if (classData.teacher?._id.toString() !== teacherId.toString()) {
      return res.status(403).json({ error: 'Not authorized to send report cards for this class' });
    }

    // Get all report cards for this class/term
    const reportCards = await ReportCard.find({
      class: classId,
      term,
      academicYear
    }).populate('student', 'firstName lastName admissionNumber');

    if (reportCards.length === 0) {
      return res.status(404).json({ error: 'No report cards found. Please generate report cards first.' });
    }

    const results = {
      sent: 0,
      failed: 0,
      noParent: 0
    };

    // For each report card, find the student's parents and send them a message
    for (const reportCard of reportCards) {
      const student = await User.findById(reportCard.student);
      
      if (!student) {
        results.failed++;
        continue;
      }
      
      // Find parents of this student
      const parents = await User.find({ 
        role: 'parent',
        children: student._id 
      });

      // If student has no parents, skip
      if (!parents || parents.length === 0) {
        results.noParent++;
        continue;
      }

      // Send message to each parent
      for (const parent of parents) {
        const parentId = parent._id;
        const messageContent = generateReportCardMessage(reportCard, classData, student);
        
        const message = new Message({
          sender: teacherId,
          receiver: parentId,
          subject: `Report Card for ${student.firstName} ${student.lastName} - ${term} ${academicYear}`,
          content: messageContent,
          type: 'report_card',
          read_by_receiver: false,
          reportCard: reportCard._id
        });

        await message.save();
      }

      // Mark report card as sent
      reportCard.sentToParent = true;
      reportCard.sentDate = new Date();
      await reportCard.save();
      
      results.sent++;
    }

    res.json({
      success: true,
      message: `Report cards processed: ${results.sent} sent, ${results.noParent} students without parents, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Error sending report cards:', error);
    res.status(500).json({ error: 'Failed to send report cards' });
  }
};

// Get report card for a specific student
export const getStudentReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Build query
    const query: any = { student: studentId };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

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
    } else if (userRole === 'student') {
      // Students can only view their own report cards
      hasPermission = userId.toString() === studentId;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to view this report card' });
    }

    // Get the report card
    const reportCard = await ReportCard.findOne(query)
      .populate('student', 'firstName lastName admissionNumber')
      .populate('class', 'name section academicYear')
      .populate('generatedBy', 'firstName lastName');

    if (!reportCard) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    res.json(reportCard);
  } catch (error) {
    console.error('Error fetching report card:', error);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
};

// Helper functions
function calculateGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  return 'F';
}

function calculateRemarks(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Satisfactory';
  return 'Needs Improvement';
}

function determinePromotionStatus(averageScore: number, subjectCount: number): 'promoted' | 'retained' | 'pending' {
  if (subjectCount === 0) return 'pending';
  if (averageScore >= 60) return 'promoted';
  return 'retained';
}

function generateTeacherRemarks(averageScore: number, attendancePercentage: number): string {
  let remarks = '';
  
  // Performance remarks
  if (averageScore >= 90) {
    remarks = 'Outstanding academic performance. ';
  } else if (averageScore >= 80) {
    remarks = 'Excellent academic performance. ';
  } else if (averageScore >= 70) {
    remarks = 'Good academic performance. ';
  } else if (averageScore >= 60) {
    remarks = 'Satisfactory academic performance. ';
  } else if (averageScore >= 50) {
    remarks = 'Average academic performance. Needs to work harder. ';
  } else {
    remarks = 'Below average academic performance. Significant improvement needed. ';
  }
  
  // Attendance remarks
  if (attendancePercentage >= 95) {
    remarks += 'Excellent attendance record.';
  } else if (attendancePercentage >= 90) {
    remarks += 'Very good attendance record.';
  } else if (attendancePercentage >= 85) {
    remarks += 'Good attendance record.';
  } else if (attendancePercentage >= 80) {
    remarks += 'Satisfactory attendance record.';
  } else {
    remarks += 'Poor attendance record. Needs to improve attendance.';
  }
  
  return remarks;
}

function generateReportCardMessage(reportCard: any, classData: any, student: any): string {
  return `
Dear Parent/Guardian,

Please find attached the report card for ${student.firstName} ${student.lastName} (ID: ${student.admissionNumber}) for ${reportCard.term} of the ${reportCard.academicYear} academic year.

Class: ${classData.name}
Position in Class: ${reportCard.position} out of ${classData.studentCount || 'N/A'}
Average Score: ${reportCard.averageScore.toFixed(2)}%
Promotion Status: ${reportCard.promotionStatus.toUpperCase()}

Attendance Summary:
- Present: ${reportCard.attendance.present} days
- Absent: ${reportCard.attendance.absent} days
- Tardy: ${reportCard.attendance.tardy} days
- Attendance Rate: ${reportCard.attendance.percentage.toFixed(2)}%

Class Teacher's Remarks:
${reportCard.classTeacherRemarks}

Please review the detailed subject performance in the attached report card. If you have any questions or concerns, please don't hesitate to contact me.

Regards,
${classData.teacher?.firstName || ''} ${classData.teacher?.lastName || ''}
Class Teacher
  `;
}
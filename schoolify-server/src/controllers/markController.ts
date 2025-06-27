import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Mark } from '../models/Mark';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { Message } from '../models/Message';

// Get marks for a specific class
export const getClassMarks = async (req: Request, res: Response) => {
  try {
    const { classId, subject, assessmentType, term } = req.query;
    const teacherId = req.user!._id;

    console.log('Marks query parameters:', { classId, subject, assessmentType, term });
    console.log('Request path:', req.path);
    console.log('Request URL:', req.originalUrl);

    // Build the query
    const query: any = {};
    
    if (classId) {
      query.class = classId;
    }
    
    if (subject) {
      query.subject = subject;
    }
    
    if (assessmentType) {
      query.assessmentType = assessmentType;
    }
    
    if (term) {
      query.term = term;
    }

    console.log('Built query:', query);

    // For teachers, verify they are assigned to this class
    if (req.user!.role === 'teacher' && classId) {
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
      
      // Check if teacher exists and has assigned classes
      if (!teacher) {
        return res.status(403).json({ error: 'Teacher not found' });
      }
      
      // If teacher doesn't have assignedClasses array, initialize it
      if (!teacher.assignedClasses) {
        teacher.assignedClasses = [];
      }
      
      // Convert classId to ObjectId for comparison
      const classObjectId = new mongoose.Types.ObjectId(classId as string);
      
      // Check if teacher is assigned to this class
      const isAssigned = teacher.assignedClasses.some(id => id.equals(classObjectId));
      
      if (!isAssigned) {
        console.log(`Teacher ${teacherId} not assigned to class ${classId}`);
        // For development, allow access even if not assigned
        // In production, uncomment the following line:
        // return res.status(403).json({ error: 'Not authorized to view marks for this class' });
      }
    }

    // For admins, no additional checks needed

    const marks = await Mark.find(query)
      .populate({
        path: 'student',
        select: 'firstName lastName user_id_number admissionNumber'
      })
      .populate('teacher', 'firstName lastName')
      .sort({ createdAt: -1 });

    console.log(`Found ${marks.length} marks matching query`);
    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Error fetching marks' });
  }
};

// Get marks for a specific student
export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user!._id;

    // Get student's class
    const student = await User.findOne({ _id: studentId, role: 'student' }).populate('class');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher is assigned to student's class
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher || !student.class || !teacher.assignedClasses?.includes(student.class)) {
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
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher || !teacher.assignedClasses?.includes(new mongoose.Types.ObjectId(classId))) {
      return res.status(403).json({ error: 'Not authorized to add marks for this class' });
    }

    // Check if student is active
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (!student.isActive) {
      return res.status(403).json({ 
        error: 'Cannot add marks for inactive students',
        message: `Student ${student.firstName} ${student.lastName} is currently inactive`
      });
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

    // Check if student is active
    const student = await User.findOne({ _id: mark.student, role: 'student' });
    if (!student || !student.isActive) {
      return res.status(403).json({ 
        error: 'Cannot update marks for inactive students',
        message: `Student ${student ? student.firstName + ' ' + student.lastName : ''} is currently inactive`
      });
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
    const student = await User.findOne({ _id: studentId, role: 'student' }).populate('class');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Verify teacher is assigned to student's class
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher || !student.class || !teacher.assignedClasses?.includes(student.class)) {
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

// Send marks to parents
export const sendMarksToParents = async (req: Request, res: Response) => {
  try {
    const { classId, subject, assessmentType, term } = req.body;
    const teacherId = req.user!._id;

    console.log('Request to send marks to parents:', { classId, subject, assessmentType, term, teacherId });

    // Get the teacher
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    
    if (!teacher) {
      console.log('Teacher not found:', teacherId);
      return res.status(403).json({ error: 'Not authorized - teacher not found' });
    }
    
    console.log('Teacher found:', teacher.firstName, teacher.lastName);
    
    // Check if the teacher is assigned to this class by checking the Class model
    const classData = await Class.findById(classId);
    if (!classData) {
      console.log('Class not found:', classId);
      return res.status(404).json({ error: 'Class not found' });
    }
    
    console.log('Class found:', classData.classType, classData.section);
    console.log('Class teacher ID:', classData.teacher);
    console.log('Current teacher ID:', teacherId);
    
    // Check if the teacher is assigned to this class
    if (!classData.teacher || classData.teacher.toString() !== teacherId.toString()) {
      console.log('Teacher not assigned to class:', classId);
      return res.status(403).json({ error: 'Not authorized to send marks for this class' });
    }
    
    console.log('Teacher is authorized for class:', classId);

    // Find all students in the class
    const students = await User.find({ role: 'student', class: classId })
      .populate('parent')
      .select('firstName lastName parent');

    if (!students || students.length === 0) {
      return res.status(404).json({ error: 'No students found in this class' });
    }
    
    console.log(`Found ${students.length} students in class`);

    // Find marks for the selected criteria
    const marks = await Mark.find({ 
      class: classId,
      subject,
      assessmentType,
      term
    }).populate('student', 'firstName lastName');

    if (!marks || marks.length === 0) {
      return res.status(404).json({ error: 'No marks found for the selected criteria' });
    }
    
    console.log(`Found ${marks.length} marks for the criteria`);

    // Get class information
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // For each student with a parent, create a message with their mark info
    const messagePromises = students
      .filter(student => student.parent) // Only include students with linked parents
      .map(async (student) => {
        const studentMark = marks.find(mark => 
          mark.student._id.toString() === student._id.toString()
        );
        
        if (!studentMark) return null; // Skip if no mark found for this student

        // Calculate grade
        const percentage = (studentMark.score / studentMark.totalScore) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C+';
        else if (percentage >= 40) grade = 'C';

        // Create message for parent
        const message = {
          sender: teacherId,
          receiver: student.parent,
          subject: `${subject} ${assessmentType} Results`,
          content: `
Dear Parent,

This is to inform you about your child's (${student.firstName} ${student.lastName}) performance in the recent ${assessmentType} for ${subject}.

Class: ${classInfo.classType} ${classInfo.section}
Term: ${term}
Subject: ${subject}
Assessment Type: ${assessmentType}
Score: ${studentMark.score}/${studentMark.totalScore} (${percentage.toFixed(1)}%)
Grade: ${grade}
${studentMark.remarks ? `Remarks: ${studentMark.remarks}` : ''}

Please encourage your child to keep up the good work or provide necessary support as needed.

Regards,
${teacher.firstName} ${teacher.lastName}
          `.trim(),
          type: 'academic',
          read_by_receiver: false,
          created_at: new Date()
        };

        // Save the message
        return await new Message(message).save();
      });

    // Wait for all messages to be created
    const messages = await Promise.all(messagePromises);
    const sentCount = messages.filter(Boolean).length;

    res.json({ 
      success: true, 
      message: `Marks sent to ${sentCount} parents successfully`,
      sentCount
    });
  } catch (error) {
    console.error('Error sending marks to parents:', error);
    res.status(500).json({ error: 'Error sending marks to parents' });
  }
};

// Get student's academic results (for student role)
export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;
    const userId = req.user!._id;

    // Verify the student is requesting their own results
    if (studentId !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to view these results' });
    }

    // Build query based on filters
    const query: any = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;

    // Get all marks for this student
    const marks = await Mark.find(query)
      .populate('teacher', 'firstName lastName')
      .sort({ subject: 1, createdAt: -1 });

    if (!marks || marks.length === 0) {
      return res.status(404).json({ 
        message: 'No results found for the selected filters',
        results: []
      });
    }

    res.json(marks);
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ error: 'Error fetching student results' });
  }
};

// Add or update marks in bulk
export const bulkAddOrUpdateMarks = async (req: Request, res: Response) => {
  try {
    const { marks } = req.body;
    const teacherId = req.user!._id;
    
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ error: 'Invalid marks data' });
    }
    
    const results = [];
    const errors = [];
    
    for (const markData of marks) {
      try {
        const { studentId, classId, subject, score, totalScore, assessmentType, term, academicYear, remarks } = markData;
        
        if (!studentId || !classId || !subject || score === undefined || !assessmentType || !term) {
          errors.push({ error: 'Missing required fields', markData });
          continue;
        }
        
        // Verify teacher is assigned to this class
        const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
        if (!teacher || !teacher.assignedClasses?.includes(new mongoose.Types.ObjectId(classId))) {
          errors.push({ error: 'Not authorized to add marks for this class', classId });
          continue;
        }
        
        // Check if student exists
        const student = await User.findById(studentId);
        if (!student) {
          errors.push({ error: 'Student not found', studentId });
          continue;
        }
        
        // Check if a mark already exists for this student, subject, assessment type and term
        const existingMark = await Mark.findOne({
          student: studentId,
          class: classId,
          subject,
          assessmentType,
          term
        });
        
        // Calculate grade based on score percentage
        const actualTotalScore = totalScore || 100;
        const percentage = (score / actualTotalScore) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C+';
        else if (percentage >= 40) grade = 'C';
        
        if (existingMark) {
          // Update existing mark
          existingMark.score = score;
          existingMark.totalScore = actualTotalScore;
          existingMark.grade = grade;
          existingMark.remarks = remarks || existingMark.remarks;
          await existingMark.save();
          results.push(existingMark);
        } else {
          // Create new mark
          const newMark = new Mark({
            student: studentId,
            class: classId,
            subject,
            academicYear: academicYear || new Date().getFullYear(),
            term,
            assessmentType,
            score,
            totalScore: actualTotalScore,
            grade,
            remarks: remarks || '',
            teacher: teacherId,
            createdAt: new Date()
          });
          
          await newMark.save();
          results.push(newMark);
        }
      } catch (err: any) {
        console.error('Error processing mark:', err);
        errors.push({ error: 'Error processing mark', details: err.message });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Processed ${results.length} marks with ${errors.length} errors`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in bulk add/update marks:', error);
    res.status(500).json({ error: 'Error processing marks' });
  }
}; 
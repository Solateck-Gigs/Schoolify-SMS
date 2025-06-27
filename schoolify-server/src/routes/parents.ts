import { Router } from 'express';
import { User } from '../models/User';
import { Attendance } from '../models/Attendance';
import { Class } from '../models/Class';
import { Mark } from '../models/Mark';
import { Fee } from '../models/Fee';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

const router = Router();

// Parent Dashboard Routes - for authenticated parent to access their own data
// These must come BEFORE the parameterized routes to avoid conflicts

// Get current parent's children (for parent dashboard)
router.get('/children', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    
    console.log('Fetching children for parent:', { userId: user._id, role: user.role });
    
    // Find the parent and populate children with class information
    const parent = await User.findById(user._id)
      .populate({
        path: 'children',
        select: 'firstName lastName admissionNumber class dateOfBirth user_id_number email isActive bloodType',
        populate: {
          path: 'class',
          select: 'name section gradeLevel academicYear'
        }
      });

    console.log('Parent found:', { 
      parentId: parent?._id, 
      childrenCount: parent?.children?.length || 0,
      children: parent?.children 
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // If no children are linked, return appropriate message
    if (!parent.children || parent.children.length === 0) {
      return res.json([]);
    }

    res.json(parent.children);
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's academic results
router.get('/child/:childId/results', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;
    const { term, academicYear } = req.query;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Build query for results
    const query: any = { student: childId };
    
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    // Get results data from database
    const results = await Mark.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('class', 'name section gradeLevel')
      .sort({ createdAt: -1 });

    // Process results by subject
    const subjects = [...new Set(results.map(mark => mark.subject))];
    
    interface SubjectResult {
      subject: string;
      exam: {
        scores: any[];
        average: number;
      };
      test: {
        scores: any[];
        average: number;
      };
      overallAverage: number;
      grade: string;
    }
    
    const resultsBySubject: SubjectResult[] = subjects.map(subject => {
      const subjectMarks = results.filter(mark => mark.subject === subject);
      
      // Get test and exam scores
      const examResults = subjectMarks.filter(mark => mark.assessmentType === 'exam');
      const testResults = subjectMarks.filter(mark => mark.assessmentType === 'test');
      
      // Calculate averages
      const examAverage = examResults.length > 0 
        ? examResults.reduce((sum, mark) => sum + (mark.score / mark.totalScore * 100), 0) / examResults.length 
        : 0;
      
      const testAverage = testResults.length > 0
        ? testResults.reduce((sum, mark) => sum + (mark.score / mark.totalScore * 100), 0) / testResults.length
        : 0;
      
      // Calculate overall average for subject
      const overallAverage = (examAverage * 0.7) + (testAverage * 0.3); // 70% exam, 30% test
      
      // Determine grade
      let grade = 'F';
      if (overallAverage >= 90) grade = 'A+';
      else if (overallAverage >= 80) grade = 'A';
      else if (overallAverage >= 70) grade = 'B+';
      else if (overallAverage >= 60) grade = 'B';
      else if (overallAverage >= 50) grade = 'C+';
      else if (overallAverage >= 40) grade = 'C';
      
      return {
        subject,
        exam: {
          scores: examResults,
          average: examAverage
        },
        test: {
          scores: testResults,
          average: testAverage
        },
        overallAverage: Math.round(overallAverage),
        grade
      };
    });
    
    // Calculate class position and promotion status if all subjects available
    const childInfo = await User.findById(childId).populate('class');
    const classStudents = await User.find({ class: childInfo?.class?._id, role: 'student' });
    
    // Calculate overall performance for promotion decision
    const overallScore = resultsBySubject.reduce((sum, subject) => sum + subject.overallAverage, 0);
    const promotionThreshold = 400; // Configurable threshold for promotion
    const promotionStatus = {
      totalScore: overallScore,
      threshold: promotionThreshold,
      canBePromoted: overallScore >= promotionThreshold,
      nextClass: childInfo?.class ? `${parseInt((childInfo.class as any).gradeLevel as string) + 1}` : 'Unknown'
    };

    res.json({
      studentInfo: {
        name: `${childInfo?.firstName} ${childInfo?.lastName}`,
        class: childInfo?.class,
        classSize: classStudents.length
      },
      resultsBySubject,
      promotionStatus,
      term: term || 'All terms',
      academicYear: academicYear || 'All years'
    });
  } catch (error) {
    console.error('Error fetching child results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's performance data
router.get('/child/:childId/performance', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Get real marks data from database
    const marks = await Mark.find({ student: childId })
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 })
      .limit(50);

    // Calculate performance summary from real data
    let totalAssessments = marks.length;
    let totalScore = 0;
    let subjectAverages: { [key: string]: { total: number; count: number; average: number } } = {};
    let gradeDistribution = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0 };

    marks.forEach(mark => {
      // Calculate percentage for this mark
      const percentage = (mark.score / mark.totalScore) * 100;
      totalScore += percentage;

      // Group by subject
      if (!subjectAverages[mark.subject]) {
        subjectAverages[mark.subject] = { total: 0, count: 0, average: 0 };
      }
      subjectAverages[mark.subject].total += percentage;
      subjectAverages[mark.subject].count++;

      // Count grade distribution
      if (gradeDistribution.hasOwnProperty(mark.grade)) {
        gradeDistribution[mark.grade as keyof typeof gradeDistribution]++;
      }
    });

    // Calculate averages
    Object.keys(subjectAverages).forEach(subject => {
      subjectAverages[subject].average = subjectAverages[subject].total / subjectAverages[subject].count;
    });

    const performanceData = {
      marks: marks.map(mark => ({
        _id: mark._id,
        subject: mark.subject,
        score: mark.score,
        totalScore: mark.totalScore,
        grade: mark.grade,
        assessmentType: mark.assessmentType,
        createdAt: mark.createdAt,
        teacher: mark.teacher
      })),
      summary: {
        totalAssessments,
        averageScore: totalAssessments > 0 ? totalScore / totalAssessments : 0,
        subjectAverages,
        gradeDistribution
      }
    };

    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching child performance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's attendance data
router.get('/child/:childId/attendance', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Get real attendance records from database
    const attendance = await Attendance.find({ student: childId })
      .sort({ date: -1 })
      .limit(100);

    // Calculate real summary from database data
    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'tardy').length,
      presentPercentage: 0,
      absentPercentage: 0,
      latePercentage: 0
    };

    if (summary.totalDays > 0) {
      summary.presentPercentage = Math.round((summary.present / summary.totalDays) * 100);
      summary.absentPercentage = Math.round((summary.absent / summary.totalDays) * 100);
      summary.latePercentage = Math.round((summary.late / summary.totalDays) * 100);
    }

    res.json({
      attendance,
      summary
    });
  } catch (error) {
    console.error('Error fetching child attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's timetable
router.get('/child/:childId/timetable', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Get child's class
    const child = await User.findById(childId).populate('class');
    if (!child || !child.class) {
      return res.status(404).json({ error: 'Child or class not found' });
    }

    // Get timetable for child's class
    const timetable = await Class.findById(child.class._id)
      .populate({
        path: 'timetable',
        populate: {
          path: 'teacher',
          select: 'firstName lastName'
        }
      });

    if (!timetable || !(timetable as any).timetable) {
      return res.json({ message: 'No timetable available for this class', timetable: [] });
    }

    res.json((timetable as any).timetable);
  } catch (error) {
    console.error('Error fetching child timetable:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's fees data
router.get('/child/:childId/fees', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Get real fees data from database
    const fees = await Fee.find({ student: childId })
      .sort({ dueDate: -1 });

    // Calculate real summary from database data
    const totalFees = fees.reduce((sum, fee) => sum + fee.amountDue, 0);
    const paidFees = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const outstandingFees = totalFees - paidFees;

    const summary = {
      totalFees,
      paidFees,
      outstandingFees,
      paymentStatus: {
        paid: fees.filter(f => f.status === 'paid').length,
        partially_paid: fees.filter(f => f.status === 'partially_paid').length,
        unpaid: fees.filter(f => f.status === 'unpaid').length
      }
    };

    const feesData = {
      fees: fees.map(fee => ({
        _id: fee._id,
        academic_year: fee.academicYear,
        term: fee.term,
        amount_due: fee.amountDue,
        amount_paid: fee.amountPaid,
        status: fee.status,
        due_date: fee.dueDate
      })),
      summary
    };

    res.json(feesData);
  } catch (error) {
    console.error('Error fetching child fees:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's stats
router.get('/child/:childId/stats', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Get real attendance data
    const attendanceRecords = await Attendance.find({ student: childId })
      .sort({ date: -1 })
      .limit(30)
      .select('date status');
    
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // Get real marks data
    const marks = await Mark.find({ student: childId })
      .sort({ date: -1 })
      .limit(10);

    // Calculate real average grade from database
    let averageGrade = 0;
    if (marks.length > 0) {
      const totalPercentage = marks.reduce((sum, mark) => sum + (mark.score / mark.totalScore * 100), 0);
      averageGrade = Math.round(totalPercentage / marks.length);
    }

    // Get real fees data
    const fees = await Fee.find({ student: childId });
    const totalFees = fees.reduce((sum, fee) => sum + fee.amountDue, 0);
    const paidFees = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);

    // Map real grades data for frontend
    const recentGrades = marks.map(mark => ({
      subject: mark.subject,
      score: mark.score,
      totalScore: mark.totalScore,
      createdAt: mark.createdAt.toISOString()
    }));

    const stats = {
      attendanceRate,
      averageGrade,
      totalFees,
      paidFees,
      recentGrades,
      attendanceRecords: attendanceRecords.map(record => ({
        date: record.date,
        status: record.status
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching child stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's monthly stats
router.get('/child/:childId/monthly-stats', authenticateToken, requireRole(['parent']), async (req, res) => {
  try {
    const { user } = req as AuthRequest;
    const { childId } = req.params;
    const { months = 6 } = req.query;

    // Verify this child belongs to the authenticated parent
    const parent = await User.findById(user._id);
    const childObjectId = new Types.ObjectId(childId);
    if (!parent || !parent.children?.some(child => child.equals(childObjectId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s data' });
    }

    // Calculate date range
    const monthsBack = parseInt(months as string) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    // Get real marks data for the period
    const marks = await Mark.find({ 
      student: childId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Group marks by month and calculate averages
    const monthlyStats: any[] = [];
    const monthGroups: { [key: string]: any[] } = {};

    marks.forEach(mark => {
      const monthKey = mark.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(mark);
    });

    // Calculate monthly averages
    Object.keys(monthGroups).forEach(monthKey => {
      const monthMarks = monthGroups[monthKey];
      const totalPercentage = monthMarks.reduce((sum, mark) => sum + (mark.score / mark.totalScore * 100), 0);
      const average = monthMarks.length > 0 ? totalPercentage / monthMarks.length : 0;

      monthlyStats.push({
        month: monthKey,
        performance: Math.round(average),
        classAverage: Math.round(average), // For now, use same value - can be enhanced later
        assessments: monthMarks.length
      });
    });

    res.json(monthlyStats);
  } catch (error) {
    console.error('Error fetching child monthly stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search parents
router.get('/search', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search for parents where firstName or lastName contains the query (case insensitive)
    const parents = await User.find({
      role: 'parent',
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id firstName lastName email phone')
    .limit(10);

    res.json(parents);
  } catch (error) {
    console.error('Error searching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all parents
router.get('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get parent by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const parent = await User.findOne({ _id: req.params.id, role: 'parent' })
      .populate('children', 'firstName lastName admissionNumber class')
      .select('-password');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parent);
  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update parent
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      homeAddress, occupation, children
    } = req.body;

    // Prepare update data
    const updateData: any = {
      firstName, lastName, email, phone,
      homeAddress, occupation
    };

    // Convert children user ID strings to ObjectIds if provided
    if (children && Array.isArray(children) && children.length > 0) {
      try {
        const childObjectIds = [];
        for (const childUserId of children) {
          if (childUserId && childUserId.trim()) {
            const childUser = await User.findOne({ 
              user_id_number: childUserId.trim(), 
              role: 'student' 
            });
            if (childUser) {
              childObjectIds.push(childUser._id);
            } else {
              console.warn(`Student with user ID ${childUserId} not found`);
            }
          }
        }
        updateData.children = childObjectIds;
      } catch (error) {
        console.error('Error converting children user IDs to ObjectIds:', error);
        // Continue without updating children if conversion fails
      }
    } else if (children !== undefined) {
      // If children is explicitly set to empty array or null, clear it
      updateData.children = [];
    }

    const parent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'parent' },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parent);
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete parent
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const parent = await User.findOneAndDelete({ _id: req.params.id, role: 'parent' });

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    console.error('Error deleting parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get parent's children
router.get('/:id/children', authenticateToken, async (req, res) => {
  try {
    const parent = await User.findOne({ _id: req.params.id, role: 'parent' })
      .populate('children', 'firstName lastName admissionNumber class dateOfBirth');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parent.children || []);
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
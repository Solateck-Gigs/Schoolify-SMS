import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Mark } from '../models/Mark';
import { Attendance } from '../models/Attendance';
import { Fee } from '../models/Fee';
import { Message } from '../models/Message';
import { AuthRequest } from '../types/express';

// Get all children of a parent
export const getChildren = async (req: Request, res: Response) => {
  try {
    const parentId = req.user!._id;

    const parent = await User.findById(parentId)
      .populate({
        path: 'children',
        populate: {
          path: 'class',
          select: 'name section academicYear'
        }
      });

    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(parent.children);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching children' });
  }
};

// Get academic performance for a child
export const getChildPerformance = async (req: Request, res: Response) => {
  try {
    const { childId } = req.params;
    const { academicYear, term } = req.query;
    const parentId = req.user!._id;

    // Verify this is parent's child
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent' || !parent.children?.includes(new mongoose.Types.ObjectId(childId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s performance' });
    }

    // Build query based on filters
    const query: any = { student: childId };
    if (academicYear) query.academic_year = academicYear;
    if (term) query.term = term;

    const marks = await Mark.find(query)
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 });

    // Calculate summary statistics
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
      marks,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching child\'s performance' });
  }
};

// Get attendance records for a child
export const getChildAttendance = async (req: Request, res: Response) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate } = req.query;
    const parentId = req.user!._id;

    // Verify this is parent's child
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent' || !parent.children?.includes(new mongoose.Types.ObjectId(childId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s attendance' });
    }

    // Build query based on filters
    const query: any = { student: childId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });

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
      summary.presentPercentage = (summary.present / summary.totalDays) * 100;
      summary.absentPercentage = (summary.absent / summary.totalDays) * 100;
      summary.tardyPercentage = (summary.tardy / summary.totalDays) * 100;
    }

    res.json({
      attendance,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching child\'s attendance' });
  }
};

// Get fee records for a child
export const getChildFees = async (req: Request, res: Response) => {
  try {
    const { childId } = req.params;
    const { academicYear } = req.query;
    const parentId = req.user!._id;

    // Verify this is parent's child
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent' || !parent.children?.includes(new mongoose.Types.ObjectId(childId))) {
      return res.status(403).json({ error: 'Not authorized to view this child\'s fees' });
    }

    // Build query based on filters
    const query: any = { student: childId };
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query).sort({ dueDate: -1 });

    // Calculate summary statistics
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

    res.json({
      fees,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching child\'s fees' });
  }
};

// Get suggestions made by the parent
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find all suggestions made by this parent
    const suggestions = await Message.find({
      sender: user._id,
      type: { $in: ['suggestion', 'question'] }
    })
    .populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ])
    .sort({ created_at: -1 });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching parent suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new suggestion
export const createSuggestion = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { subject, content, type } = req.body;

    if (!content || !subject) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Get an admin user to receive the suggestion
    const admin = await User.findOne({ 
      role: { $in: ['admin', 'super_admin'] } 
    });

    if (!admin) {
      return res.status(500).json({ error: 'No admin found to receive suggestion' });
    }

    // Create new suggestion message
    const newSuggestion = new Message({
      sender: user._id,
      receiver: admin._id,
      subject,
      content,
      type: type || 'suggestion',
      read_by_receiver: false
    });

    await newSuggestion.save();

    const populatedSuggestion = await newSuggestion.populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ]);

    // Emit socket event for new suggestion if io is available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Get all admin users
      const adminUsers = await User.find({ 
        role: { $in: ['admin', 'super_admin'] } 
      }).select('_id');
      
      // Emit to all admin users
      adminUsers.forEach((admin) => {
        io.to(admin._id.toString()).emit('newSuggestion', populatedSuggestion);
      });
    }

    res.status(201).json(populatedSuggestion);
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
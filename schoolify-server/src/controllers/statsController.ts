import { Request, Response } from 'express';
import { User } from '../models/User';
import { Fee } from '../models/Fee';
import { Attendance } from '../models/Attendance';
import { Mark } from '../models/Mark';
import { Class } from '../models/Class';

export const getOverallStats = async (req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalFeesCollected,
      attendanceStats
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Fee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amountPaid' }
          }
        }
      ]),
      Attendance.aggregate([
        {
          $group: {
            _id: null,
            totalPresent: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            total: { $sum: 1 }
          }
        }
      ])
    ]);

    const averageAttendance = attendanceStats.length > 0
      ? (attendanceStats[0].totalPresent / attendanceStats[0].total) * 100
      : 0;

    res.json({
      totalStudents,
      totalTeachers,
      totalFeesCollected: totalFeesCollected.length > 0 ? totalFeesCollected[0].total : 0,
      averageAttendance: Math.round(averageAttendance * 100) / 100
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMonthlyStats = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const [
      studentRegistrations,
      teacherRegistrations,
      monthlyFees,
      monthlyAttendance
    ] = await Promise.all([
      User.aggregate([
        {
          $match: {
            role: 'student',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      User.aggregate([
        {
          $match: {
            role: 'teacher',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Fee.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amountPaid' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Process monthly attendance data
    const attendanceByMonth = new Map();
    monthlyAttendance.forEach((record: any) => {
      const key = `${record._id.year}-${record._id.month}`;
      if (!attendanceByMonth.has(key)) {
        attendanceByMonth.set(key, { total: 0, present: 0 });
      }
      const monthData = attendanceByMonth.get(key);
      monthData.total += record.count;
      if (record._id.status === 'present') {
        monthData.present += record.count;
      }
    });

    // Format response
    const monthlyStats = [];
    for (let i = 0; i < months; i++) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      const studentCount = studentRegistrations.find(
        (r: any) => r._id.year === year && r._id.month === month
      )?.count || 0;

      const teacherCount = teacherRegistrations.find(
        (r: any) => r._id.year === year && r._id.month === month
      )?.count || 0;

      const feesCollected = monthlyFees.find(
        (r: any) => r._id.year === year && r._id.month === month
      )?.total || 0;

      const attendance = attendanceByMonth.get(key) || { total: 0, present: 0 };
      const attendanceRate = attendance.total > 0
        ? (attendance.present / attendance.total) * 100
        : 0;

      monthlyStats.unshift({
        year,
        month,
        studentRegistrations: studentCount,
        teacherRegistrations: teacherCount,
        feesCollected,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      });
    }

    res.json(monthlyStats);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
}; 
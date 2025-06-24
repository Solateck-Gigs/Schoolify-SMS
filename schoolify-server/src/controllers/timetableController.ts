import { Request, Response } from 'express';
import { Timetable } from '../models/Timetable';
import { Class } from '../models/Class';
import { User } from '../models/User';
import { AuthRequest } from '../types/express';

// Create a new timetable entry
export const createTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { class: classId, subject, teacher, dayOfWeek, startTime, endTime, room, academicYear, term } = req.body;

    // Validate required fields
    if (!classId || !subject || !teacher || !dayOfWeek || !startTime || !endTime || !room || !academicYear || !term) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          classId: !classId ? 'Class is required' : null,
          subject: !subject ? 'Subject is required' : null,
          teacher: !teacher ? 'Teacher is required' : null,
          dayOfWeek: !dayOfWeek ? 'Day is required' : null,
          startTime: !startTime ? 'Start time is required' : null,
          endTime: !endTime ? 'End time is required' : null,
          room: !room ? 'Room is required' : null,
          academicYear: !academicYear ? 'Academic year is required' : null,
          term: !term ? 'Term is required' : null
        }
      });
    }

    // Validate class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Validate teacher exists and is a teacher
    const teacherExists = await User.findOne({ _id: teacher, role: 'teacher' });
    if (!teacherExists) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:mm format (24-hour)' });
    }

    // Validate day of week
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      return res.status(400).json({ error: 'Day must be between 1 (Monday) and 5 (Friday)' });
    }

    // Validate time order
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'Start time must be before end time' });
    }

    // Check for time conflicts
    const timeConflict = await Timetable.findOne({
      academicYear,
      term,
      $or: [
        // Class time conflict
        {
          class: classId,
          dayOfWeek,
          $or: [
            {
              startTime: { $lte: startTime },
              endTime: { $gt: startTime }
            },
            {
              startTime: { $lt: endTime },
              endTime: { $gte: endTime }
            }
          ]
        },
        // Teacher time conflict
        {
          teacher,
          dayOfWeek,
          $or: [
            {
              startTime: { $lte: startTime },
              endTime: { $gt: startTime }
            },
            {
              startTime: { $lt: endTime },
              endTime: { $gte: endTime }
            }
          ]
        },
        // Room time conflict
        {
          room,
          dayOfWeek,
          $or: [
            {
              startTime: { $lte: startTime },
              endTime: { $gt: startTime }
            },
            {
              startTime: { $lt: endTime },
              endTime: { $gte: endTime }
            }
          ]
        }
      ]
    }).populate('class', 'name section')
      .populate('teacher', 'firstName lastName');

    if (timeConflict) {
      return res.status(400).json({ 
        error: 'Time conflict detected',
        details: {
          conflictingEntry: {
            class: timeConflict.class,
            teacher: timeConflict.teacher,
            startTime: timeConflict.startTime,
            endTime: timeConflict.endTime,
            room: timeConflict.room
          }
        }
      });
    }

    const timetableEntry = new Timetable({
      class: classId,
      subject,
      teacher,
      dayOfWeek,
      startTime,
      endTime,
      room,
      academicYear,
      term,
      createdBy: user._id
    });

    await timetableEntry.save();

    const savedEntry = await Timetable.findById(timetableEntry._id)
      .populate('teacher', 'firstName lastName')
      .populate('class', 'name section gradeLevel');

    res.status(201).json(savedEntry);
  } catch (error: any) {
    console.error('Error creating timetable entry:', error);
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: Object.keys(error.errors).reduce((acc: any, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    // Handle mongoose cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        details: {
          field: error.path,
          value: error.value
        }
      });
    }
    res.status(500).json({ error: 'Failed to create timetable entry', details: error.message });
  }
};

// Get timetable for a specific class
export const getClassTimetable = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { academicYear, term } = req.query;

    const query: any = { class: classId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;

    const timetable = await Timetable.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('class', 'name section gradeLevel')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching class timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

// Get timetable for a specific teacher
export const getTeacherTimetable = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, term } = req.query;

    const query: any = { teacher: teacherId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;

    const timetable = await Timetable.find(query)
      .populate('class', 'name section gradeLevel')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.json(timetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

// Update a timetable entry
export const updateTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, startTime, endTime, room } = req.body;

    // Only allow updating certain fields
    const updates: any = {};
    if (subject) updates.subject = subject;
    if (startTime) updates.startTime = startTime;
    if (endTime) updates.endTime = endTime;
    if (room) updates.room = room;

    const timetableEntry = await Timetable.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('teacher', 'firstName lastName')
      .populate('class', 'name section gradeLevel');

    if (!timetableEntry) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    res.json(timetableEntry);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
};

// Delete a timetable entry
export const deleteTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const timetableEntry = await Timetable.findByIdAndDelete(id);

    if (!timetableEntry) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }

    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
}; 
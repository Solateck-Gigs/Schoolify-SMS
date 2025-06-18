import { Router, Request, Response } from 'express';
import { Announcement } from '../models/Announcement';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';

// Define valid target roles for announcements
type AnnouncementRole = 'admin' | 'teacher' | 'parent' | 'student' | 'all';

const router = Router();

// Get all announcements (visible to all roles or targeted roles)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    // Map super_admin to admin for announcement access
    const userRole: AnnouncementRole = user.role === 'admin' ? 'admin' : user.role as AnnouncementRole;

    const query = {
      $or: [
        { targetRoles: 'all' },
        { targetRoles: userRole },
      ],
    };

    const announcements = await Announcement.find(query)
      .populate('author', 'firstName lastName role')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get announcement by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    // Map super_admin to admin for announcement access
    const userRole: AnnouncementRole = user.role === 'admin' ? 'admin' : user.role as AnnouncementRole;

    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'firstName lastName role');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user has permission to view this announcement
    if (
      announcement.targetRoles.includes('all') ||
      announcement.targetRoles.includes(userRole)
    ) {
      res.json(announcement);
    } else {
      res.status(403).json({ error: 'Not authorized to view this announcement' });
    }
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new announcement (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;

    const {
      title,
      content,
      targetRoles,
    } = req.body;

    const newAnnouncement = new Announcement({
      title,
      content,
      author: user._id,
      targetRoles: targetRoles || ['all'],
    });

    await newAnnouncement.save();

    await newAnnouncement.populate('author', 'firstName lastName role');
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update announcement (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      targetRoles,
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (targetRoles) announcement.targetRoles = targetRoles;

    await announcement.save();

    await announcement.populate('author', 'firstName lastName role');
    res.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
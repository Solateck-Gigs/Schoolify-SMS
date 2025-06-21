import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Announcement } from '../models/Announcement';
import { User } from '../models/User';
import { AuthRequest } from '../types/express';

const router = express.Router();

// Get all announcements (role-based filtering)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    
    // Build query based on user role
    let query: any = { isActive: true };
    
    // Filter by target audience based on user role
    if (user.role === 'student') {
      query.targetAudience = { $in: ['all', 'students'] };
    } else if (user.role === 'teacher') {
      query.targetAudience = { $in: ['all', 'teachers'] };
    } else if (user.role === 'parent') {
      query.targetAudience = { $in: ['all', 'parents'] };
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      query.targetAudience = { $in: ['all', 'admins', 'students', 'teachers', 'parents'] };
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'firstName lastName role');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user has access to this announcement
    const hasAccess = announcement.targetAudience.includes('all') || 
      announcement.targetAudience.includes(user.role + 's') ||
      (user.role === 'admin' || user.role === 'super_admin');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement (admin/super_admin only)
router.post('/', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { title, content, priority, targetAudience } = req.body;

    if (!title || !content || !targetAudience || targetAudience.length === 0) {
      return res.status(400).json({ error: 'Title, content, and target audience are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'medium',
      targetAudience,
      createdBy: user._id,
      isActive: true,
      readBy: []
    });

    await announcement.save();
    
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'firstName lastName role');

    res.status(201).json(populatedAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (admin/super_admin only)
router.put('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { id } = req.params;
    const { title, content, priority, targetAudience, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only allow creator or super_admin to edit
    if (announcement.createdBy.toString() !== user._id.toString() && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'You can only edit your own announcements' });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (priority !== undefined) updates.priority = priority;
    if (targetAudience !== undefined) updates.targetAudience = targetAudience;
    if (isActive !== undefined) updates.isActive = isActive;
    updates.updatedAt = new Date();

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('createdBy', 'firstName lastName role');

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin/super_admin only)
router.delete('/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only allow creator or super_admin to delete
    if (announcement.createdBy.toString() !== user._id.toString() && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'You can only delete your own announcements' });
    }

    await Announcement.findByIdAndDelete(id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// Mark announcement as read
router.post('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user has access to this announcement
    const hasAccess = announcement.targetAudience.includes('all') || 
      announcement.targetAudience.includes(user.role + 's') ||
      (user.role === 'admin' || user.role === 'super_admin');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add user to readBy array if not already present
    if (!announcement.readBy.includes(user._id)) {
      announcement.readBy.push(user._id);
      await announcement.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Get unread announcements count
router.get('/unread/count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { user } = req as AuthRequest;
    
    // Build query based on user role
    let query: any = { 
      isActive: true,
      readBy: { $nin: [user._id] }
    };
    
    // Filter by target audience based on user role
    if (user.role === 'student') {
      query.targetAudience = { $in: ['all', 'students'] };
    } else if (user.role === 'teacher') {
      query.targetAudience = { $in: ['all', 'teachers'] };
    } else if (user.role === 'parent') {
      query.targetAudience = { $in: ['all', 'parents'] };
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      query.targetAudience = { $in: ['all', 'admins', 'students', 'teachers', 'parents'] };
    }

    const count = await Announcement.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get announcement statistics (admin/super_admin only)
router.get('/stats/overview', authenticateToken, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const totalAnnouncements = await Announcement.countDocuments({ isActive: true });
    const urgentAnnouncements = await Announcement.countDocuments({ 
      isActive: true, 
      priority: 'urgent' 
    });
    const highPriorityAnnouncements = await Announcement.countDocuments({ 
      isActive: true, 
      priority: 'high' 
    });
    
    // Get recent announcements
    const recentAnnouncements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalAnnouncements,
      urgentAnnouncements,
      highPriorityAnnouncements,
      recentAnnouncements
    });
  } catch (error) {
    console.error('Error getting announcement stats:', error);
    res.status(500).json({ error: 'Failed to get announcement statistics' });
  }
});

export default router; 
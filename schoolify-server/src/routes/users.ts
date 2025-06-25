import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get users for chat based on role restrictions
router.get('/chat-contacts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log("User requesting chat contacts:", user.role, user._id);

    // For debugging purposes, let's get all users first
    const allUsers = await User.find({})
      .select('_id firstName lastName role email user_id_number')
      .lean();
    
    console.log("Total users in database:", allUsers.length);
    
    let contacts = [];
    
    // Apply role-based restrictions
    switch (user.role) {
      case 'parent':
        // Parents can only chat with teachers
        contacts = allUsers.filter(u => u.role === 'teacher' && u._id.toString() !== user._id.toString());
        break;
      case 'teacher':
        // Teachers can chat with parents and admin
        contacts = allUsers.filter(u => 
          (u.role === 'parent' || u.role === 'admin' || u.role === 'super_admin') && 
          u._id.toString() !== user._id.toString()
        );
        break;
      case 'admin':
      case 'super_admin':
        // Admins can chat with teachers
        contacts = allUsers.filter(u => 
          u.role === 'teacher' && 
          u._id.toString() !== user._id.toString()
        );
        break;
      default:
        return res.status(403).json({ error: 'Your role does not have chat permissions' });
    }

    console.log("Filtered contacts for role", user.role, ":", contacts.length);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching chat contacts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID with role-specific profile data
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as AuthRequest).user;
    const targetUserId = req.params.id;

    // Check if user is requesting their own data or has admin privileges
    const isOwnData = requestingUser._id.toString() === targetUserId;
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser.role);

    if (!isOwnData && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this user data' });
    }

    // Get user data with all role-specific fields
    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // All profile data is now in the User model, so profile is always complete
    res.json({
      user,
      profile: user,
      isProfileComplete: true
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as AuthRequest).user;
    if (!requestingUser || !requestingUser._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Users can only update their own profile unless they're admin
    if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    const { firstName, lastName, email } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all admin users
router.get('/admins', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Find all users with role 'admin' or 'super_admin'
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] }
    }).select('_id firstName lastName email role');

    res.json(admins);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
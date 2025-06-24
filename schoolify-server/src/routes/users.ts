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

export default router; 
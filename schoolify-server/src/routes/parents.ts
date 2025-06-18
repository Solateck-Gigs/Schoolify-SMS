import { Router, Request, Response } from 'express';
import { Parent } from '../models/Parent';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import { Types } from 'mongoose';

// Type guard for populated parent
interface PopulatedParent {
  user: Types.ObjectId;
  [key: string]: any;
}

function isPopulatedParent(parent: any): parent is PopulatedParent {
  return parent && parent.user instanceof Types.ObjectId;
}

const router = Router();

// Get all parents (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const parents = await Parent.find()
      .populate('user', 'firstName lastName email')
      .populate('students', 'firstName lastName admissionNumber');
    res.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get parent by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const parent = await Parent.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('students', 'firstName lastName admissionNumber');

    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Check if user has permission to view this parent
    if (user.role === 'parent' && parent.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this parent' });
    }

    res.json(parent);
  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new parent (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      homeAddress,
      occupation,
      childrenIds // Optional array of existing student IDs
    } = req.body;

    // Create user account for parent
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'parent'
    });
    await user.save();

    // Create parent record
    const parent = new Parent({
      user: user._id,
      homeAddress,
      occupation,
      children: childrenIds || []
    });

    await parent.save();

    // Update children's parent field if childrenIds are provided
    if (childrenIds && childrenIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: childrenIds } },
        { $set: { parent: parent._id } }
      );
    }

    // Populate references before sending response
    await parent.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'students', select: 'firstName lastName admissionNumber' }
    ]);

    res.status(201).json(parent);
  } catch (error) {
    console.error('Error creating parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update parent (admin or self only)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Check if user has permission to update this parent
    if (user.role !== 'admin' && parent.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this parent' });
    }

    const {
      occupation,
      homeAddress,
      children
    } = req.body;

    // Update parent fields
    if (occupation) parent.occupation = occupation;
    if (homeAddress) parent.homeAddress = homeAddress;
    if (children) parent.children = children;

    await parent.save();

    // Populate references before sending response
    await parent.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'children', select: 'firstName lastName admissionNumber' }
    ]);

    res.json(parent);
  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete parent (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Dissociate children from this parent before deleting
    await Student.updateMany(
      { parent: parent._id },
      { $unset: { parent: 1 } }
    );

    // Delete associated user account
    await User.findByIdAndDelete(parent.user);

    // Delete parent record
    await parent.deleteOne();

    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    console.error('Error deleting parent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search parents by name (for student form autocomplete)
router.get('/search', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { search } = req.query;
    const query: any = { role: 'parent' };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    // Only return basic info
    const parents = await User.find(query, 'id firstName lastName email phone');
    res.json(parents);
  } catch (error) {
    console.error('Error searching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all parents (admin only)
router.get('/fetch', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' }, 'user_id_number firstName lastName email phone');
    res.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync parents collection with users collection (create parent doc for each user with role 'parent')
router.post('/sync-from-users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({ role: 'parent' });
    let created = 0;
    let existed = 0;
    for (const user of users) {
      const existing = await Parent.findOne({ user: user._id });
      if (existing) {
        existed++;
        continue;
      }
      await Parent.create({
        user: user._id,
        homeAddress: '',
        occupation: '',
        children: []
      });
      created++;
    }
    res.json({ created, existed, total: users.length });
  } catch (error) {
    console.error('Error syncing parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
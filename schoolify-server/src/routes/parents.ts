import { Router } from 'express';
import { User } from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Search parents
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || typeof search !== 'string' || search.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = search.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    const parents = await User.find({
      role: 'parent',
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { user_id_number: searchRegex }
      ]
    })
    .select('_id firstName lastName email user_id_number')
    .limit(10)
    .sort({ firstName: 1, lastName: 1 });

    res.json(parents);
  } catch (error) {
    console.error('Error searching parents:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all parents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' })
      .populate('children', 'firstName lastName admissionNumber')
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
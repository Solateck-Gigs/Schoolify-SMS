import { Router } from 'express';
import { User } from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

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

    const parent = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'parent' },
      {
        firstName, lastName, email, phone,
        homeAddress, occupation, children
      },
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
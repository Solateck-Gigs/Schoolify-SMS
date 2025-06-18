import { Router } from 'express';
import { User } from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Admin } from '../models/Admin';

const router = Router();

// Get all admins (role: 'admin')
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get admin details
router.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
      .select('-password');
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    res.json(admin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const admin = await User.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    if (admin.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    admin.firstName = firstName || admin.firstName;
    admin.lastName = lastName || admin.lastName;
    admin.email = email || admin.email;
    
    await admin.save();
    
    res.json(admin);
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all super_admins (role: 'super_admin')
router.get('/super_admins', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const superAdmins = await Admin.find()
      .populate({
        path: 'user',
        match: { role: 'super_admin' },
        select: 'user_id_number first_name last_name email phone'
      });
    // Filter out admins where user is null (not a super_admin)
    const filtered = superAdmins.filter(a => a.user);
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching super_admins:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync admins collection with users collection (create admin doc for each user with role 'admin' or 'super_admin')
router.post('/sync-from-users', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    let created = 0;
    let existed = 0;
    for (const user of users) {
      const existing = await Admin.findOne({ user: user._id });
      if (existing) {
        existed++;
        continue;
      }
      await Admin.create({
        user: user._id
      });
      created++;
    }
    res.json({ created, existed, total: users.length });
  } catch (error) {
    console.error('Error syncing admins:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
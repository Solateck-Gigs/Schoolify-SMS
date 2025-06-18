import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Parent } from '../models/Parent';

// Step 1: Basic user registration
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, user_id_number, phone } = req.body;

    if (!firstName || !lastName || !email || !password || !role || !user_id_number) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { user_id_number }
      ]
    });
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      user_id_number,
      phone
    });

    // Save user (password will be hashed by the pre-save middleware)
    await user.save();

    // Generate token
    const token = jwt.sign(
      { _id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.json({ 
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        user_id_number: user.user_id_number,
        phone: user.phone
      },
      message: 'Basic registration successful. Please complete your profile.'
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Step 2: Complete role-specific profile
export const completeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role } = user;
    const roleData = req.body;

    let profileRecord;

    switch (role) {
      case 'teacher':
        // Validate teacher-specific fields
        if (!roleData.employeeId || !roleData.dateOfHire || !roleData.subjectsTaught) {
          return res.status(400).json({ error: 'Missing required teacher fields' });
        }

        profileRecord = new Teacher({
          user: userId,
          employeeId: roleData.employeeId,
          dateOfHire: roleData.dateOfHire,
          subjectsTaught: roleData.subjectsTaught,
          assignedClasses: roleData.assignedClasses || [],
          qualifications: roleData.qualifications || [],
          experienceYears: roleData.experienceYears || 0
        });
        break;

      case 'student':
        // Validate student-specific fields
        if (!roleData.admissionNumber || !roleData.dateOfBirth || !roleData.gender) {
          return res.status(400).json({ error: 'Missing required student fields' });
        }

        profileRecord = new Student({
          user: userId,
          admissionNumber: roleData.admissionNumber,
          dateOfBirth: roleData.dateOfBirth,
          gender: roleData.gender,
          class: roleData.class,
          parent: roleData.parent,
          medicalConditions: roleData.medicalConditions || [],
          bloodType: roleData.bloodType,
          allergies: roleData.allergies || []
        });
        break;

      case 'parent':
        // Validate parent-specific fields
        if (!roleData.homeAddress) {
          return res.status(400).json({ error: 'Missing required parent fields' });
        }

        profileRecord = new Parent({
          user: userId,
          homeAddress: roleData.homeAddress,
          occupation: roleData.occupation || '',
          children: roleData.children || []
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid role for profile completion' });
    }

    await profileRecord.save();

    res.json({
      message: 'Profile completed successfully',
      profile: profileRecord
    });

  } catch (error) {
    console.error('Error in completeProfile:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { user_id_number, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ user_id_number });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { _id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Check if profile is complete
    let profileComplete = false;
    let profileData = null;

    switch (user.role) {
      case 'teacher':
        profileData = await Teacher.findOne({ user: user._id });
        break;
      case 'student':
        profileData = await Student.findOne({ user: user._id });
        break;
      case 'parent':
        profileData = await Parent.findOne({ user: user._id });
        break;
      default:
        profileComplete = true; // Admin roles don't need additional profile
    }

    if (profileData) {
      profileComplete = true;
    }

    res.json({ 
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        user_id_number: user.user_id_number,
        phone: user.phone
      },
      profileComplete,
      profileData
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
}; 
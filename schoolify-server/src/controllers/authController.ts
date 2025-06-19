import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Enhanced registration for all roles in one endpoint
export const register = async (req: Request, res: Response) => {
  try {
    const { 
      firstName, lastName, email, password, role, user_id_number, phone,
      // Teacher fields
      employeeId, dateOfHire, subjectsTaught, assignedClasses, qualifications, experienceYears,
      // Student fields
      admissionNumber, dateOfBirth, gender, classId, parentId, medicalConditions, bloodType, allergies, specialNeeds, studentNotes,
      // Parent fields
      children, homeAddress, occupation
    } = req.body;

    if (!firstName || !lastName || !email || !role || !user_id_number) {
      return res.status(400).json({ error: 'Basic fields (firstName, lastName, email, role, user_id_number) are required' });
    }

    // Password validation - required for all roles except students
    if (role !== 'student' && !password) {
      return res.status(400).json({ error: 'Password is required for this role' });
    }

    // Role-specific validation
    if (role === 'teacher') {
      if (!employeeId) {
        return res.status(400).json({ error: 'Employee ID is required for teachers' });
      }
    }

    if (role === 'student') {
      if (!admissionNumber || !dateOfBirth || !gender) {
        return res.status(400).json({ error: 'Admission number, date of birth, and gender are required for students' });
      }
    }

    if (role === 'parent') {
      if (!homeAddress) {
        return res.status(400).json({ error: 'Home address is required for parents' });
      }
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { user_id_number },
        ...(employeeId ? [{ employeeId }] : []),
        ...(admissionNumber ? [{ admissionNumber }] : [])
      ]
    });
    
    if (user) {
      return res.status(400).json({ error: 'User already exists with this email, user ID, employee ID, or admission number' });
    }

    // Create user data object
    const userData: any = {
      firstName,
      lastName,
      email,
      role,
      user_id_number,
      phone
    };

    // Add password for non-student roles
    if (role !== 'student') {
      userData.password = password;
    }

    // Add role-specific fields
    if (role === 'teacher') {
      userData.employeeId = employeeId;
      if (dateOfHire) userData.dateOfHire = dateOfHire;
      if (subjectsTaught) userData.subjectsTaught = subjectsTaught;
      if (assignedClasses) userData.assignedClasses = assignedClasses;
      if (qualifications) userData.qualifications = qualifications;
      if (experienceYears) userData.experienceYears = experienceYears;
    }

    if (role === 'student') {
      userData.admissionNumber = admissionNumber;
      userData.dateOfBirth = dateOfBirth;
      userData.gender = gender;
      if (classId) userData.class = classId;
      if (parentId) userData.parent = parentId;
      if (medicalConditions) userData.medicalConditions = medicalConditions;
      if (bloodType) userData.bloodType = bloodType;
      if (allergies) userData.allergies = allergies;
      if (specialNeeds) userData.specialNeeds = specialNeeds;
      if (studentNotes) userData.studentNotes = studentNotes;
    }

    if (role === 'parent') {
      userData.homeAddress = homeAddress;
      if (children) userData.children = children;
      if (occupation) userData.occupation = occupation;
    }

    // Create new user
    user = new User(userData);

    // Save user (password will be hashed by the pre-save middleware if present)
    await user.save();

    // Generate token (only for roles that can login)
    let token = null;
    if (role !== 'student') {
      token = jwt.sign(
        { _id: user._id.toString(), role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );
    }

    res.json({ 
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        user_id_number: user.user_id_number,
        phone: user.phone,
        ...(role === 'teacher' && { employeeId: user.employeeId }),
        ...(role === 'student' && { admissionNumber: user.admissionNumber }),
        ...(role === 'parent' && { homeAddress: user.homeAddress })
      },
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!`
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove the completeProfile function as it's no longer needed
// export const completeProfile = async (req: Request, res: Response) => {
//   // This function is no longer needed with the centralized approach
// };

export const login = async (req: Request, res: Response) => {
  try {
    const { user_id_number, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ user_id_number });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Students cannot login
    if (user.role === 'student') {
      return res.status(400).json({ error: 'Students do not have login access' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

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
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
}; 
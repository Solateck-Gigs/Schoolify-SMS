import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: mongoose.Types.ObjectId;
        role: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export const generateToken = (user: IUser) => {
  return jwt.sign({ _id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '24h' });
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`Auth check for ${req.method} ${req.path}`);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      role: string;
    };
    
    console.log(`Auth success: User ${decoded._id} with role ${decoded.role}`);
    req.user = {
      _id: new mongoose.Types.ObjectId(decoded._id),
      role: decoded.role
    };
    next();
  } catch (error) {
    console.log('Auth failed: Invalid token', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('Role check - User role:', req.user.role, 'Allowed roles:', allowedRoles);
    if (!allowedRoles.includes(req.user.role) && !allowedRoles.includes('*')) {
      console.log('Role check failed - Access denied');
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    console.log('Role check passed');
    next();
  };
}; 
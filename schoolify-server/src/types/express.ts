import { Request } from 'express';
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

// Export the type for use in route handlers
export type AuthRequest = Request; 
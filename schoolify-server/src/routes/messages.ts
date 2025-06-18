import express, { Request, Response } from 'express';
import { Message, IMessage } from '../models/Message';
import { authenticateToken as auth } from '../middleware/auth';
import { HydratedDocument, Types } from 'mongoose';
import { IUser } from '../models/User';
import { AuthRequest } from '../types/express';

// Define a type for the populated user fields
interface PopulatedUser {
  _id: Types.ObjectId;
  userIdNumber: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PopulatedMessage extends Omit<IMessage, 'sender' | 'receiver'> {
  sender: PopulatedUser;
  receiver: PopulatedUser;
}

const router = express.Router();

// Type guard for authenticated user
function isAuthenticatedUser(user: any): user is IUser {
  return user && user._id instanceof Types.ObjectId && typeof user.role === 'string';
}

// Type guard for populated message
function isPopulatedMessage(message: any): message is PopulatedMessage {
  return (
    message &&
    message.sender &&
    message.receiver &&
    message.sender._id instanceof Types.ObjectId &&
    message.receiver._id instanceof Types.ObjectId &&
    typeof message.sender.userIdNumber === 'string' &&
    typeof message.sender.firstName === 'string' &&
    typeof message.sender.lastName === 'string' &&
    typeof message.sender.role === 'string' &&
    typeof message.receiver.userIdNumber === 'string' &&
    typeof message.receiver.firstName === 'string' &&
    typeof message.receiver.lastName === 'string' &&
    typeof message.receiver.role === 'string'
  );
}

// Send a new message
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { receiver_id, subject, content, type } = req.body;

    if (!receiver_id || !subject || !content) {
      return res.status(400).json({ error: 'Receiver, subject, and content are required' });
    }

    if (!Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ error: 'Invalid receiver ID format' });
    }

    const newMessage: HydratedDocument<IMessage> = new Message({
      sender: user._id,
      receiver: new Types.ObjectId(receiver_id),
      subject,
      content,
      type: type || 'general',
    });

    await newMessage.save();

    const populatedMessage = (await newMessage.populate([
      { path: 'sender', select: 'userIdNumber firstName lastName role' },
      { path: 'receiver', select: 'userIdNumber firstName lastName role' },
    ])) as PopulatedMessage;

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages sent by the authenticated user
router.get('/sent', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const messages = await Message.find({ sender: user._id })
      .populate([
        { path: 'sender', select: 'userIdNumber firstName lastName role' },
        { path: 'receiver', select: 'userIdNumber firstName lastName role' },
      ])
      .sort({ createdAt: -1 })
      .lean();

    const populatedMessages = messages as unknown as PopulatedMessage[];
    res.json(populatedMessages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages received by the authenticated user
router.get('/inbox', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const messages = await Message.find({ receiver: user._id })
      .populate([
        { path: 'sender', select: 'userIdNumber firstName lastName role' },
        { path: 'receiver', select: 'userIdNumber firstName lastName role' },
      ])
      .sort({ createdAt: -1 })
      .lean();

    const populatedMessages = messages as unknown as PopulatedMessage[];
    res.json(populatedMessages);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific message by ID (sender or receiver can view)
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }

    const message = await Message.findById(req.params.id)
      .populate([
        { path: 'sender', select: 'userIdNumber firstName lastName role' },
        { path: 'receiver', select: 'userIdNumber firstName lastName role' },
      ])
      .lean();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const populatedMessage = message as unknown as PopulatedMessage;
    if (!isPopulatedMessage(populatedMessage)) {
      throw new Error('Failed to populate message');
    }

    // Check if authenticated user is either sender or receiver, or admin
    if (
      populatedMessage.sender._id.equals(user._id) ||
      populatedMessage.receiver._id.equals(user._id) ||
      user.role === 'admin'
    ) {
      res.json(populatedMessage);
    } else {
      res.status(403).json({ error: 'Not authorized to view this message' });
    }
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read (receiver only)
router.put('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }

    const message = await Message.findById(req.params.id)
      .populate([
        { path: 'sender', select: 'userIdNumber firstName lastName role' },
        { path: 'receiver', select: 'userIdNumber firstName lastName role' },
      ])
      .lean();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const populatedMessage = message as unknown as PopulatedMessage;
    if (!isPopulatedMessage(populatedMessage)) {
      throw new Error('Failed to populate message');
    }

    // Only receiver or admin can mark as read
    if (populatedMessage.receiver._id.equals(user._id) || user.role === 'admin') {
      await Message.findByIdAndUpdate(req.params.id, { isRead: true });
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message (sender, receiver, or admin can delete)
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }

    const message = await Message.findById(req.params.id)
      .populate([
        { path: 'sender', select: 'userIdNumber firstName lastName role' },
        { path: 'receiver', select: 'userIdNumber firstName lastName role' },
      ])
      .lean();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const populatedMessage = message as unknown as PopulatedMessage;
    if (!isPopulatedMessage(populatedMessage)) {
      throw new Error('Failed to populate message');
    }

    // Only sender, receiver, or admin can delete
    if (
      populatedMessage.sender._id.equals(user._id) ||
      populatedMessage.receiver._id.equals(user._id) ||
      user.role === 'admin'
    ) {
      await Message.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Not authorized to delete this message' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
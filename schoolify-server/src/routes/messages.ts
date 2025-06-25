import express, { Request, Response } from 'express';
import { Message, IMessage } from '../models/Message';
import { User } from '../models/User';
import { authenticateToken as auth } from '../middleware/auth';
import { HydratedDocument, Types } from 'mongoose';
import { IUser } from '../models/User';
import { AuthRequest } from '../types/express';

// Define a type for the populated user fields
interface PopulatedUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  user_id_number: string;
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
    typeof message.sender.firstName === 'string' &&
    typeof message.sender.lastName === 'string' &&
    typeof message.sender.role === 'string' &&
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

    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    if (!Types.ObjectId.isValid(receiver_id)) {
      return res.status(400).json({ error: 'Invalid receiver ID format' });
    }

    const newMessage: HydratedDocument<IMessage> = new Message({
      sender: user._id,
      receiver: new Types.ObjectId(receiver_id),
      subject: subject || 'New Message',
      content,
      type: type || 'general',
    });

    await newMessage.save();

    const populatedMessage = (await newMessage.populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ])) as PopulatedMessage;

    // Emit socket event for new message
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Emit to the specific receiver
      io.to(receiver_id.toString()).emit('newMessage', populatedMessage);
      
      // If this is a suggestion/question, also emit a special event for admins
      if (type === 'suggestion' || type === 'question') {
        // Get all admin users
        const adminUsers = await User.find({ 
          role: { $in: ['admin', 'super_admin'] } 
        }).select('_id');
        
        // Emit to all admin users
        adminUsers.forEach((admin: { _id: Types.ObjectId }) => {
          io.to(admin._id.toString()).emit('newSuggestion', populatedMessage);
        });
      }
    }

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
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
      ])
      .sort({ created_at: -1 })
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
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
      ])
      .sort({ created_at: -1 })
      .lean();

    const populatedMessages = messages as unknown as PopulatedMessage[];
    res.json(populatedMessages);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get conversation history between current user and another user
router.get('/conversation/:userId', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const otherUserId = req.params.userId;
    if (!Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Get messages where current user is either sender or receiver
    // and the other user is the counterpart
    const messages = await Message.find({
      $or: [
        { sender: user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: user._id }
      ]
    })
      .populate([
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
      ])
      .sort({ created_at: 1 }) // Sort by creation time ascending
      .lean();

    const populatedMessages = messages as unknown as PopulatedMessage[];
    res.json(populatedMessages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a list of users the current user has conversations with
router.get('/contacts', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      console.log("User not authenticated for /contacts endpoint");
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log("User requesting message contacts:", user.role, user._id);

    // Find all messages where the current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: user._id },
        { receiver: user._id }
      ]
    })
      .populate([
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
      ])
      .sort({ created_at: -1 })
      .lean();

    console.log("Found messages for contacts:", messages.length);
    const populatedMessages = messages as unknown as PopulatedMessage[];

    // Extract unique contacts from messages
    const contactsMap = new Map<string, {
      _id: string;
      firstName: string;
      lastName: string;
      role: string;
      email: string;
      user_id_number: string;
      lastMessage: {
        content: string;
        timestamp: Date;
        unread: boolean;
      }
    }>();

    populatedMessages.forEach(message => {
      // Determine if the other user is the sender or receiver
      const isUserSender = message.sender._id.toString() === user._id.toString();
      const otherUser = isUserSender ? message.receiver : message.sender;
      const otherUserId = otherUser._id.toString();
      
      // Check if we've already processed this contact
      if (!contactsMap.has(otherUserId)) {
        contactsMap.set(otherUserId, {
          _id: otherUserId,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          role: otherUser.role,
          email: otherUser.email || '',
          user_id_number: otherUser.user_id_number || '',
          lastMessage: {
            content: message.content,
            timestamp: message.created_at,
            unread: !isUserSender && !message.read_by_receiver
          }
        });
      }
    });

    // Convert map to array and sort by last message timestamp
    const contacts = Array.from(contactsMap.values())
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

    console.log("Returning unique contacts:", contacts.length);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching message contacts:', error);
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
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
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

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() === user._id.toString()) {
      message.read_by_receiver = true;
      await message.save();
      
      const updatedMessage = await Message.findById(req.params.id)
        .populate([
          { path: 'sender', select: 'firstName lastName role email user_id_number' },
          { path: 'receiver', select: 'firstName lastName role email user_id_number' },
        ]);
      
      res.json(updatedMessage);
    } else {
      res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all messages from a specific sender as read
router.put('/read-all/:senderId', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const senderId = req.params.senderId;
    if (!Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: 'Invalid sender ID format' });
    }

    // Update all unread messages from this sender to this receiver
    const result = await Message.updateMany(
      { 
        sender: senderId, 
        receiver: user._id,
        read_by_receiver: false
      },
      { $set: { read_by_receiver: true } }
    );

    res.json({ 
      success: true, 
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
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
        { path: 'sender', select: 'firstName lastName role email user_id_number' },
        { path: 'receiver', select: 'firstName lastName role email user_id_number' },
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

// Mark a message as read
router.patch('/:messageId/read', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const messageId = req.params.messageId;
    if (!Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }

    // Find the message and check if the user is the receiver
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if the current user is the receiver of the message
    if (!message.receiver.equals(user._id)) {
      return res.status(403).json({ error: 'You can only mark messages sent to you as read' });
    }

    // Update the message as read
    message.read_by_receiver = true;
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all suggestions (for admins)
router.get('/suggestions', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin or super_admin
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find all suggestion/question type messages
    const suggestions = await Message.find({
      type: { $in: ['suggestion', 'question'] }
    })
    .populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ])
    .sort({ created_at: -1 });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new suggestion
router.post('/suggestions', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !isAuthenticatedUser(user)) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only parents can send suggestions
    if (user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can send suggestions' });
    }

    const { subject, content, type } = req.body;

    if (!content || !subject) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Get an admin user to receive the suggestion
    const admin = await User.findOne({ 
      role: { $in: ['admin', 'super_admin'] } 
    });

    if (!admin) {
      return res.status(500).json({ error: 'No admin found to receive suggestion' });
    }

    const newSuggestion: HydratedDocument<IMessage> = new Message({
      sender: user._id,
      receiver: admin._id,
      subject,
      content,
      type: type || 'suggestion',
    });

    await newSuggestion.save();

    const populatedSuggestion = (await newSuggestion.populate([
      { path: 'sender', select: 'firstName lastName role email user_id_number' },
      { path: 'receiver', select: 'firstName lastName role email user_id_number' },
    ])) as PopulatedMessage;

    // Emit socket event for new suggestion
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Get all admin users
      const adminUsers = await User.find({ 
        role: { $in: ['admin', 'super_admin'] } 
      }).select('_id');
      
      // Emit to all admin users
      adminUsers.forEach((admin: { _id: Types.ObjectId }) => {
        io.to(admin._id.toString()).emit('newSuggestion', populatedSuggestion);
      });
    }

    res.status(201).json(populatedSuggestion);
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Test endpoint for suggestions (no auth required for testing)
router.get('/test-suggestions', async (req: Request, res: Response) => {
  try {
    // Return mock data that doesn't rely on MongoDB IDs
    const mockData = [
      {
        _id: "mock-suggestion-1",
        content: "This is a test suggestion",
        type: "suggestion",
        subject: "Test Suggestion",
        created_at: new Date().toISOString(),
        read_by_receiver: false,
        sender: {
          _id: "mock-user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          user_id_number: "P001"
        },
        receiver: {
          _id: "mock-admin-1",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          user_id_number: "A001"
        }
      }
    ];
    
    res.json(mockData);
  } catch (error) {
    console.error('Error in test suggestions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 
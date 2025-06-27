import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import classRoutes from './routes/classes';
import teacherRoutes from './routes/teachers';
import parentRoutes from './routes/parents';
import feeRoutes from './routes/fees';
import attendanceRoutes from './routes/attendance';
import announcementRoutes from './routes/announcements';
import messageRoutes from './routes/messages';
import adminsRoutes from './routes/admins';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';
import statsRoutes from './routes/stats';
import marksRoutes from './routes/marks';
import timetableRoutes from './routes/timetable';
import { initializeUserWatcher } from './services/userWatcher';
import { Message } from './models/Message';
import { User } from './models/User';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS properly for credentials
app.use(cors({
  origin: ['http://localhost:5173', 'https://schoolify-sms.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://schoolify-sms.vercel.app'],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true, // Allow Engine.IO version 3 clients
  pingTimeout: 60000, // Increase ping timeout to handle slow connections
  transports: ['websocket', 'polling'] // Explicitly define transports with websocket first
});

// Store active user connections
interface UserConnection {
  userId: string;
  socketId: string;
  lastActive: Date;
}

const activeUsers: UserConnection[] = [];
const userLastSeen: Record<string, Date> = {};

// Make io instance available to the routes
app.set('io', io);

// Function to broadcast user status changes to relevant users
const broadcastUserStatus = (userId: string, isOnline: boolean) => {
  // Find all users who should be notified of this user's status change
  // based on messaging permissions
  const notifyUsers = activeUsers.filter(connection => {
    // Don't notify the user about their own status
    return connection.userId !== userId;
  });
  
  // Broadcast status change to all relevant active users
  notifyUsers.forEach(connection => {
    io.to(connection.socketId).emit('userStatusChange', {
      userId,
      isOnline,
      lastSeen: isOnline ? null : userLastSeen[userId]?.toISOString()
    });
  });
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User authentication and storing user connection
  socket.on('authenticate', async (userId: string) => {
    try {
      console.log(`User ${userId} attempting authentication with socket ${socket.id}`);
      
      // Validate the user ID
      if (!userId || typeof userId !== 'string') {
        console.log('Invalid user ID format');
        socket.emit('error', { message: 'Invalid authentication data' });
        return;
      }
      
      // Verify the user exists in database
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User ${userId} not found in database`);
        socket.emit('error', { message: 'User not found' });
        return;
      }
      
      console.log(`User ${userId} (${user.role}) authenticated with socket ${socket.id}`);
      
      // Remove any existing connections for this user
      const existingIndex = activeUsers.findIndex(user => user.userId === userId);
      if (existingIndex !== -1) {
        console.log(`Removing existing socket connection for user ${userId}`);
        activeUsers.splice(existingIndex, 1);
      }
      
      // Add new connection with current timestamp
      const now = new Date();
      activeUsers.push({ 
        userId, 
        socketId: socket.id,
        lastActive: now
      });
      
      // Update last seen time
      userLastSeen[userId] = now;
      
      console.log('Active users:', activeUsers.length);
      
      // Broadcast online status to relevant users
      broadcastUserStatus(userId, true);
      
      // Send online users list to the newly connected user
      const onlineUserIds = activeUsers.map(u => u.userId);
      socket.emit('onlineUsers', onlineUserIds);
      
      // Send last seen times for offline users
      const offlineUsersLastSeen: Record<string, string> = {};
      Object.keys(userLastSeen).forEach(uid => {
        if (!onlineUserIds.includes(uid)) {
          offlineUsersLastSeen[uid] = userLastSeen[uid].toISOString();
        }
      });
      socket.emit('offlineUsersLastSeen', offlineUsersLastSeen);
      
      // Confirm successful authentication
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
  
  // Heartbeat to keep track of active users
  socket.on('heartbeat', () => {
    const userConnection = activeUsers.find(user => user.socketId === socket.id);
    if (userConnection) {
      const now = new Date();
      userConnection.lastActive = now;
      userLastSeen[userConnection.userId] = now;
    }
  });
  
  // Handle new message
  socket.on('sendMessage', async (messageData: { receiver: string, content: string, subject: string }) => {
    try {
      console.log('Received message data:', messageData);
      const senderId = activeUsers.find(user => user.socketId === socket.id)?.userId;
      
      if (!senderId) {
        console.log('User not authenticated for socket:', socket.id);
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      // Check for recent duplicate messages (within last 5 seconds)
      const fiveSecondsAgo = new Date();
      fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5);
      
      const existingMessage = await Message.findOne({
        sender: senderId,
        receiver: messageData.receiver,
        content: messageData.content,
        createdAt: { $gte: fiveSecondsAgo }
      });
      
      let messageToSend;
      
      if (existingMessage) {
        console.log('Possible duplicate message detected, using existing message:', existingMessage._id);
        messageToSend = existingMessage;
      } else {
        // Create and save the new message
        const newMessage = new Message({
          sender: senderId,
          receiver: messageData.receiver,
          subject: messageData.subject || 'New Message',
          content: messageData.content,
          type: 'general',
          read_by_receiver: false,
        });
        
        await newMessage.save();
        console.log('Message saved:', newMessage._id);
        messageToSend = newMessage;
      }
      
      // Populate sender and receiver information
      const populatedMessage = await messageToSend.populate([
        { path: 'sender', select: 'firstName lastName role' },
        { path: 'receiver', select: 'firstName lastName role' }
      ]);
      
      // Emit to sender for confirmation
      socket.emit('messageSent', populatedMessage);
      console.log('Emitted messageSent to sender');
      
      // Find receiver's socket and emit message
      const receiverConnection = activeUsers.find(user => user.userId === messageData.receiver);
      if (receiverConnection) {
        console.log('Emitting newMessage to receiver:', receiverConnection.socketId);
        io.to(receiverConnection.socketId).emit('newMessage', populatedMessage);
      } else {
        console.log('Receiver not connected:', messageData.receiver);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle message read status
  socket.on('markAsRead', async (messageId: string) => {
    try {
      const userId = activeUsers.find(user => user.socketId === socket.id)?.userId;
      
      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
      
      // Check if user is the receiver
      if (message.receiver.toString() !== userId) {
        socket.emit('error', { message: 'Not authorized to mark this message as read' });
        return;
      }
      
      // Mark message as read
      message.read_by_receiver = true;
      await message.save();
      
      // Emit to sender if online
      const senderConnection = activeUsers.find(user => user.userId === message.sender.toString());
      if (senderConnection) {
        io.to(senderConnection.socketId).emit('messageRead', { messageId });
      }
      
      // Emit to receiver for confirmation
      socket.emit('messageMarkedAsRead', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });
  
  // Handle new suggestion
  socket.on('sendSuggestion', async (suggestionData: { content: string, subject: string, type: 'suggestion' | 'question' }) => {
    try {
      const senderId = activeUsers.find(user => user.socketId === socket.id)?.userId;
      
      if (!senderId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      // Get all admin users
      const adminUsers = await User.find({ 
        role: { $in: ['admin', 'super_admin'] } 
      }).select('_id');
      
      if (adminUsers.length === 0) {
        socket.emit('error', { message: 'No admin users found to receive suggestion' });
        return;
      }
      
      // Use the first admin as receiver
      const adminReceiverId = adminUsers[0]._id;
      
      // Create and save the new suggestion
      const newSuggestion = new Message({
        sender: senderId,
        receiver: adminReceiverId,
        subject: suggestionData.subject,
        content: suggestionData.content,
        type: suggestionData.type,
        read_by_receiver: false,
      });
      
      await newSuggestion.save();
      
      // Populate sender and receiver information
      const populatedSuggestion = await newSuggestion.populate([
        { path: 'sender', select: 'firstName lastName role' },
        { path: 'receiver', select: 'firstName lastName role' }
      ]);
      
      // Emit to sender for confirmation
      socket.emit('suggestionSent', populatedSuggestion);
      
      // Emit to all admin users
      adminUsers.forEach(admin => {
        const adminConnection = activeUsers.find(user => user.userId === admin._id.toString());
        if (adminConnection) {
          io.to(adminConnection.socketId).emit('newSuggestion', populatedSuggestion);
        }
      });
    } catch (error) {
      console.error('Error handling suggestion:', error);
      socket.emit('error', { message: 'Failed to send suggestion' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const index = activeUsers.findIndex(user => user.socketId === socket.id);
    
    if (index !== -1) {
      const userId = activeUsers[index].userId;
      
      // Update last seen time before removing from active users
      userLastSeen[userId] = new Date();
      
      // Remove from active users
      activeUsers.splice(index, 1);
      console.log('Active users after disconnect:', activeUsers.length);
      
      // Check if user has other active connections
      const hasOtherConnections = activeUsers.some(u => u.userId === userId);
      
      // If no other connections, broadcast offline status
      if (!hasOtherConnections) {
        broadcastUserStatus(userId, false);
      }
    }
  });
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api', require('./routes/api').default);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolify')
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize user watcher after successful MongoDB connection
    initializeUserWatcher()
      .then(() => console.log('User watcher initialized'))
      .catch(err => console.error('Error initializing user watcher:', err));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Schoolify Backend is running!' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;

// Use httpServer instead of app.listen
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
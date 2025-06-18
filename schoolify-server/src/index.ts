import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import classRoutes from './routes/classes';
import teacherRoutes from './routes/teachers';
import parentRoutes from './routes/parents';
import feeRoutes from './routes/fees';
import announcementRoutes from './routes/announcements';
import messageRoutes from './routes/messages';
import adminsRoutes from './routes/admins';
import adminRoutes from './routes/admin';
import userRoutes from './routes/users';
import statsRoutes from './routes/stats';
import { initializeUserWatcher } from './services/userWatcher';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
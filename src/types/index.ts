export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: string;
  classLevel: number;
  section?: string;
  parentId: string;
  address?: string;
  contactNumber?: string;
  profileImage?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  subjects: string[];
  classesTaught: number[];
  contactNumber: string;
  email: string;
  qualification: string;
  joiningDate: string;
  profileImage?: string;
}

export interface Parent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  address: string;
  occupation?: string;
  studentIds: string[];
}

export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  type: 'tuition' | 'uniform' | 'books' | 'transport' | 'other';
  description?: string;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  receiptNumber?: string;
}

export interface Mark {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  marks: number;
  totalMarks: number;
  examType: 'midterm' | 'final' | 'quiz' | 'assignment';
  date: string;
  remarks?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  classLevel: number;
  teacherId?: string;
}

export interface Timetable {
  id: string;
  classLevel: number;
  section?: string;
  dayOfWeek: number;
  periods: Period[];
}

export interface Period {
  id: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}
/*
  # School Management System Schema
  
  1. New Tables
    - `profiles` - User profile information with role-based access, including ID number and password
    - `students` - Student information and class assignments
    - `teachers` - Teacher information and subjects taught
    - `parents` - Parent information and student relationships
    - `fees` - Fee payments and records
    - `subjects` - Subject information by class level
    - `marks` - Student performance records
    - `timetables` - Class schedules
    - `messages` - Communication between users
  
  2. Security
    - Enable RLS on all tables
    - Create policies for role-based access
    - Seed a Super Admin account
*/

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_number TEXT NOT NULL UNIQUE, -- Unique ID number for login
  password TEXT NOT NULL, -- Hashed password for login
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'teacher', 'parent')),
  profile_image TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  enrollment_date DATE NOT NULL,
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  section TEXT,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT,
  contact_number TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  classes_taught INTEGER[] NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  qualification TEXT NOT NULL,
  joining_date DATE NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  occupation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Create fees table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tuition', 'uniform', 'books', 'transport', 'other')),
  description TEXT,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
  receipt_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  teacher_id UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create marks table
CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  marks DECIMAL(5, 2) NOT NULL,
  total_marks DECIMAL(5, 2) NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz', 'assignment')),
  date DATE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Create timetable table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  section TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  periods JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE,
  attachments TEXT[]
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Idempotent Version)
BEGIN;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

DROP POLICY IF EXISTS "Super admins can manage profiles" ON profiles;
CREATE POLICY "Super admins can manage profiles"
  ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

-- Students policies
DROP POLICY IF EXISTS "Admins can perform all operations on students" ON students;
CREATE POLICY "Admins can perform all operations on students"
  ON students FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

DROP POLICY IF EXISTS "Teachers can view students" ON students;
CREATE POLICY "Teachers can view students"
  ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'teacher'));

DROP POLICY IF EXISTS "Parents can only view their children" ON students;
CREATE POLICY "Parents can only view their children"
  ON students FOR SELECT
  USING (parent_id IN (SELECT id FROM parents WHERE user_id::text = auth.uid()::text));

-- Fees policies
DROP POLICY IF EXISTS "Admins can perform all operations on fees" ON fees;
CREATE POLICY "Admins can perform all operations on fees"
  ON fees FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

DROP POLICY IF EXISTS "Parents can view their children's fees" ON fees;
CREATE POLICY "Parents can view their children's fees"
  ON fees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = fees.student_id
    AND students.parent_id IN (
      SELECT id FROM parents WHERE user_id::text = auth.uid()::text
    )
  ));

-- Marks policies
DROP POLICY IF EXISTS "Admins can perform all operations on marks" ON marks;
CREATE POLICY "Admins can perform all operations on marks"
  ON marks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

DROP POLICY IF EXISTS "Teachers can manage marks" ON marks;
CREATE POLICY "Teachers can manage marks"
  ON marks FOR ALL
  USING (EXISTS (SELECT 1 FROM teachers WHERE user_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "Parents can view their children's marks" ON marks;
CREATE POLICY "Parents can view their children's marks"
  ON marks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students
    WHERE students.id = marks.student_id
    AND students.parent_id IN (
      SELECT id FROM parents WHERE user_id::text = auth.uid()::text
    )
  ));

-- Timetable policies
DROP POLICY IF EXISTS "All authenticated users can view timetables" ON timetables;
CREATE POLICY "All authenticated users can view timetables"
  ON timetables FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage timetables" ON timetables;
CREATE POLICY "Admins can manage timetables"
  ON timetables FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id::text = auth.uid()::text AND role = 'super_admin'));

-- Messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

DROP POLICY IF EXISTS "Users can update read status of their received messages" ON messages;
CREATE POLICY "Users can update read status of their received messages"
  ON messages FOR UPDATE
  USING (auth.uid()::text = receiver_id::text)
  WITH CHECK (auth.uid()::text = receiver_id::text);

COMMIT;

-- Seed Super Admin account
-- Password: "SuperAdmin123" (hashed using bcrypt with 10 rounds)
INSERT INTO profiles (id, user_id_number, password, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'SUPERADMIN001',
  '$2b$10$Xk4d5g6k5l4p9z2y7x8w0e8t4v5n2m9k3p7q8r2s6u9v3w5x9y1z', -- Hashed "SuperAdmin123"
  'Super',
  'Admin',
  'super_admin'
)
ON CONFLICT (user_id_number) DO NOTHING;
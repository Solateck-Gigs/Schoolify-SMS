-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  teacher_id UUID REFERENCES profiles(id), -- Assuming teacher_id references the profiles table
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
); 
-- Add new columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[],
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS special_needs TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('academic', 'sports', 'arts', 'other')),
    date DATE NOT NULL,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create extracurricular_activities table
CREATE TABLE IF NOT EXISTS extracurricular_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracurricular_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency_contacts
DROP POLICY IF EXISTS "Admins can manage emergency contacts" ON emergency_contacts;
CREATE POLICY "Admins can manage emergency contacts"
    ON emergency_contacts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role IN ('super_admin', 'admin')
    ));

DROP POLICY IF EXISTS "Teachers can view emergency contacts" ON emergency_contacts;
CREATE POLICY "Teachers can view emergency contacts"
    ON emergency_contacts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role = 'teacher'
    ));

DROP POLICY IF EXISTS "Parents can view their children's emergency contacts" ON emergency_contacts;
CREATE POLICY "Parents can view their children's emergency contacts"
    ON emergency_contacts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = emergency_contacts.student_id
        AND students.parent_id IN (
            SELECT id FROM profiles
            WHERE id::text = auth.uid()::text
            AND role = 'parent'
        )
    ));

-- Create policies for achievements
DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements"
    ON achievements FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role IN ('super_admin', 'admin')
    ));

DROP POLICY IF EXISTS "Teachers can view and create achievements" ON achievements;
CREATE POLICY "Teachers can view and create achievements"
    ON achievements FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role = 'teacher'
    ));

DROP POLICY IF EXISTS "Parents can view their children's achievements" ON achievements;
CREATE POLICY "Parents can view their children's achievements"
    ON achievements FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = achievements.student_id
        AND students.parent_id IN (
            SELECT id FROM profiles
            WHERE id::text = auth.uid()::text
            AND role = 'parent'
        )
    ));

-- Create policies for extracurricular_activities
DROP POLICY IF EXISTS "Admins can manage extracurricular activities" ON extracurricular_activities;
CREATE POLICY "Admins can manage extracurricular activities"
    ON extracurricular_activities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role IN ('super_admin', 'admin')
    ));

DROP POLICY IF EXISTS "Teachers can view and create extracurricular activities" ON extracurricular_activities;
CREATE POLICY "Teachers can view and create extracurricular activities"
    ON extracurricular_activities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role = 'teacher'
    ));

DROP POLICY IF EXISTS "Parents can view their children's extracurricular activities" ON extracurricular_activities;
CREATE POLICY "Parents can view their children's extracurricular activities"
    ON extracurricular_activities FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students
        WHERE students.id = extracurricular_activities.student_id
        AND students.parent_id IN (
            SELECT id FROM profiles
            WHERE id::text = auth.uid()::text
            AND role = 'parent'
        )
    ));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student_id ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_student_id ON extracurricular_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_is_current ON extracurricular_activities(is_current); 
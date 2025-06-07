-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Optional: Link to a specific class (foreign key removed for now)
    class_id UUID 
);

-- Enable RLS on the announcements table
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for announcements
-- Admins can manage all announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id::text = auth.uid()::text
        AND role IN ('super_admin', 'admin')
    ));

-- Teachers can view announcements (either general or for their classes)
DROP POLICY IF EXISTS "Teachers can view announcements" ON announcements;
CREATE POLICY "Teachers can view announcements"
    ON announcements FOR SELECT
    USING (
        class_id IS NULL -- Teachers can see general announcements
        -- Class-specific filtering for teachers will need adjustment if no classes table
        -- OR EXISTS ( ... join with classes ... )
    );

-- Parents can view announcements (either general or for their children's classes)
DROP POLICY IF EXISTS "Parents can view announcements" ON announcements;
CREATE POLICY "Parents can view announcements"
    ON announcements FOR SELECT
    USING (
        class_id IS NULL -- Parents can see general announcements
        -- Class-specific filtering for parents will need adjustment if no classes table
        -- OR EXISTS ( ... join with students and classes ... )
    );

-- Future: Policy for creating announcements (e.g., Admins, Teachers) 
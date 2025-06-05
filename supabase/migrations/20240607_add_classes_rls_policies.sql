-- Enable RLS on the classes table if not already
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies for classes table

-- Admins and Super Admins can view all classes
CREATE POLICY "Admins and Super Admins can view classes"
  ON classes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Admins and Super Admins can insert classes
CREATE POLICY "Admins and Super Admins can insert classes"
  ON classes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Admins and Super Admins can update classes
CREATE POLICY "Admins and Super Admins can update classes"
  ON classes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Admins and Super Admins can delete classes
CREATE POLICY "Admins and Super Admins can delete classes"
  ON classes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))); 
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classLevel: number;
  section: string;
  present: boolean;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const classOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Class ${i + 1}`
  }));

  const sectionOptions = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' }
  ];

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection, selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetch students based on role
      let query = supabase
        .from('students')
        .select('*')
        .eq('classLevel', selectedClass)
        .eq('section', selectedSection);

      // If teacher, only show students from their classes
      if (user?.role === 'teacher') {
        // Add teacher's class filter
        query = query.eq('teacherId', user.id);
      }
      // If parent, only show their children
      else if (user?.role === 'parent') {
        query = query.eq('parentId', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch attendance for the selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .in('studentId', data.map(s => s.id));

      if (attendanceError) throw attendanceError;

      // Merge student data with attendance data
      const studentsWithAttendance = data.map(student => ({
        ...student,
        present: attendanceData?.find(a => a.studentId === student.id)?.present ?? false
      }));

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (studentId: string, present: boolean) => {
    try {
      // Only admin and teachers can mark attendance
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        toast.error('You do not have permission to mark attendance');
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .upsert({
          studentId,
          date: selectedDate,
          present,
          markedBy: user.id
        });

      if (error) throw error;

      // Update local state
      setStudents(prev => 
        prev.map(student => 
          student.id === studentId ? { ...student, present } : student
        )
      );

      toast.success('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    }
  };

  const saveAttendance = async () => {
    try {
      // Only admin and teachers can save attendance
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        toast.error('You do not have permission to save attendance');
        return;
      }

      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        date: selectedDate,
        present: student.present,
        markedBy: user.id
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords);

      if (error) throw error;

      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSection(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button 
            variant="primary" 
            onClick={saveAttendance}
            disabled={loading}
          >
            Save Attendance
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Select
                label="Class"
                options={classOptions}
                value={selectedClass}
                onChange={handleClassChange}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select
                label="Section"
                options={sectionOptions}
                value={selectedSection}
                onChange={handleSectionChange}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Student Name</TableHeader>
                  <TableHeader>Roll Number</TableHeader>
                  {(user?.role === 'admin' || user?.role === 'teacher') && (
                    <TableHeader>Attendance</TableHeader>
                  )}
                  {user?.role === 'parent' && (
                    <TableHeader>Status</TableHeader>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.id}</TableCell>
                    {(user?.role === 'admin' || user?.role === 'teacher') ? (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={student.present ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, true)}
                          >
                            Present
                          </Button>
                          <Button
                            variant={!student.present ? "danger" : "outline"}
                            size="sm"
                            onClick={() => handleAttendanceChange(student.id, false)}
                          >
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          student.present 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.present ? 'Present' : 'Absent'}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
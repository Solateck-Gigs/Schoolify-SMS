import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, Printer, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';

export default function MarksPage() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    setIsTeacher(user?.role === 'teacher');
    
    // In a real app, this would be based on the teacher's assigned classes
    setSelectedClass('5');
    setSelectedSection('A');
    setSelectedSubject('mathematics');
    setSelectedExamType('midterm');
    
    // Fetch students from Supabase
    // This is a mock implementation
    const fetchStudents = async () => {
      // In a real app, this would be a Supabase query
      const mockStudents = [
        { 
          id: '1', 
          name: 'Emma Johnson', 
          marks: { 
            mathematics: { midterm: 85, final: 92 },
            science: { midterm: 78, final: 88 }
          }
        },
        { 
          id: '2', 
          name: 'Michael Chen', 
          marks: { 
            mathematics: { midterm: 92, final: 95 },
            science: { midterm: 90, final: 93 }
          }
        },
        { 
          id: '3', 
          name: 'Sofia Rodriguez', 
          marks: { 
            mathematics: { midterm: 76, final: 82 },
            science: { midterm: 85, final: 89 }
          }
        },
        { 
          id: '4', 
          name: 'William Patel', 
          marks: { 
            mathematics: { midterm: 88, final: 85 },
            science: { midterm: 79, final: 84 }
          }
        },
        { 
          id: '5', 
          name: 'Olivia Thompson', 
          marks: { 
            mathematics: { midterm: 95, final: 98 },
            science: { midterm: 92, final: 96 }
          }
        },
      ];
      
      setStudents(mockStudents);
    };
    
    fetchStudents();
  }, [user]);
  
  const classOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Class ${i + 1}`,
  }));
  
  const sectionOptions = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
  ];
  
  const subjectOptions = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'social_studies', label: 'Social Studies' },
  ];
  
  const examTypeOptions = [
    { value: 'midterm', label: 'Midterm Exam' },
    { value: 'final', label: 'Final Exam' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' },
  ];
  
  const handleMarkChange = (studentId: string, newMark: number) => {
    if (!isEditing || !isTeacher) return;
    
    setStudents(students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          marks: {
            ...student.marks,
            [selectedSubject]: {
              ...student.marks[selectedSubject],
              [selectedExamType]: newMark
            }
          }
        };
      }
      return student;
    }));
  };
  
  const handleSaveMarks = () => {
    // In a real app, this would save to Supabase
    setIsEditing(false);
    // Show success message
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Marks</h1>
          <p className="text-gray-600">Record and track student performance</p>
        </div>
        
        <div className="flex space-x-2">
          {isTeacher && !isEditing && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Marks
            </Button>
          )}
          
          {isTeacher && isEditing && (
            <Button
              variant="success"
              leftIcon={<Save size={16} />}
              onClick={handleSaveMarks}
            >
              Save Marks
            </Button>
          )}
          
          <Button
            variant="outline"
            leftIcon={<Printer size={16} />}
          >
            Print
          </Button>
          
          {isTeacher && (
            <Button
              variant="outline"
              leftIcon={<Send size={16} />}
            >
              Send to Parents
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/4">
              <Select
                label="Class"
                options={classOptions}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/4">
              <Select
                label="Section"
                options={sectionOptions}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/4">
              <Select
                label="Subject"
                options={subjectOptions}
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/4">
              <Select
                label="Exam Type"
                options={examTypeOptions}
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Student</TableHeader>
                <TableHeader>Marks</TableHeader>
                <TableHeader>Grade</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => {
                  const mark = student.marks[selectedSubject]?.[selectedExamType] || 0;
                  let grade = 'F';
                  if (mark >= 90) grade = 'A+';
                  else if (mark >= 80) grade = 'A';
                  else if (mark >= 70) grade = 'B';
                  else if (mark >= 60) grade = 'C';
                  else if (mark >= 50) grade = 'D';
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium text-gray-900">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        {isEditing && isTeacher ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={mark}
                            onChange={(e) => handleMarkChange(student.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                        ) : (
                          <span>{mark}/100</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                          grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          grade === 'C' ? 'bg-amber-100 text-amber-800' :
                          grade === 'D' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          mark >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mark >= 50 ? 'Pass' : 'Fail'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
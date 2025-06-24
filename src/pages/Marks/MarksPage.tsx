import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, Printer, Send, BookOpen, Eye, Edit, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../lib/api';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  user_id_number: string;
  admissionNumber: string;
  class?: {
    _id: string;
    name: string;
    gradeLevel: string;
    section: string;
  };
}

interface Mark {
  _id: string;
  student: Student;
  subject: string;
  score: number;
  totalScore: number;
  assessmentType: string;
  term: string;
  academicYear: string;
  remarks?: string;
  markedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export default function MarksPage() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableMarks, setEditableMarks] = useState<{[key: string]: {score: number, remarks: string}}>({});
  
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    fetchClasses();
    if (selectedClass && selectedSubject && selectedAssessmentType && selectedTerm) {
      fetchStudentsAndMarks();
    }
  }, [selectedClass, selectedSubject, selectedAssessmentType, selectedTerm]);

  const fetchClasses = async () => {
    try {
      let endpoint = '/classes';
      
      // Teachers only see their assigned classes
      if (isTeacher) {
        endpoint = '/teachers/classes';
      }
      
      const classesData = await apiFetch(endpoint) as Class[];
      setClasses(classesData);
      
      // Auto-select first class for teachers
      if (isTeacher && classesData.length > 0) {
        setSelectedClass(classesData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchStudentsAndMarks = async () => {
    try {
      setLoading(true);
      
      // Fetch students in the selected class
      const studentsData = await apiFetch(`/classes/${selectedClass}/students`) as Student[];
      setStudents(studentsData);
      
      // Fetch marks for the selected criteria
      const marksData = await apiFetch(`/marks?classId=${selectedClass}&subject=${selectedSubject}&assessmentType=${selectedAssessmentType}&term=${selectedTerm}`) as Mark[];
      setMarks(marksData);
      
      // Initialize editable marks
      const editableData: {[key: string]: {score: number, remarks: string}} = {};
      studentsData.forEach(student => {
        const existingMark = marksData.find(mark => mark.student._id === student._id);
        editableData[student._id] = {
          score: existingMark?.score || 0,
          remarks: existingMark?.remarks || ''
        };
      });
      setEditableMarks(editableData);
      
    } catch (error) {
      console.error('Error fetching students and marks:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const canEditMarks = () => {
    if (isSuperAdmin) return false; // Super admin can only view
    if (!isTeacher) return false; // Only teachers can edit
    
    // Check if the teacher is assigned to the selected class
    const selectedClassData = classes.find(cls => cls._id === selectedClass);
    return selectedClassData?.teacher?._id === user?._id;
  };

  const handleMarkChange = (studentId: string, field: 'score' | 'remarks', value: string | number) => {
    if (!canEditMarks() || !isEditing) return;
    
    setEditableMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveMarks = async () => {
    try {
      if (!canEditMarks()) {
        toast.error('You do not have permission to edit marks for this class');
        return;
      }

      const marksToSave = Object.entries(editableMarks).map(([studentId, markData]) => ({
        studentId,
        classId: selectedClass,
        subject: selectedSubject,
        score: markData.score,
        totalScore: 100,
        assessmentType: selectedAssessmentType,
        term: selectedTerm,
        remarks: markData.remarks
      }));

      await apiFetch('/marks/bulk', {
        method: 'POST',
        body: JSON.stringify({ marks: marksToSave })
      });

      toast.success('Marks saved successfully');
      setIsEditing(false);
      fetchStudentsAndMarks(); // Refresh data
    } catch (error) {
      console.error('Error saving marks:', error);
      toast.error('Failed to save marks');
    }
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 50) return { grade: 'D', color: 'bg-orange-100 text-orange-800' };
    return { grade: 'F', color: 'bg-red-100 text-red-800' };
  };

  const getPassStatus = (score: number) => {
    return score >= 50 
      ? { status: 'Pass', color: 'bg-green-100 text-green-800' }
      : { status: 'Fail', color: 'bg-red-100 text-red-800' };
  };

  const subjectOptions = [
    { value: '', label: 'Select Subject' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'english', label: 'English' },
    { value: 'science', label: 'Science' },
    { value: 'social_studies', label: 'Social Studies' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
  ];

  const assessmentTypeOptions = [
    { value: '', label: 'Select Assessment Type' },
    { value: 'exam', label: 'Exam' },
    { value: 'test', label: 'Test' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'project', label: 'Project' },
  ];

  const termOptions = [
    { value: '', label: 'Select Term' },
    { value: 'Term 1', label: 'Term 1' },
    { value: 'Term 2', label: 'Term 2' },
    { value: 'Term 3', label: 'Term 3' },
    { value: 'Annual', label: 'Annual' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            {isSuperAdmin ? 'Academic Results Overview' : isTeacher ? 'Student Marks Management' : 'Student Marks'}
          </h1>
          <p className="text-gray-600">
            {isSuperAdmin 
              ? 'View academic performance across all classes (Read-only)' 
              : isTeacher 
                ? 'Record and manage marks for your assigned students'
                : 'Track and manage student academic performance'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          {canEditMarks() && !isEditing && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Marks
            </Button>
          )}
          
          {canEditMarks() && isEditing && (
            <Button
              variant="primary"
              onClick={handleSaveMarks}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Marks
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          {isTeacher && (
            <Button
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Parents
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Eye className="h-5 w-5" />
              <p className="font-medium">Read-Only Mode</p>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              As Super Admin, you can view all academic results but cannot edit marks. Only assigned teachers can edit marks for their students.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Class"
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map(cls => ({
                  value: cls._id,
                  label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
                }))
              ]}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              fullWidth
            />
            
            <Select
              label="Subject"
              options={subjectOptions}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              fullWidth
            />
            
            <Select
              label="Assessment Type"
              options={assessmentTypeOptions}
              value={selectedAssessmentType}
              onChange={(e) => setSelectedAssessmentType(e.target.value)}
              fullWidth
            />
            
            <Select
              label="Term"
              options={termOptions}
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              fullWidth
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading students and marks...</p>
            </div>
          ) : !selectedClass || !selectedSubject || !selectedAssessmentType || !selectedTerm ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Please select class, subject, assessment type, and term to view marks</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No students found in this class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Student Info</TableHeader>
                    <TableHeader>Student ID</TableHeader>
                    <TableHeader>Marks</TableHeader>
                    <TableHeader>Grade</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Remarks</TableHeader>
                    <TableHeader>Marked By</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const existingMark = marks.find(mark => mark.student._id === student._id);
                    const editableMark = editableMarks[student._id];
                    const score = isEditing ? editableMark?.score || 0 : existingMark?.score || 0;
                    const remarks = isEditing ? editableMark?.remarks || '' : existingMark?.remarks || '';
                    const gradeInfo = getGrade(score);
                    const statusInfo = getPassStatus(score);
                    
                    return (
                      <TableRow key={student._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.user_id_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isEditing && canEditMarks() ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editableMark?.score || 0}
                              onChange={(e) => handleMarkChange(student._id, 'score', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          ) : (
                            <span className="font-medium">{score}/100</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${gradeInfo.color}`}>
                            {gradeInfo.grade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isEditing && canEditMarks() ? (
                            <Input
                              type="text"
                              placeholder="Add remarks..."
                              value={editableMark?.remarks || ''}
                              onChange={(e) => handleMarkChange(student._id, 'remarks', e.target.value)}
                              className="w-32"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{remarks || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {existingMark?.markedBy ? (
                            <div>
                              <p className="text-sm font-medium">{existingMark.markedBy.firstName} {existingMark.markedBy.lastName}</p>
                              <p className="text-xs text-gray-500">{new Date(existingMark.createdAt).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not marked</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Statistics */}
      {students.length > 0 && marks.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-800">Class Statistics</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {marks.length > 0 ? (marks.reduce((sum, mark) => sum + mark.score, 0) / marks.length).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-gray-600">Class Average</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {marks.filter(mark => mark.score >= 50).length}
                </p>
                <p className="text-sm text-gray-600">Students Passed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {marks.filter(mark => mark.score < 50).length}
                </p>
                <p className="text-sm text-gray-600">Students Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
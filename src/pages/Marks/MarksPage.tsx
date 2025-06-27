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
  const [isAdding, setIsAdding] = useState(false);
  const [editableMarks, setEditableMarks] = useState<{[key: string]: {score: number, remarks: string}}>({});
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  
  useEffect(() => {
    fetchClasses();
  }, []);
  
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass();
    }
  }, [selectedClass]);
  
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedAssessmentType && selectedTerm) {
      fetchMarks();
    }
  }, [selectedClass, selectedSubject, selectedAssessmentType, selectedTerm]);

  const fetchClasses = async () => {
    try {
      let endpoint = 'classes';
      
      // Teachers only see their assigned classes
      if (isTeacher) {
        endpoint = 'teachers/classes';
      }
      
      const classesData = await apiFetch(endpoint) as Class[];
      setClasses(classesData);
      
      // Only set the first class if no class is currently selected
      if (isTeacher && classesData.length > 0 && !selectedClass) {
        setSelectedClass(classesData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchStudentsForClass = async () => {
    try {
      setLoading(true);
      
      // Validate required parameters
      if (!selectedClass) {
        console.error('Missing required parameter: classId');
        toast.error('Please select a class');
        setLoading(false);
        return;
      }
      
      console.log('Fetching students for class:', selectedClass);
      // Fetch students in the selected class - use the correct endpoint
      const response = await apiFetch(`classes/students/${selectedClass}`) as { students: Student[], classInfo: any };
      
      // Check if the response has the expected structure
      const studentsData = response?.students || [];
      setStudents(studentsData);
      console.log('Students fetched:', studentsData.length);
      
      // Initialize with empty marks
      const emptyEditableMarks: {[key: string]: {score: number, remarks: string}} = {};
      studentsData.forEach(student => {
        emptyEditableMarks[student._id] = {
          score: 0,
          remarks: ''
        };
      });
      setEditableMarks(emptyEditableMarks);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    try {
      setLoading(true);
      
      // Validate required parameters for marks
      if (!selectedSubject || !selectedAssessmentType || !selectedTerm) {
        console.error('Missing required parameters for marks');
        setMarks([]);
        setLoading(false);
        return;
      }
      
      // Validate assessment type
      const validAssessmentTypes = ['test', 'exam'];
      if (!validAssessmentTypes.includes(selectedAssessmentType.toLowerCase())) {
        console.error('Invalid assessment type:', selectedAssessmentType);
        toast.error('Invalid assessment type. Must be "test" or "exam".');
        setLoading(false);
        return;
      }
      
      console.log('Fetching marks with params:', {
        classId: selectedClass,
        subject: selectedSubject.toLowerCase(),
        assessmentType: selectedAssessmentType.toLowerCase(),
        term: selectedTerm
      });
      
      // Fetch marks for the selected criteria - update to match the server's API endpoint
      const marksData = await apiFetch(`marks?classId=${selectedClass}&subject=${selectedSubject.toLowerCase()}&assessmentType=${selectedAssessmentType.toLowerCase()}&term=${encodeURIComponent(selectedTerm)}`) as Mark[];
      setMarks(marksData);
      console.log('Marks fetched:', marksData.length);
      
      // Initialize editable marks
      const editableData: {[key: string]: {score: number, remarks: string}} = {};
      students.forEach((student: Student) => {
        const existingMark = marksData.find(mark => mark.student._id === student._id);
        editableData[student._id] = {
          score: existingMark?.score || 0,
          remarks: existingMark?.remarks || ''
        };
      });
      setEditableMarks(editableData);
      
    } catch (error) {
      console.error('Error fetching marks:', error);
      toast.error('Failed to fetch marks');
      
      // If API fails, initialize with empty marks
      if (students.length > 0) {
        const emptyEditableMarks: {[key: string]: {score: number, remarks: string}} = {};
        students.forEach(student => {
          emptyEditableMarks[student._id] = {
            score: 0,
            remarks: ''
          };
        });
        setEditableMarks(emptyEditableMarks);
      }
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

  const saveMarks = async () => {
    try {
      if (!canEditMarks()) {
        toast.error('You do not have permission to edit marks for this class');
        return;
      }

      // Validate marks - ensure all scores are between 0 and 100
      const invalidMarks = Object.entries(editableMarks).filter(
        ([_, markData]) => markData.score < 0 || markData.score > 100
      );
      
      if (invalidMarks.length > 0) {
        toast.error('Some marks are invalid. Scores must be between 0 and 100.');
        return;
      }
      
      setIsSaving(true);
      
      // Prepare marks data for bulk saving
      const marksToSave = Object.entries(editableMarks).map(([studentId, data]) => ({
        studentId,
        classId: selectedClass,
        subject: selectedSubject,
        score: data.score,
        totalScore: 100, // Assuming total score is always 100
        assessmentType: selectedAssessmentType,
        term: selectedTerm,
        academicYear: new Date().getFullYear().toString(),
        remarks: data.remarks
      }));
      
      // Use the bulk marks endpoint
      await apiFetch('marks/bulk', {
        method: 'POST',
        body: JSON.stringify({ marks: marksToSave }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Marks saved successfully');
      setIsEditing(false);
      setIsAdding(false);
      
      // Refresh marks data
      fetchMarks();
    } catch (error) {
      console.error('Error saving marks:', error);
      toast.error('Failed to save marks');
    } finally {
      setIsSaving(false);
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
    { value: 'citizenship', label: 'Citizenship' },
    { value: 'french', label: 'French' },
    { value: 'bdt', label: 'B.D.T' },
    { value: 'ict', label: 'I.C.T' },
    { value: 'rme', label: 'R.M.E' },
    { value: 'ga', label: 'Ga' },
  ];

  const assessmentTypeOptions = [
    { value: '', label: 'Select Assessment Type' },
    { value: 'exam', label: 'Exam' },
    { value: 'test', label: 'Test' }
  ];

  const termOptions = [
    { value: '', label: 'Select Term' },
    { value: 'Term 1', label: 'Term 1' },
    { value: 'Term 2', label: 'Term 2' },
    { value: 'Term 3', label: 'Term 3' },
    { value: 'Annual', label: 'Annual' },
  ];

  const sendMarksToParents = async () => {
    if (!selectedClass || !selectedSubject || !selectedAssessmentType || !selectedTerm) {
      toast.error('Please select class, subject, assessment type, and term first');
      return;
    }
    
    if (marks.length === 0) {
      toast.error('No marks available to send');
      return;
    }
    
    // Check if the teacher is authorized to send marks for this class
    if (!canEditMarks()) {
      toast.error('You are not authorized to send marks for this class');
      return;
    }
    
    try {
      setIsSending(true);
      
      await apiFetch('marks/send-to-parents', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          subject: selectedSubject,
          assessmentType: selectedAssessmentType,
          term: selectedTerm
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Marks sent to parents successfully');
    } catch (error) {
      console.error('Error sending marks to parents:', error);
      toast.error('Failed to send marks to parents');
    } finally {
      setIsSending(false);
    }
  };

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
          {canEditMarks() && !isEditing && !isAdding && (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  setIsEditing(true);
                  setIsAdding(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Marks
              </Button>
              
              <Button
                variant="primary"
                onClick={() => {
                  setIsAdding(true);
                  setIsEditing(false);
                  // Initialize all marks to 0 for adding new marks
                  const newEditableMarks: {[key: string]: {score: number, remarks: string}} = {};
                  students.forEach(student => {
                    newEditableMarks[student._id] = {
                      score: 0,
                      remarks: ''
                    };
                  });
                  setEditableMarks(newEditableMarks);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Marks
              </Button>
            </>
          )}
          
          {canEditMarks() && (isEditing || isAdding) && (
            <Button
              variant="primary"
              onClick={saveMarks}
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
              onClick={sendMarksToParents}
              disabled={isSending || marks.length === 0}
              className={marks.length > 0 ? "border-indigo-300 text-indigo-600 hover:bg-indigo-50" : ""}
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 mr-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Parents
                </>
              )}
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
                  label: `${cls.name} - Section ${cls.section}`
                }))
              ]}
              value={selectedClass}
              onChange={(e) => {
                const newClassId = e.target.value;
                console.log('Class changed to:', newClassId);
                setSelectedClass(newClassId);
              }}
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
                    const score = (isEditing || isAdding) ? editableMark?.score || 0 : existingMark?.score || 0;
                    const remarks = (isEditing || isAdding) ? editableMark?.remarks || '' : existingMark?.remarks || '';
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
                          {(isEditing || isAdding) && canEditMarks() ? (
                            <Input
                              type="text"
                              value={editableMark?.score || 0}
                              onChange={(e) => {
                                // Allow only numbers and validate range
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                const numValue = value === '' ? 0 : parseInt(value);
                                if (numValue <= 100) {
                                  handleMarkChange(student._id, 'score', numValue);
                                }
                              }}
                              className="w-20 text-center"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={score}
                              readOnly
                              className="w-20 text-center bg-gray-50"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={gradeInfo.grade}
                            readOnly
                            className={`w-16 text-center ${gradeInfo.color}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={statusInfo.status}
                            readOnly
                            className={`w-20 text-center ${statusInfo.color}`}
                          />
                        </TableCell>
                        <TableCell>
                          {(isEditing || isAdding) && canEditMarks() ? (
                            <Input
                              type="text"
                              value={editableMark?.remarks || ''}
                              onChange={(e) => handleMarkChange(student._id, 'remarks', e.target.value)}
                              className="w-full"
                              placeholder="Add remarks..."
                            />
                          ) : (
                            <Input
                              type="text"
                              value={remarks || ''}
                              readOnly
                              className="w-full bg-gray-50"
                              placeholder="-"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {existingMark?.markedBy ? 
                            `${existingMark.markedBy.firstName || ''} ${existingMark.markedBy.lastName || ''}` 
                            : ''}
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
    </div>
  );
}
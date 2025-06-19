import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import StudentProfile from '../../components/StudentProfile';
import AddStudentForm from '../../components/AddStudentForm';
import { toast } from 'react-hot-toast';
import EditStudentForm from '../../components/EditStudentForm';
import api from '../../services/api';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'student';
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  class?: string;
  parent?: string;
  medicalConditions?: string[];
  bloodType?: string;
  allergies?: string[];
  specialNeeds?: string;
  studentNotes?: string;
  profileImage?: string;
  createdAt: string;
}

interface ExtracurricularActivity {
  id: string;
  name: string;
  role?: string;
  start_date: string;
  end_date?: string;
}

export default function StudentsPage() {
  const { user, getCurrentUserId } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  useEffect(() => {
    setIsAdmin(user?.role === 'admin' || user?.role === 'super_admin');
    setIsSuperAdmin(user?.role === 'super_admin');
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }
      
      // Fetch students from backend - now returns User documents with role: 'student'
      const { data } = await api.get('/students');
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrade = (marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const filteredStudents = students.filter(student => {
    const matchesClass = filterClass ? student.class === filterClass : true;
    const matchesSearch = searchTerm 
      ? `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesClass && matchesSearch;
  });

  const classOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Class ${i + 1}`,
  }));

  const handleAddStudentSuccess = () => {
    setShowAddStudentForm(false);
    fetchStudents();
  };

  const handleCancelAddStudent = () => {
    setShowAddStudentForm(false);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setSelectedStudent(null);
    setShowAddStudentForm(false);
  };

  const handleEditStudentSuccess = () => {
    setStudentToEdit(null);
    fetchStudents();
  };

  const handleCancelEditStudent = () => {
    setStudentToEdit(null);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // Use backend API to delete student
        await api.delete(`/students/${studentId}`);
        toast.success('Student deleted successfully!');
        fetchStudents(); // Refresh the list
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student.');
      }
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    // The filtering is now handled locally in filteredStudents
  };

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedStudent(null)}
          >
            Back to Students List
          </Button>
          {isSuperAdmin && (
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDeleteStudent(selectedStudent._id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Student
            </Button>
          )}
        </div>
        <StudentProfile student={selectedStudent as any} />
      </div>
    );
  }

  if (showAddStudentForm) {
    return (
      <AddStudentForm 
        onSuccess={handleAddStudentSuccess}
        onCancel={handleCancelAddStudent}
      />
    );
  }

  if (studentToEdit) {
    return (
      <EditStudentForm 
        student={studentToEdit as any}
        onSuccess={handleEditStudentSuccess}
        onCancel={handleCancelEditStudent}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
        {isAdmin && (
          <Button
            onClick={() => setShowAddStudentForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search students by name or admission number..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classOptions
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone || 'N/A'}</TableCell>
                        <TableCell>{student.class || 'Not assigned'}</TableCell>
                        <TableCell className="capitalize">{student.gender}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              View
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteStudent(student._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
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
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  enrollmentDate: string;
  classLevel: number;
  section?: string;
  parentId: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  profileImage?: string;
  bloodType?: string;
  medicalConditions?: string[];
  emergencyContacts?: {
    name: string;
    relationship: string;
    phone: string;
  }[];
  achievements?: {
    id: string;
    title: string;
    date: string;
    description: string;
    category: 'academic' | 'sports' | 'arts' | 'other';
  }[];
  extracurricularActivities?: {
    id: string;
    name: string;
    role?: string;
    startDate: string;
    endDate?: string;
  }[];
  attendance?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  academicPerformance?: {
    subject: string;
    grade: string;
    score: number;
    term: string;
    year: string;
  }[];
}

interface ExtracurricularActivity {
  id: string;
  name: string;
  role?: string;
  start_date: string;
  end_date?: string;
}

export default function StudentsPage() {
  const { user } = useAuthStore();
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
      // Fetch students from backend
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
    const matchesClass = filterClass ? student.classLevel.toString() === filterClass : true;
    const matchesSearch = searchTerm 
      ? `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
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
        // Use backend API to delete student and related records
        await api.delete(`/students/${studentId}`);
        toast.success('Student deleted successfully!');
        fetchStudents(); // Refresh the list
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student.');
      }
    }
  };

  const handleSearch = async (searchTerm: string) => {
    try {
      const { data } = await api.get('/students', {
        params: { search: searchTerm }
      });
      setStudents(data);
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error('Failed to search students');
    }
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
              variant="danger"
              leftIcon={<Trash2 size={16} />}
              onClick={() => handleDeleteStudent(selectedStudent.id)}
            >
              Delete Student
            </Button>
          )}
        </div>
        <StudentProfile student={selectedStudent} isParent={user?.role === 'parent'} />
      </div>
    );
  }

  if (showAddStudentForm) {
    return <AddStudentForm onSuccess={handleAddStudentSuccess} onCancel={handleCancelAddStudent} />;
  }

  if (studentToEdit) {
    return <EditStudentForm student={studentToEdit} onSuccess={handleEditStudentSuccess} onCancel={handleCancelEditStudent} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-600">Manage and view student information</p>
        </div>
        
        {isAdmin && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => setShowAddStudentForm(true)}
          >
            Add New Student
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                fullWidth
                className="pl-10"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'All Classes' }, ...classOptions]}
                value={filterClass}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterClass(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={`${student.firstName} ${student.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          {student.firstName} {student.lastName}
                          <div className="text-xs text-gray-500">
                            {student.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      Class {student.classLevel}
                      {student.section ? ` - Section ${student.section}` : ''}
                    </TableCell>
                    <TableCell>
                      {student.contactNumber || 'No contact'}
                    </TableCell>
                    <TableCell>
                      {student.attendance && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          student.attendance.present / student.attendance.total >= 0.9
                            ? 'bg-green-100 text-green-800'
                            : student.attendance.present / student.attendance.total >= 0.75
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round((student.attendance.present / student.attendance.total) * 100)}% Attendance
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Edit size={16} />}
                              onClick={() => handleEditStudent(student)}
                              title="Edit Student"
                           >
                             Edit
                           </Button>
                           <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<Trash2 size={16} />}
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Delete Student"
                           >
                             Delete
                           </Button>
                         </div>
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
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Search, Plus, Edit, Eye, Trash2, Users, GraduationCap, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../lib/api';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  user_id_number: string;
  admissionNumber: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  class?: {
    _id: string;
    name: string;
    gradeLevel: string;
    section: string;
  };
  parent?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  isActive: boolean;
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

export default function StudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    user_id_number: '',
    admissionNumber: '',
    dateOfBirth: '',
    parentName: '',
    parentPhone: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    classId: '',
    password: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let endpoint = '/students';
      
      // Teachers only see their assigned students
      if (isTeacher) {
        endpoint = '/teacher/students';
      }
      
      const studentsData = await apiFetch(endpoint) as Student[];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classesData = await apiFetch('/classes') as Class[];
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const handleAddStudent = async () => {
    try {
      if (!isAdmin) {
        toast.error('You do not have permission to add students');
        return;
      }

      await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      toast.success('Student added successfully');
      setShowAddModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleEditStudent = async () => {
    try {
      if (!isAdmin) {
        toast.error('You do not have permission to edit students');
        return;
      }

      if (!selectedStudent) return;

      await apiFetch(`/students/${selectedStudent._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      toast.success('Student updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      if (!isAdmin) {
        toast.error('You do not have permission to delete students');
        return;
      }

      if (!confirm('Are you sure you want to delete this student?')) return;

      await apiFetch(`/students/${studentId}`, {
        method: 'DELETE',
      });

      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      user_id_number: '',
      admissionNumber: '',
      dateOfBirth: '',
      parentName: '',
      parentPhone: '',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
      classId: '',
      password: ''
    });
    setSelectedStudent(null);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      user_id_number: student.user_id_number,
      admissionNumber: student.admissionNumber,
      dateOfBirth: student.dateOfBirth || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
      bloodGroup: student.bloodGroup || '',
      emergencyContact: student.emergencyContact || '',
      classId: student.class?._id || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm
      ? `${student.firstName} ${student.lastName} ${student.user_id_number} ${student.admissionNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesClass = filterClass ? student.class?._id === filterClass : true;
    const matchesStatus = filterStatus ? (filterStatus === 'active' ? student.isActive : !student.isActive) : true;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6" />
            {isTeacher ? 'My Students' : 'Students Management'}
          </h1>
          <p className="text-gray-600">
            {isTeacher 
              ? 'View and manage your assigned students' 
              : 'Manage student information and enrollment'
            }
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map(cls => ({
                    value: cls._id,
                    label: `${cls.name} - Grade ${cls.gradeLevel}`
                  }))
                ]}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Student Info</TableHeader>
                    <TableHeader>Student ID</TableHeader>
                    <TableHeader>Admission No.</TableHeader>
                    <TableHeader>Class</TableHeader>
                    <TableHeader>Parent</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="text-right">Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {student.user_id_number}
                        </span>
                      </TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>
                        {student.class ? (
                          <div>
                            <p className="font-medium">{student.class.name}</p>
                            <p className="text-sm text-gray-500">Grade {student.class.gradeLevel} {student.class.section}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.parent ? (
                          <div>
                            <p className="font-medium">{student.parent.firstName} {student.parent.lastName}</p>
                            <p className="text-sm text-gray-500">{student.parent.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No parent linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.isActive)}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteStudent(student._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student account with their personal information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Student ID"
                value={formData.user_id_number}
                onChange={(e) => setFormData({...formData, user_id_number: e.target.value})}
              />
              <Input
                placeholder="Admission Number"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
              />
            </div>
            
            <Input
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Parent/Guardian Name"
                value={formData.parentName}
                onChange={(e) => setFormData({...formData, parentName: e.target.value})}
              />
              <Input
                type="tel"
                placeholder="Parent Phone"
                value={formData.parentPhone}
                onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
              />
            </div>
            
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                options={[
                  { value: '', label: 'Select Blood Group' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' }
                ]}
                value={formData.bloodGroup}
                onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                fullWidth
              />
              <Input
                type="tel"
                placeholder="Emergency Contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                options={[
                  { value: '', label: 'Select Class' },
                  ...classes.map(cls => ({
                    value: cls._id,
                    label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
                  }))
                ]}
                value={formData.classId}
                onChange={(e) => setFormData({...formData, classId: e.target.value})}
                fullWidth
              />
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddStudent}>
              Add Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Student ID"
                value={formData.user_id_number}
                onChange={(e) => setFormData({...formData, user_id_number: e.target.value})}
              />
              <Input
                placeholder="Admission Number"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
              />
            </div>
            
            <Input
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Parent/Guardian Name"
                value={formData.parentName}
                onChange={(e) => setFormData({...formData, parentName: e.target.value})}
              />
              <Input
                type="tel"
                placeholder="Parent Phone"
                value={formData.parentPhone}
                onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
              />
            </div>
            
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                options={[
                  { value: '', label: 'Select Blood Group' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' }
                ]}
                value={formData.bloodGroup}
                onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                fullWidth
              />
              <Input
                type="tel"
                placeholder="Emergency Contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
              />
            </div>
            
            <Select
              options={[
                { value: '', label: 'Select Class' },
                ...classes.map(cls => ({
                  value: cls._id,
                  label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
                }))
              ]}
              value={formData.classId}
              onChange={(e) => setFormData({...formData, classId: e.target.value})}
              fullWidth
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditStudent}>
              Update Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Student Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View complete student information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                    <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                    <p><span className="font-medium">Student ID:</span> {selectedStudent.user_id_number}</p>
                    <p><span className="font-medium">Admission No:</span> {selectedStudent.admissionNumber}</p>
                    {selectedStudent.dateOfBirth && (
                      <p><span className="font-medium">Date of Birth:</span> {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                    )}
                    {selectedStudent.bloodGroup && (
                      <p><span className="font-medium">Blood Group:</span> {selectedStudent.bloodGroup}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Academic Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedStudent.class ? (
                      <>
                        <p><span className="font-medium">Class:</span> {selectedStudent.class.name}</p>
                        <p><span className="font-medium">Grade:</span> {selectedStudent.class.gradeLevel}</p>
                        <p><span className="font-medium">Section:</span> {selectedStudent.class.section}</p>
                      </>
                    ) : (
                      <p className="text-gray-400">No class assigned</p>
                    )}
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedStudent.isActive)}`}>
                        {selectedStudent.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p><span className="font-medium">Joined:</span> {new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    {selectedStudent.parentName && (
                      <p><span className="font-medium">Parent/Guardian:</span> {selectedStudent.parentName}</p>
                    )}
                    {selectedStudent.parentPhone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="font-medium">Parent Phone:</span> {selectedStudent.parentPhone}
                      </p>
                    )}
                    {selectedStudent.emergencyContact && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="font-medium">Emergency:</span> {selectedStudent.emergencyContact}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedStudent.address && (
                      <p><span className="font-medium">Address:</span> {selectedStudent.address}</p>
                    )}
                    {selectedStudent.parent && (
                      <div>
                        <p><span className="font-medium">Linked Parent:</span></p>
                        <p className="text-gray-600">{selectedStudent.parent.firstName} {selectedStudent.parent.lastName}</p>
                        <p className="text-gray-600">{selectedStudent.parent.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
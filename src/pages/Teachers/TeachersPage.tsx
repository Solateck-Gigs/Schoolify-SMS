import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../../components/ui/Dialog';
import Label from '../../components/ui/Label';
import { useAuthStore } from '../../lib/store';

// Updated interface for centralized User model
interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  user_id_number: string;
  role: string;
  employeeId?: string;
  dateOfHire?: string;
  subjectsTaught?: string[];
  assignedClasses?: any[];
  qualifications?: string[];
  experienceYears?: number;
}

export default function TeachersPage() {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Form data for adding new teacher
  const [newTeacherData, setNewTeacherData] = useState({
    user_id_number: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    employeeId: '',
    dateOfHire: '',
    subjectsTaught: '',
    qualifications: '',
    experienceYears: 0
  });

  // Form data for editing teacher
  const [editTeacherData, setEditTeacherData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    dateOfHire: '',
    subjectsTaught: '',
    qualifications: '',
    experienceYears: 0
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teachers');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeacherData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditTeacherData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTeacher = async () => {
    try {
      setLoading(true);
      
      // Prepare payload for centralized registration
      const payload = {
        user_id_number: newTeacherData.user_id_number,
        role: 'teacher',
        firstName: newTeacherData.firstName,
        lastName: newTeacherData.lastName,
        email: newTeacherData.email,
        phone: newTeacherData.phone,
        password: newTeacherData.password,
        employeeId: newTeacherData.employeeId,
        dateOfHire: newTeacherData.dateOfHire || undefined,
        subjectsTaught: newTeacherData.subjectsTaught ? newTeacherData.subjectsTaught.split(',').map(s => s.trim()) : [],
        qualifications: newTeacherData.qualifications ? newTeacherData.qualifications.split(',').map(q => q.trim()) : [],
        experienceYears: newTeacherData.experienceYears || 0
      };

      await api.post('/auth/register', payload);
      
      toast.success('Teacher added successfully!');
      setIsAddModalOpen(false);
      setNewTeacherData({
        user_id_number: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        employeeId: '',
        dateOfHire: '',
        subjectsTaught: '',
        qualifications: '',
        experienceYears: 0
      });
      
      fetchTeachers();
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to add teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      setLoading(true);
      
      const payload = {
        firstName: editTeacherData.firstName,
        lastName: editTeacherData.lastName,
        email: editTeacherData.email,
        phone: editTeacherData.phone,
        employeeId: editTeacherData.employeeId,
        dateOfHire: editTeacherData.dateOfHire || undefined,
        subjectsTaught: editTeacherData.subjectsTaught ? editTeacherData.subjectsTaught.split(',').map(s => s.trim()) : [],
        qualifications: editTeacherData.qualifications ? editTeacherData.qualifications.split(',').map(q => q.trim()) : [],
        experienceYears: editTeacherData.experienceYears || 0
      };

      await api.put(`/teachers/${selectedTeacher._id}`, payload);
      
      toast.success('Teacher updated successfully!');
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await api.delete(`/teachers/${teacherId}`);
      toast.success('Teacher deleted successfully!');
      fetchTeachers();
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.error || 'Failed to delete teacher');
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacherData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || '',
      employeeId: teacher.employeeId || '',
      dateOfHire: teacher.dateOfHire ? teacher.dateOfHire.split('T')[0] : '',
      subjectsTaught: teacher.subjectsTaught?.join(', ') || '',
      qualifications: teacher.qualifications?.join(', ') || '',
      experienceYears: teacher.experienceYears || 0
    });
    setIsEditModalOpen(true);
  };

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Teachers Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
            <DialogHeader className="bg-white border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-800">Add New Teacher</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Fill out the form below to add a new teacher to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6 bg-white">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="user_id_number">User ID Number</Label>
                    <Input
                      id="user_id_number"
                      name="user_id_number"
                      value={newTeacherData.user_id_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                      placeholder="e.g., TEACH001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={newTeacherData.password}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                      placeholder="Enter secure password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={newTeacherData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={newTeacherData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newTeacherData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={newTeacherData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      value={newTeacherData.employeeId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                      placeholder="e.g., EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfHire">Date of Hire</Label>
                    <Input
                      id="dateOfHire"
                      name="dateOfHire"
                      type="date"
                      value={newTeacherData.dateOfHire}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input
                      id="qualifications"
                      name="qualifications"
                      value={newTeacherData.qualifications}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="e.g., B.Ed, M.Sc Mathematics (comma separated)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experienceYears">Experience (Years)</Label>
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      value={newTeacherData.experienceYears}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Years of experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subjectsTaught">Subjects Taught</Label>
                    <Input
                      id="subjectsTaught"
                      name="subjectsTaught"
                      placeholder="Enter subjects separated by commas"
                      value={newTeacherData.subjectsTaught}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-end space-x-4 p-6 pt-0 bg-white border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
              <Button onClick={handleAddTeacher} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                {loading ? 'Adding...' : 'Add Teacher'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Contact Number</TableHeader>
              <TableHeader>Employee ID</TableHeader>
              <TableHeader>Qualifications</TableHeader>
              <TableHeader>Subjects</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading teachers...</TableCell>
              </TableRow>
            ) : filteredTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No teachers found.</TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map(teacher => (
                <TableRow key={teacher._id}>
                  <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone || 'N/A'}</TableCell>
                  <TableCell>{teacher.employeeId || 'N/A'}</TableCell>
                  <TableCell>{teacher.qualifications?.join(', ') || 'N/A'}</TableCell>
                  <TableCell>{teacher.subjectsTaught?.join(', ') || 'N/A'}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(teacher)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
          <DialogHeader className="bg-white border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">Edit Teacher</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Update the teacher's information using the form below.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6 p-6 bg-white">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_firstName">First Name</Label>
                    <Input
                      id="edit_firstName"
                      name="firstName"
                      value={editTeacherData.firstName}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_lastName">Last Name</Label>
                    <Input
                      id="edit_lastName"
                      name="lastName"
                      value={editTeacherData.lastName}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      name="email"
                      type="email"
                      value={editTeacherData.email}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_phone">Contact Number</Label>
                    <Input
                      id="edit_phone"
                      name="phone"
                      value={editTeacherData.phone}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_employeeId">Employee ID</Label>
                    <Input
                      id="edit_employeeId"
                      name="employeeId"
                      value={editTeacherData.employeeId}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="e.g., EMP001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_dateOfHire">Date of Hire</Label>
                    <Input
                      id="edit_dateOfHire"
                      name="dateOfHire"
                      type="date"
                      value={editTeacherData.dateOfHire}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_qualifications">Qualifications</Label>
                    <Input
                      id="edit_qualifications"
                      name="qualifications"
                      value={editTeacherData.qualifications}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="e.g., B.Ed, M.Sc Mathematics (comma separated)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_experienceYears">Experience (Years)</Label>
                    <Input
                      id="edit_experienceYears"
                      name="experienceYears"
                      type="number"
                      value={editTeacherData.experienceYears}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Years of experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_subjectsTaught">Subjects Taught</Label>
                    <Input
                      id="edit_subjectsTaught"
                      name="subjectsTaught"
                      placeholder="Enter subjects separated by commas"
                      value={editTeacherData.subjectsTaught}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-end space-x-4 p-6 pt-0 bg-white border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            <Button onClick={handleUpdateTeacher} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
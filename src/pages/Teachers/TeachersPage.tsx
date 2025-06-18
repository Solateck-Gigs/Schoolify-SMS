import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/Dialog';
import Label from '../../components/ui/Label';
import { useAuthStore } from '../../lib/store';

interface UserBasicInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Teacher {
  _id: string;
  user: UserBasicInfo;
  employeeId?: string;
  dateOfHire?: string;
  subjectsTaught: string[];
  assignedClasses: any[];
  qualifications: string[];
  experienceYears?: number;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_number: '',
    qualification: '',
    joining_date: '',
    subjects: '',
    classes_taught: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editTeacherData, setEditTeacherData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    contact_number: '',
    qualification: '',
    joining_date: '',
    subjects: '',
    classes_taught: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teachers');
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeacherData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditTeacherData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTeacher = async () => {
    setLoading(true);
    try {
      const newTeacher = {
        firstName: newTeacherData.first_name,
        lastName: newTeacherData.last_name,
        email: newTeacherData.email,
        phone: newTeacherData.contact_number,
        password: 'defaultPassword123', // You might want to generate this or ask for it
        employeeId: `EMP${Date.now()}`, // Generate a unique employee ID
        dateOfHire: newTeacherData.joining_date,
        subjectsTaught: newTeacherData.subjects.split(',').map(s => s.trim()).filter(s => s),
        qualifications: newTeacherData.qualification.split(',').map(q => q.trim()).filter(q => q),
        experienceYears: 0
      };
      const response = await api.post('/teachers', newTeacher);
      setTeachers(prev => [...prev, response.data]);
      toast.success('Teacher added successfully');
      setIsAddModalOpen(false);
      setNewTeacherData({
        first_name: '',
        last_name: '',
        email: '',
        contact_number: '',
        qualification: '',
        joining_date: '',
        subjects: '',
        classes_taught: '',
      });
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast.error('Failed to add teacher');
    }
    setLoading(false);
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const updatedTeacher = {
        firstName: selectedTeacher.user.firstName,
        lastName: selectedTeacher.user.lastName,
        email: selectedTeacher.user.email,
        phone: selectedTeacher.user.phone,
        subjectsTaught: selectedTeacher.subjectsTaught,
        qualifications: selectedTeacher.qualifications,
        experienceYears: selectedTeacher.experienceYears
      };

      const response = await api.put(`/teachers/profile/${selectedTeacher._id}`, updatedTeacher);
      
      // Update the teachers list with the updated teacher data
      setTeachers(teachers.map(teacher => 
        teacher._id === selectedTeacher._id ? response.data : teacher
      ));
      
      setSelectedTeacher(null);
      setIsEditModalOpen(false);
      toast.success('Teacher updated successfully!');
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher.');
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api.delete(`/teachers/profile/${teacherId}`);
        setTeachers(teachers.filter(teacher => teacher._id !== teacherId));
        toast.success('Teacher deleted successfully!');
      } catch (error) {
        console.error('Error deleting teacher:', error);
        toast.error('Failed to delete teacher.');
      }
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacherData({
      first_name: teacher.user.firstName,
      last_name: teacher.user.lastName,
      email: teacher.user.email || '',
      contact_number: teacher.user.phone || '',
      qualification: (teacher.qualifications || []).join(','),
      joining_date: teacher.dateOfHire || '',
      subjects: (teacher.subjectsTaught || []).join(','),
      classes_taught: teacher.assignedClasses?.length.toString() || '0',
    });
    setIsEditModalOpen(true);
  };

  const filteredTeachers = teachers.filter(teacher => {
    if (!teacher.user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (teacher.user.firstName || '').toLowerCase().includes(searchLower) ||
      (teacher.user.lastName || '').toLowerCase().includes(searchLower) ||
      (teacher.user.email || '').toLowerCase().includes(searchLower) ||
      (teacher.user.phone || '').toLowerCase().includes(searchLower) ||
      (teacher.qualifications || []).some(q => q.toLowerCase().includes(searchLower)) ||
      (teacher.subjectsTaught || []).some(subject => subject.toLowerCase().includes(searchLower))
    );
  });

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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={newTeacherData.first_name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={newTeacherData.last_name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newTeacherData.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact_number" className="text-right">
                  Contact Number
                </Label>
                <Input
                  id="contact_number"
                  name="contact_number"
                  value={newTeacherData.contact_number}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qualification" className="text-right">
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  name="qualification"
                  value={newTeacherData.qualification}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joining_date" className="text-right">
                  Joining Date
                </Label>
                <Input
                  id="joining_date"
                  name="joining_date"
                  type="date"
                  value={newTeacherData.joining_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subjects" className="text-right">
                  Subjects
                </Label>
                <Input
                  id="subjects"
                  name="subjects"
                  placeholder="Comma separated"
                  value={newTeacherData.subjects}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classes_taught" className="text-right">
                  Classes Taught
                </Label>
                <Input
                  id="classes_taught"
                  name="classes_taught"
                  placeholder="Comma separated numbers"
                  value={newTeacherData.classes_taught}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTeacher} disabled={loading}>Add Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes Taught</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
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
                  <TableCell>{teacher.user.firstName} {teacher.user.lastName}</TableCell>
                  <TableCell>{teacher.user.email}</TableCell>
                  <TableCell>{teacher.user.phone}</TableCell>
                  <TableCell>{(teacher.qualifications || []).join(', ')}</TableCell>
                  <TableCell>{(teacher.subjectsTaught || []).join(', ')}</TableCell>
                  <TableCell>{teacher.assignedClasses?.length || 0} classes</TableCell>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_first_name" className="text-right">
                  First Name
                </Label>
                <Input
                  id="edit_first_name"
                  name="first_name"
                  value={editTeacherData.first_name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_last_name" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="edit_last_name"
                  name="last_name"
                  value={editTeacherData.last_name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={editTeacherData.email}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_contact_number" className="text-right">
                  Contact Number
                </Label>
                <Input
                  id="edit_contact_number"
                  name="contact_number"
                  value={editTeacherData.contact_number}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_qualification" className="text-right">
                  Qualification
                </Label>
                <Input
                  id="edit_qualification"
                  name="qualification"
                  value={editTeacherData.qualification}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_joining_date" className="text-right">
                  Joining Date
                </Label>
                <Input
                  id="edit_joining_date"
                  name="joining_date"
                  type="date"
                  value={editTeacherData.joining_date}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_subjects" className="text-right">
                  Subjects
                </Label>
                <Input
                  id="edit_subjects"
                  name="subjects"
                  placeholder="Comma separated"
                  value={editTeacherData.subjects}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_classes_taught" className="text-right">
                  Classes Taught
                </Label>
                <Input
                  id="edit_classes_taught"
                  name="classes_taught"
                  placeholder="Comma separated numbers"
                  value={editTeacherData.classes_taught}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateTeacher} disabled={loading}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
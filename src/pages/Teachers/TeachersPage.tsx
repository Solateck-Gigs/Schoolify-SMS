import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  qualification: string;
  joining_date: string;
  subjects: string[];
  classes_taught: number[];
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
    const { data, error } = await supabase
      .from('teachers')
      .select('*');

    if (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers');
    } else {
      setTeachers(data || []);
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
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        first_name: newTeacherData.first_name,
        last_name: newTeacherData.last_name,
        email: newTeacherData.email,
        contact_number: newTeacherData.contact_number,
        qualification: newTeacherData.qualification,
        joining_date: newTeacherData.joining_date,
        subjects: newTeacherData.subjects.split(',').map(s => s.trim()),
        classes_taught: newTeacherData.classes_taught.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)),
      })
      .select('*');

    if (error) {
      console.error('Error adding teacher:', error);
      toast.error('Failed to add teacher');
    } else if (data && data.length > 0) {
      setTeachers(prev => [...prev, data[0]]);
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
    } else {
        toast.error('Failed to add teacher');
    }
    setLoading(false);
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .update({
        first_name: editTeacherData.first_name,
        last_name: editTeacherData.last_name,
        email: editTeacherData.email,
        contact_number: editTeacherData.contact_number,
        qualification: editTeacherData.qualification,
        joining_date: editTeacherData.joining_date,
        subjects: editTeacherData.subjects.split(',').map(s => s.trim()),
        classes_taught: editTeacherData.classes_taught.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)),
      })
      .eq('id', selectedTeacher.id)
      .select('*');

    if (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher');
    } else if (data && data.length > 0) {
      setTeachers(prev => prev.map(teacher => teacher.id === data[0].id ? data[0] : teacher));
      toast.success('Teacher updated successfully');
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
    } else {
        toast.error('Failed to update teacher');
    }
    setLoading(false);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      setLoading(true);
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (error) {
        console.error('Error deleting teacher:', error);
        toast.error('Failed to delete teacher');
      } else {
        setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
        toast.success('Teacher deleted successfully');
      }
      setLoading(false);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacherData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      contact_number: teacher.contact_number,
      qualification: teacher.qualification,
      joining_date: teacher.joining_date,
      subjects: teacher.subjects.join(','),
      classes_taught: teacher.classes_taught.join(','),
    });
    setIsEditModalOpen(true);
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.contact_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
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
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.first_name} {teacher.last_name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.contact_number}</TableCell>
                  <TableCell>{teacher.qualification}</TableCell>
                  <TableCell>{teacher.subjects.join(', ')}</TableCell>
                  <TableCell>{teacher.classes_taught.join(', ')}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(teacher)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
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
            <Button onClick={handleEditTeacher} disabled={loading}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
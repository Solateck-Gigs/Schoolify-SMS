import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../../components/ui/Dialog';
import Label from '../../components/ui/Label';
import { useAuthStore } from '../../lib/store';

interface Class {
  id: number;
  name: string;
  section: string;
  academicYear: string;
  capacity: number;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  gradeId: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    name: '',
    section: '',
    academicYear: '',
    capacity: '',
    teacher: '',
    gradeId: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editClassData, setEditClassData] = useState({
    name: '',
    section: '',
    academicYear: '',
    capacity: '',
    teacher: '',
    gradeId: '',
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const classesData = await apiFetch('/classes') as Class[];
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
      setClasses([]);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClassData(prev => ({ ...prev, [name]: value }));
  };

   const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditClassData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    setLoading(true);
    try {
      const newClass = {
        name: newClassData.name,
        section: newClassData.section,
        academicYear: newClassData.academicYear,
        capacity: parseInt(newClassData.capacity),
        teacher: newClassData.teacher || null,
        gradeId: parseInt(newClassData.gradeId),
      };
      const classObj = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify(newClass),
      }) as Class;
      setClasses(prev => [...prev, classObj]);
      toast.success('Class added successfully');
      setIsAddModalOpen(false);
      setNewClassData({
        name: '',
        section: '',
        academicYear: '',
        capacity: '',
        teacher: '',
        gradeId: '',
      });
    } catch (error) {
      console.error('Error adding class:', error);
        toast.error('Failed to add class');
    }
    setLoading(false);
  };

   const handleEditClass = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const updatedClass = {
        name: editClassData.name,
        section: editClassData.section,
        academicYear: editClassData.academicYear,
        capacity: parseInt(editClassData.capacity),
        teacher: editClassData.teacher || null,
        gradeId: parseInt(editClassData.gradeId),
      };
      const classObj = await apiFetch(`/classes/${selectedClass.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClass),
      }) as Class;
      setClasses(prev => prev.map(cls => cls.id === classObj.id ? classObj : cls));
      toast.success('Class updated successfully');
      setIsEditModalOpen(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
        toast.error('Failed to update class');
    }
    setLoading(false);
  };

  const handleDeleteClass = async (classId: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      setLoading(true);
      try {
        await apiFetch(`/classes/${classId}`, { method: 'DELETE' });
        setClasses(prev => prev.filter(cls => cls.id !== classId));
        toast.success('Class deleted successfully');
      } catch (error) {
        console.error('Error deleting class:', error);
        toast.error('Failed to delete class');
      }
      setLoading(false);
    }
  };

  const openEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setEditClassData({
      name: cls.name,
      section: cls.section,
      academicYear: cls.academicYear,
      capacity: cls.capacity.toString(),
      teacher: cls.teacher ? (typeof cls.teacher === 'string' ? cls.teacher : cls.teacher._id) : '',
      gradeId: cls.gradeId.toString(),
    });
    setIsEditModalOpen(true);
  };


  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    // Add filtering by supervisor name or grade if joined later
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-white border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New Class</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new class by filling in the details below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-white p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Class Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newClassData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Mathematics A"
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="section" className="text-sm font-medium text-gray-700">Section</Label>
                  <Input
                    id="section"
                    name="section"
                    value={newClassData.section}
                    onChange={handleInputChange}
                    placeholder="e.g., A"
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="academicYear" className="text-sm font-medium text-gray-700">Academic Year</Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    value={newClassData.academicYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023-2024"
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={newClassData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 30"
                    required
                    min="1"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="teacher" className="text-sm font-medium text-gray-700">Teacher (Optional)</Label>
                  <Input
                    id="teacher"
                    name="teacher"
                    value={newClassData.teacher}
                    onChange={handleInputChange}
                    placeholder="e.g., TEACH001"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gradeId" className="text-sm font-medium text-gray-700">Grade Level</Label>
                  <Input
                    id="gradeId"
                    name="gradeId"
                    type="number"
                    value={newClassData.gradeId}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    required
                    min="1"
                    max="12"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="bg-white border-t border-gray-200 pt-4">
              <Button
                onClick={() => setIsAddModalOpen(false)}
                variant="outline"
                className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddClass}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
              >
                {loading ? 'Adding...' : 'Add Class'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Class Name</TableHeader>
              <TableHeader>Capacity</TableHeader>
              <TableHeader>Teacher</TableHeader>
              <TableHeader>Grade Level</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading classes...</TableCell>
              </TableRow>
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No classes found.</TableCell>
              </TableRow>
            ) : (
              filteredClasses.map(cls => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.capacity}</TableCell>
                  <TableCell>{cls.teacher ? (typeof cls.teacher === 'string' ? cls.teacher : `${cls.teacher.firstName} ${cls.teacher.lastName}`) : 'N/A'}</TableCell>
                  <TableCell>Grade {cls.gradeId}</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(cls)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-white border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Class</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the class information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white p-6 space-y-6">
            {selectedClass && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name" className="text-sm font-medium text-gray-700">Class Name</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    value={editClassData.name}
                    onChange={handleEditInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_section" className="text-sm font-medium text-gray-700">Section</Label>
                  <Input
                    id="edit_section"
                    name="section"
                    value={editClassData.section}
                    onChange={handleEditInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_academicYear" className="text-sm font-medium text-gray-700">Academic Year</Label>
                  <Input
                    id="edit_academicYear"
                    name="academicYear"
                    value={editClassData.academicYear}
                    onChange={handleEditInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_capacity" className="text-sm font-medium text-gray-700">Capacity</Label>
                  <Input
                    id="edit_capacity"
                    name="capacity"
                    type="number"
                    value={editClassData.capacity}
                    onChange={handleEditInputChange}
                    required
                    min="1"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_teacher" className="text-sm font-medium text-gray-700">Teacher (Optional)</Label>
                  <Input
                    id="edit_teacher"
                    name="teacher"
                    value={editClassData.teacher}
                    onChange={handleEditInputChange}
                    placeholder="e.g., TEACH001"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_gradeId" className="text-sm font-medium text-gray-700">Grade Level</Label>
                  <Input
                    id="edit_gradeId"
                    name="gradeId"
                    type="number"
                    value={editClassData.gradeId}
                    onChange={handleEditInputChange}
                    required
                    min="1"
                    max="12"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="bg-white border-t border-gray-200 pt-4">
            <Button
              onClick={() => setIsEditModalOpen(false)}
              variant="outline"
              className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditClass}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Search, PlusCircle, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

interface Class {
  id: number;
  name: string;
  capacity: number;
  supervisorId?: string;
  gradeId: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    name: '',
    capacity: '',
    supervisorId: '',
    gradeId: '',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editClassData, setEditClassData] = useState({
    name: '',
    capacity: '',
    supervisorId: '',
    gradeId: '',
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const classesData = await apiFetch('/classes');
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
        capacity: parseInt(newClassData.capacity),
        supervisorId: newClassData.supervisorId || null,
        gradeId: parseInt(newClassData.gradeId),
      };
      const classObj = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify(newClass),
      });
      setClasses(prev => [...prev, classObj]);
      toast.success('Class added successfully');
      setIsAddModalOpen(false);
      setNewClassData({
        name: '',
        capacity: '',
        supervisorId: '',
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
        capacity: parseInt(editClassData.capacity),
        supervisorId: editClassData.supervisorId || null,
        gradeId: parseInt(editClassData.gradeId),
      };
      const classObj = await apiFetch(`/classes/${selectedClass.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedClass),
      });
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
      capacity: cls.capacity.toString(),
      supervisorId: cls.supervisorId || '',
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
      <h1 className="text-2xl font-bold mb-6">Classes Management</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Class Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newClassData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={newClassData.capacity}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gradeId" className="text-right">
                  Grade Level
                </Label>
                <Input
                  id="gradeId"
                  name="gradeId"
                  type="number"
                  value={newClassData.gradeId}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supervisorId" className="text-right">
                  Supervisor ID (Optional)
                </Label>
                <Input
                  id="supervisorId"
                  name="supervisorId"
                  value={newClassData.supervisorId}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddClass} disabled={loading}>Add Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Grade Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
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
                  <TableCell>{cls.supervisorId || 'N/A'}</TableCell> {/* Display supervisor name if joined */}
                  <TableCell>{cls.gradeId}</TableCell> {/* Display grade name if joined */}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name" className="text-right">
                  Class Name
                </Label>
                <Input
                  id="edit_name"
                  name="name"
                  value={editClassData.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="edit_capacity"
                  name="capacity"
                  type="number"
                  value={editClassData.capacity}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_gradeId" className="text-right">
                  Grade Level
                </Label>
                <Input
                  id="edit_gradeId"
                  name="gradeId"
                  type="number"
                  value={editClassData.gradeId}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_supervisorId" className="text-right">
                  Supervisor ID (Optional)
                </Label>
                <Input
                  id="edit_supervisorId"
                  name="supervisorId"
                  value={editClassData.supervisorId}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleEditClass} disabled={loading}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
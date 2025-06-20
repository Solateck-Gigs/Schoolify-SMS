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

interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  user_id_number: string;
  role: string;
  homeAddress?: string;
  occupation?: string;
  children?: string[];
}

export default function ParentsPage() {
  const { user } = useAuthStore();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  const [newParentData, setNewParentData] = useState({
    user_id_number: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    homeAddress: '',
    occupation: '',
    children: ''
  });

  const [editParentData, setEditParentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    homeAddress: '',
    occupation: '',
    children: ''
  });

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/parents');
      setParents(response.data);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to fetch parents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewParentData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditParentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddParent = async () => {
    try {
      setLoading(true);
      
      const payload = {
        user_id_number: newParentData.user_id_number,
        role: 'parent',
        firstName: newParentData.firstName,
        lastName: newParentData.lastName,
        email: newParentData.email,
        phone: newParentData.phone,
        password: newParentData.password,
        homeAddress: newParentData.homeAddress,
        occupation: newParentData.occupation || undefined,
        children: newParentData.children ? newParentData.children.split(',').map(c => c.trim()).filter(c => c) : undefined
      };

      await api.post('/auth/register', payload);
      
      toast.success('Parent added successfully!');
      setIsAddModalOpen(false);
      setNewParentData({
        user_id_number: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        homeAddress: '',
        occupation: '',
        children: ''
      });
      
      fetchParents();
    } catch (error: any) {
      console.error('Error adding parent:', error);
      toast.error(error.response?.data?.error || 'Failed to add parent');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParent = async () => {
    if (!selectedParent) return;

    try {
      setLoading(true);
      
      const payload = {
        firstName: editParentData.firstName,
        lastName: editParentData.lastName,
        email: editParentData.email,
        phone: editParentData.phone,
        homeAddress: editParentData.homeAddress,
        occupation: editParentData.occupation || undefined,
        children: editParentData.children ? editParentData.children.split(',').map(c => c.trim()) : []
      };

      await api.put(`/parents/${selectedParent._id}`, payload);
      
      toast.success('Parent updated successfully!');
      setIsEditModalOpen(false);
      setSelectedParent(null);
      fetchParents();
    } catch (error: any) {
      console.error('Error updating parent:', error);
      toast.error(error.response?.data?.error || 'Failed to update parent');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm('Are you sure you want to delete this parent?')) return;

    try {
      await api.delete(`/parents/${parentId}`);
      toast.success('Parent deleted successfully!');
      fetchParents();
    } catch (error: any) {
      console.error('Error deleting parent:', error);
      toast.error(error.response?.data?.error || 'Failed to delete parent');
    }
  };

  const openEditModal = (parent: Parent) => {
    setSelectedParent(parent);
    setEditParentData({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      phone: parent.phone || '',
      homeAddress: parent.homeAddress || '',
      occupation: parent.occupation || '',
      children: parent.children?.join(', ') || ''
    });
    setIsEditModalOpen(true);
  };

  const filteredParents = parents.filter(parent =>
    `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.user_id_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Parents Management</h1>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-white border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900">Add New Parent</DialogTitle>
              <DialogDescription className="text-gray-600">
                Enter the parent's information below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-white p-6 space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_id_number" className="text-sm font-medium text-gray-700">User ID Number</Label>
                  <Input
                    id="user_id_number"
                    name="user_id_number"
                    value={newParentData.user_id_number}
                    onChange={handleInputChange}
                    placeholder="e.g., PAR001"
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={newParentData.firstName}
                    onChange={handleInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={newParentData.lastName}
                    onChange={handleInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newParentData.email}
                    onChange={handleInputChange}
                    required
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Contact Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newParentData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newParentData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    placeholder="Enter secure password"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  Parent Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="homeAddress" className="text-sm font-medium text-gray-700">Home Address</Label>
                  <textarea
                    id="homeAddress"
                    name="homeAddress"
                    value={newParentData.homeAddress}
                    onChange={handleInputChange}
                    rows={3}
                    required
                    placeholder="Full home address"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="occupation" className="text-sm font-medium text-gray-700">Occupation</Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    value={newParentData.occupation}
                    onChange={handleInputChange}
                    placeholder="Parent's occupation"
                    className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="children" className="text-sm font-medium text-gray-700">Children (Student IDs)</Label>
                  <Input
                    id="children"
                    name="children"
                    value={newParentData.children}
                    onChange={handleInputChange}
                    placeholder="e.g., STU001, STU002 (comma separated)"
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
                onClick={handleAddParent}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
              >
                {loading ? 'Adding...' : 'Add Parent'}
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
            placeholder="Search parents..."
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
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Contact Number</TableHeader>
              <TableHeader>User ID</TableHeader>
              <TableHeader>Occupation</TableHeader>
              <TableHeader>Children</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading parents...</TableCell>
              </TableRow>
            ) : filteredParents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No parents found.</TableCell>
              </TableRow>
            ) : (
              filteredParents.map((parent) => (
                <TableRow key={parent._id}>
                  <TableCell>
                    {parent.firstName} {parent.lastName}
                  </TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {parent.user_id_number}
                    </span>
                  </TableCell>
                  <TableCell>{parent.occupation || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {parent.children?.length || 0} child(ren)
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(parent)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteParent(parent._id)}>
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
        <DialogContent className="bg-white border-0 shadow-2xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-white border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Parent</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the parent's information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white p-6 space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                <Input
                  id="edit-firstName"
                  name="firstName"
                  value={editParentData.firstName}
                  onChange={handleEditInputChange}
                  required
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                <Input
                  id="edit-lastName"
                  name="lastName"
                  value={editParentData.lastName}
                  onChange={handleEditInputChange}
                  required
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editParentData.email}
                  onChange={handleEditInputChange}
                  required
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">Contact Number</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={editParentData.phone}
                  onChange={handleEditInputChange}
                  placeholder="Phone number"
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Parent Information
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-homeAddress" className="text-sm font-medium text-gray-700">Home Address</Label>
                <textarea
                  id="edit-homeAddress"
                  name="homeAddress"
                  value={editParentData.homeAddress}
                  onChange={handleEditInputChange}
                  rows={3}
                  placeholder="Full home address"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-occupation" className="text-sm font-medium text-gray-700">Occupation</Label>
                <Input
                  id="edit-occupation"
                  name="occupation"
                  value={editParentData.occupation}
                  onChange={handleEditInputChange}
                  placeholder="Parent's occupation"
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-children" className="text-sm font-medium text-gray-700">Children (Student IDs)</Label>
                <Input
                  id="edit-children"
                  name="children"
                  value={editParentData.children}
                  onChange={handleEditInputChange}
                  placeholder="e.g., STU001, STU002 (comma separated)"
                  className="bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
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
              onClick={handleUpdateParent}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
            >
              {loading ? 'Updating...' : 'Update Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

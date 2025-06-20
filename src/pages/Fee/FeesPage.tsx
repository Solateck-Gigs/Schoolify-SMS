import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Label from '../../components/ui/Label';
import { useAuthStore } from '../../lib/store';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Fee {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    user_id_number: string;
  };
  academicYear: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: 'paid' | 'partially_paid' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  user_id_number: string;
}

export default function FeesPage() {
  const { user } = useAuthStore();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    studentId: '',
    academicYear: '2024-2025',
    term: '',
    amountDue: '',
    dueDate: '',
  });

  const [paymentData, setPaymentData] = useState({
    amountPaid: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isParent = user?.role === 'parent';

  useEffect(() => {
    if (user) {
      fetchFees();
      if (isAdmin) {
        fetchStudents();
      }
    }
  }, [user]);

  const fetchFees = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/fees');
      setFees(data);
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast.error('Failed to fetch fees');
      setFees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students');
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.term || !formData.amountDue || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/fees', {
        studentId: formData.studentId,
        academicYear: formData.academicYear,
        term: formData.term,
        amountDue: parseFloat(formData.amountDue),
        dueDate: formData.dueDate,
      });

      setFees(prev => [data, ...prev]);
      setShowAddModal(false);
      setFormData({
        studentId: '',
        academicYear: '2024-2025',
        term: '',
        amountDue: '',
        dueDate: '',
      });
      toast.success('Fee record created successfully');
    } catch (error: any) {
      console.error('Error creating fee:', error);
      toast.error(error.response?.data?.error || 'Failed to create fee record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee || !paymentData.amountPaid) {
      toast.error('Please enter payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.put(`/fees/${selectedFee._id}`, {
        amountPaid: parseFloat(paymentData.amountPaid),
      });

      setFees(prev => prev.map(fee => 
        fee._id === selectedFee._id ? data : fee
      ));
      setShowPaymentModal(false);
      setSelectedFee(null);
      setPaymentData({ amountPaid: '' });
      toast.success('Payment recorded successfully');
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.put(`/fees/${selectedFee._id}`, {
        academicYear: formData.academicYear,
        term: formData.term,
        amountDue: parseFloat(formData.amountDue),
        dueDate: formData.dueDate,
      });

      setFees(prev => prev.map(fee => 
        fee._id === selectedFee._id ? data : fee
      ));
      setShowEditModal(false);
      setSelectedFee(null);
      toast.success('Fee record updated successfully');
    } catch (error: any) {
      console.error('Error updating fee:', error);
      toast.error(error.response?.data?.error || 'Failed to update fee record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) {
      return;
    }

    try {
      await api.delete(`/fees/${feeId}`);
      setFees(prev => prev.filter(fee => fee._id !== feeId));
      toast.success('Fee record deleted successfully');
    } catch (error: any) {
      console.error('Error deleting fee:', error);
      toast.error(error.response?.data?.error || 'Failed to delete fee record');
    }
  };

  const openPaymentModal = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentData({ amountPaid: (fee.amountDue - fee.amountPaid).toString() });
    setShowPaymentModal(true);
  };

  const openEditModal = (fee: Fee) => {
    setSelectedFee(fee);
    setFormData({
      studentId: fee.student._id,
      academicYear: fee.academicYear,
      term: fee.term,
      amountDue: fee.amountDue.toString(),
      dueDate: fee.dueDate.split('T')[0],
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partially_paid':
        return 'Partially Paid';
      case 'unpaid':
        return 'Unpaid';
      default:
        return status;
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = searchTerm
      ? `${fee.student.firstName} ${fee.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student.user_id_number.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesTerm = filterTerm ? fee.term === filterTerm : true;
    const matchesStatus = filterStatus ? fee.status === filterStatus : true;

    return matchesSearch && matchesTerm && matchesStatus;
  });

  const termOptions = [
    { value: '', label: 'All Terms' },
    { value: 'Term 1', label: 'Term 1' },
    { value: 'Term 2', label: 'Term 2' },
    { value: 'Term 3', label: 'Term 3' },
    { value: 'Annual', label: 'Annual' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'unpaid', label: 'Unpaid' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees Management</h1>
          <p className="text-gray-600">
            {isParent ? "View your children's fee information" : "Manage student fee records and payments"}
          </p>
        </div>
        
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Fee Record
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by student name, admission number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={termOptions}
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Student</TableHeader>
                    <TableHeader>Student ID</TableHeader>
                    <TableHeader>Academic Year</TableHeader>
                    <TableHeader>Term</TableHeader>
                    <TableHeader>Amount Due</TableHeader>
                    <TableHeader>Amount Paid</TableHeader>
                    <TableHeader>Balance</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    {isAdmin && <TableHeader className="text-right">Actions</TableHeader>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-gray-500">
                        No fee records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFees.map((fee) => (
                      <TableRow key={fee._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {fee.student.firstName} {fee.student.lastName}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {fee.student.user_id_number}
                          </span>
                        </TableCell>
                        <TableCell>{fee.academicYear}</TableCell>
                        <TableCell>{fee.term}</TableCell>
                        <TableCell className="font-semibold">${fee.amountDue.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600 font-semibold">${fee.amountPaid.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          <span className={fee.amountDue - fee.amountPaid > 0 ? 'text-red-600' : 'text-green-600'}>
                            ${(fee.amountDue - fee.amountPaid).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                            {getStatusText(fee.status)}
                          </span>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {fee.status !== 'paid' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPaymentModal(fee)}
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(fee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteFee(fee._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Fee Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Add New Fee Record</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new fee record for a student
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddFee} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">Student *</Label>
                <Select
                  id="studentId"
                  options={[
                    { value: '', label: 'Select a student' },
                    ...students.map(student => ({
                      value: student._id,
                      label: `${student.firstName} ${student.lastName} (${student.user_id_number})`
                    }))
                  ]}
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm font-medium text-gray-700">Academic Year *</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term" className="text-sm font-medium text-gray-700">Term *</Label>
                <Select
                  id="term"
                  options={[
                    { value: '', label: 'Select term' },
                    { value: 'Term 1', label: 'Term 1' },
                    { value: 'Term 2', label: 'Term 2' },
                    { value: 'Term 3', label: 'Term 3' },
                    { value: 'Annual', label: 'Annual' },
                  ]}
                  value={formData.term}
                  onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountDue" className="text-sm font-medium text-gray-700">Amount Due *</Label>
                <Input
                  id="amountDue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amountDue}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountDue: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Fee Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Record Payment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Record payment for {selectedFee?.student.firstName} {selectedFee?.student.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFee && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Due:</span>
                    <span className="font-semibold text-gray-900">${selectedFee.amountDue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold text-green-600">${selectedFee.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold text-red-600">
                      ${(selectedFee.amountDue - selectedFee.amountPaid).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amountPaid" className="text-sm font-medium text-gray-700">Payment Amount *</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedFee.amountDue - selectedFee.amountPaid}
                    placeholder="0.00"
                    value={paymentData.amountPaid}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amountPaid: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Fee Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Fee Record</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update fee record for {selectedFee?.student.firstName} {selectedFee?.student.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditFee} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="editAcademicYear" className="text-sm font-medium text-gray-700">Academic Year *</Label>
                <Input
                  id="editAcademicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTerm" className="text-sm font-medium text-gray-700">Term *</Label>
                <Select
                  id="editTerm"
                  options={[
                    { value: '', label: 'Select term' },
                    { value: 'Term 1', label: 'Term 1' },
                    { value: 'Term 2', label: 'Term 2' },
                    { value: 'Term 3', label: 'Term 3' },
                    { value: 'Annual', label: 'Annual' },
                  ]}
                  value={formData.term}
                  onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editAmountDue" className="text-sm font-medium text-gray-700">Amount Due *</Label>
                <Input
                  id="editAmountDue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amountDue}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountDue: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDueDate" className="text-sm font-medium text-gray-700">Due Date *</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Fee Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Printer, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Fee } from '../../types';

export default function FeesPage() {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingFee, setIsAddingFee] = useState(false);
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
    
    // Fetch fees from Supabase
    // This is a mock implementation
    const fetchFees = async () => {
      // In a real app, this would be a Supabase query
      const mockFees: Fee[] = [
        {
          id: '1',
          studentId: '1',
          amount: 350,
          type: 'tuition',
          description: 'Monthly tuition fee',
          dueDate: '2023-05-10',
          paidDate: '2023-05-05',
          status: 'paid',
          receiptNumber: 'REC-001',
        },
        {
          id: '2',
          studentId: '2',
          amount: 450,
          type: 'tuition',
          description: 'Monthly tuition fee',
          dueDate: '2023-05-10',
          paidDate: '2023-05-07',
          status: 'paid',
          receiptNumber: 'REC-002',
        },
        {
          id: '3',
          studentId: '3',
          amount: 250,
          type: 'books',
          description: 'Textbooks for semester',
          dueDate: '2023-05-15',
          status: 'pending',
        },
        {
          id: '4',
          studentId: '1',
          amount: 100,
          type: 'uniform',
          description: 'School uniform',
          dueDate: '2023-04-30',
          status: 'overdue',
        },
      ];
      
      setFees(mockFees);
    };
    
    fetchFees();
  }, [user]);
  
  // Mock student data - In a real app, this would be fetched from Supabase
  const students = {
    '1': { name: 'Emma Johnson', class: 'Class 4A' },
    '2': { name: 'Michael Chen', class: 'Class 6B' },
    '3': { name: 'Sofia Rodriguez', class: 'Class 2A' },
  };
  
  const filteredFees = fees.filter(fee => {
    const matchesType = filterType ? fee.type === filterType : true;
    const matchesStatus = filterStatus ? fee.status === filterStatus : true;
    const matchesSearch = searchTerm 
      ? students[fee.studentId as keyof typeof students]?.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesType && matchesStatus && matchesSearch;
  });
  
  const feeTypeOptions = [
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'uniform', label: 'Uniform' },
    { value: 'books', label: 'Books' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ];
  
  const statusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees Management</h1>
          <p className="text-gray-600">Record and track student fee payments</p>
        </div>
        
        {isAdmin && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => setIsAddingFee(true)}
          >
            Record Payment
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
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                className="pl-10"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'All Types' }, ...feeTypeOptions]}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'All Status' }, ...statusOptions]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Student</TableHeader>
                <TableHeader>Fee Type</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFees.length > 0 ? (
                filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      {students[fee.studentId as keyof typeof students]?.name}
                      <div className="text-xs text-gray-500">
                        {students[fee.studentId as keyof typeof students]?.class}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{fee.type}</TableCell>
                    <TableCell>${fee.amount}</TableCell>
                    <TableCell>{fee.dueDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        fee.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : fee.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {fee.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {fee.status === 'paid' && (
                          <>
                            <Button variant="ghost" size="sm" leftIcon={<Printer size={16} />}>
                              Print
                            </Button>
                            <Button variant="ghost" size="sm" leftIcon={<Send size={16} />}>
                              Send
                            </Button>
                          </>
                        )}
                        {(fee.status === 'pending' || fee.status === 'overdue') && isAdmin && (
                          <Button variant="success" size="sm">
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No fees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Fee payment form would go here - omitted for brevity */}
    </div>
  );
}
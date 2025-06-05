import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Printer, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Fee } from '../../types';
import { supabase } from '../../lib/supabase';

export default function FeesPage() {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [fees, setFees] = useState<Fee[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin' || user?.role === 'super_admin');
    setIsParent(user?.role === 'parent');
    if (user) {
      fetchFees();
    }
  }, [user]);
  
  const fetchFees = async () => {
    setIsLoading(true);
    let feesQuery = supabase
      .from('fees')
      .select(`
        *,
        students ( id, first_name, last_name, class_level, section )
      `);

    if (isParent && user?.id) {
      const { data: children, error: childrenError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', user.id);

      if (childrenError) {
        console.error('Error fetching children:', childrenError);
        setIsLoading(false);
        return;
      }

      const childrenIds = children.map(child => child.id);

      feesQuery = feesQuery.in('student_id', childrenIds);
    } else if (isAdmin) {
    } else {
       setFees([]);
       setIsLoading(false);
       return;
    }

    const { data: feesData, error: feesError } = await feesQuery;

    if (feesError) {
      console.error('Error fetching fees:', feesError);
    } else {
      const processedFees = feesData?.map(fee => ({
        ...fee,
        students: fee.students
      }));
      setFees(processedFees || []);
    }

    setIsLoading(false);
  };
  
  const filteredFees = fees.filter(fee => {
    const matchesType = filterType ? fee.type === filterType : true;
    const matchesStatus = filterStatus ? fee.status === filterStatus : true;
    const matchesSearch = searchTerm
      ? `${fee.students?.first_name} ${fee.students?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesType && matchesStatus && matchesSearch;
  });
  
  const feeTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'uniform', label: 'Uniform' },
    { value: 'books', label: 'Books' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' },
  ];
  
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees Management</h1>
          <p className="text-gray-600">{isParent ? "View your children's fee information" : "Record and track student fee payments"}</p>
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
                placeholder={isParent ? 'Search by child name...' : 'Search by student name...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                className="pl-10"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={feeTypeOptions}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
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
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>{isParent ? 'Child' : 'Student'}</TableHeader>
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
                        {fee.students?.first_name} {fee.students?.last_name}
                        <div className="text-xs text-gray-500">
                          {fee.students?.class_level && `Class ${fee.students.class_level}`}{fee.students?.section && ` - ${fee.students.section}`}
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
                        {isAdmin && (
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
                            {(fee.status === 'pending' || fee.status === 'overdue') && (
                              <Button variant="success" size="sm">
                                Record Payment
                              </Button>
                            )}
                          </div>
                        )}
                        {isParent && (
                           <Button variant="outline" size="sm">
                            View Details
                           </Button>
                        )}
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
          )}
        </CardContent>
      </Card>
      
      {/* Fee payment form would go here - omitted for brevity */}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Printer, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Fee } from '../../types';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { DataGrid } from '@mui/x-data-grid';

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
    try {
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
  
  const handlePayment = async (feeId: string, amount: number) => {
    try {
      const { data } = await api.post(`/fees/${feeId}/payments`, { amount });
      setFees(prev => prev.map(fee => 
        fee.id === feeId ? { ...fee, ...data } : fee
      ));
      toast.success('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
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
  
  const columns = [
    { field: 'student_name', headerName: 'Student Name', width: 200,
      valueGetter: (params: any) => 
        `${params.row.students?.first_name} ${params.row.students?.last_name}` 
    },
    { field: 'class', headerName: 'Class', width: 150,
      valueGetter: (params: any) => 
        `${params.row.students?.class_level && `Class ${params.row.students.class_level}`}${params.row.students?.section && ` - ${params.row.students.section}`}`
    },
    { field: 'amount', headerName: 'Total Amount', width: 150,
      valueGetter: (params: any) => `$${params.row.amount.toFixed(2)}`
    },
    { field: 'paid_amount', headerName: 'Paid Amount', width: 150,
      valueGetter: (params: any) => `$${params.row.paid_amount.toFixed(2)}`
    },
    { field: 'balance', headerName: 'Balance', width: 150,
      valueGetter: (params: any) => 
        `$${(params.row.amount - params.row.paid_amount).toFixed(2)}`
    },
    { field: 'due_date', headerName: 'Due Date', width: 150,
      valueGetter: (params: any) => 
        new Date(params.row.due_date).toLocaleDateString()
    },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'actions', headerName: 'Actions', width: 200,
      renderCell: (params: any) => (
        <Button
          onClick={() => handlePayment(params.row.id, 0)}
          disabled={params.row.status === 'paid'}
        >
          Record Payment
        </Button>
      )
    }
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
            onClick={() => setIsAddingFee(true)}
          >
            <span className="flex items-center gap-2">
              <PlusCircle size={16} />
              Record Payment
            </span>
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
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid<Fee>
                rows={filteredFees}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 },
                  },
                }}
                pageSizeOptions={[10]}
                checkboxSelection={false}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Fee payment form would go here - omitted for brevity */}
    </div>
  );
}
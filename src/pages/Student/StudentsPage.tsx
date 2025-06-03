import { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';
import { Student } from '../../types';

export default function StudentsPage() {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [filterClass, setFilterClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
    
    // Fetch students from Supabase
    // This is a mock implementation
    const fetchStudents = async () => {
      // In a real app, this would be a Supabase query
      const mockStudents: Student[] = [
        {
          id: '1',
          firstName: 'Emma',
          lastName: 'Johnson',
          dateOfBirth: '2012-05-15',
          gender: 'female',
          enrollmentDate: '2022-09-01',
          classLevel: 4,
          section: 'A',
          parentId: 'parent1',
          address: '123 Main St, Cityville',
          contactNumber: '555-1234',
        },
        {
          id: '2',
          firstName: 'Michael',
          lastName: 'Chen',
          dateOfBirth: '2011-08-22',
          gender: 'male',
          enrollmentDate: '2022-09-01',
          classLevel: 6,
          section: 'B',
          parentId: 'parent2',
          address: '456 Oak Ave, Townsville',
          contactNumber: '555-5678',
        },
        {
          id: '3',
          firstName: 'Sofia',
          lastName: 'Rodriguez',
          dateOfBirth: '2014-03-10',
          gender: 'female',
          enrollmentDate: '2022-09-01',
          classLevel: 2,
          section: 'A',
          parentId: 'parent3',
          address: '789 Pine St, Villagetown',
          contactNumber: '555-9012',
        },
      ];
      
      setStudents(mockStudents);
    };
    
    fetchStudents();
  }, [user]);
  
  const filteredStudents = students.filter(student => {
    const matchesClass = filterClass ? student.classLevel.toString() === filterClass : true;
    const matchesSearch = searchTerm 
      ? `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesClass && matchesSearch;
  });
  
  const classOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Class ${i + 1}`,
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-600">Manage student records and information</p>
        </div>
        
        {isAdmin && (
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => setIsAddingStudent(true)}
          >
            Add Student
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                className="pl-10"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'All Classes' }, ...classOptions]}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Class</TableHeader>
                <TableHeader>Parent</TableHeader>
                <TableHeader>Contact</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>Class {student.classLevel}{student.section && `-${student.section}`}</TableCell>
                    <TableCell>
                      {/* In a real app, you'd fetch and display parent name */}
                      Parent: {student.parentId}
                    </TableCell>
                    <TableCell>{student.contactNumber}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" leftIcon={<Edit size={16} />}>
                          Edit
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={16} />}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Student form would go here - omitted for brevity */}
    </div>
  );
}
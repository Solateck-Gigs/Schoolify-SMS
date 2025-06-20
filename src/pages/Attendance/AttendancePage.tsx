import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Search, Calendar, Users, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../lib/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  user_id_number: string;
  admissionNumber: string;
  email: string;
  present: boolean;
  status: 'present' | 'absent' | 'late' | null;
  reason?: string;
}

interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface AttendanceRecord {
  _id: string;
  date: string;
  class: {
    _id: string;
    name: string;
    gradeLevel: string;
    section: string;
  };
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    user_id_number: string;
    admissionNumber: string;
  };
  status: 'present' | 'absent' | 'late';
  reason?: string;
  markedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface AttendanceSummary {
  date: string;
  class: {
    _id: string;
    name: string;
    gradeLevel: string;
    section: string;
  };
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Attendance History States
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendanceDetails, setSelectedAttendanceDetails] = useState<AttendanceRecord[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch classes when component mounts
  useEffect(() => {
    fetchClasses();
    fetchAttendanceHistory();
  }, []);

  // Fetch students when class or date changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesData = await apiFetch('/classes') as Class[];
      setClasses(classesData);
      
      // If user is a teacher, filter to only their assigned classes
      if (user?.role === 'teacher') {
        const teacherClasses = classesData.filter(cls => 
          cls.teacher?._id === user._id
        );
        setClasses(teacherClasses);
        // Auto-select first class if teacher has only one
        if (teacherClasses.length === 1) {
          setSelectedClass(teacherClasses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await apiFetch(`/attendance/class/${selectedClass}/students?date=${selectedDate}`) as Student[];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      const historyData = await apiFetch('/attendance/summary') as AttendanceSummary[];
      setAttendanceHistory(historyData);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Failed to fetch attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAttendanceDetails = async (classId: string, date: string) => {
    try {
      setDetailsLoading(true);
      const detailsData = await apiFetch(`/attendance/details?classId=${classId}&date=${date}`) as AttendanceRecord[];
      setSelectedAttendanceDetails(detailsData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      toast.error('Failed to fetch attendance details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status, present: status === 'present' }
        : student
    ));
  };

  const saveAttendance = async () => {
    try {
      if (!selectedClass) {
        toast.error('Please select a class');
        return;
      }

      if (user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'teacher') {
        toast.error('You do not have permission to save attendance');
        return;
      }

      setSaving(true);

      // Prepare attendance records - only include students with status set
      const attendanceRecords = students
        .filter(student => student.status !== null)
        .map(student => ({
          studentId: student.id,
          status: student.status,
          reason: student.reason || ''
        }));

      if (attendanceRecords.length === 0) {
        toast.error('Please mark attendance for at least one student');
        return;
      }

      await apiFetch('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate,
          attendanceRecords
        }),
      });

      toast.success(`Attendance saved successfully for ${attendanceRecords.length} students`);
      
      // Refresh the students data and attendance history
      await fetchStudents();
      await fetchAttendanceHistory();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredHistory = attendanceHistory.filter(record => {
    const matchesSearch = searchTerm
      ? `${record.class.name} Grade ${record.class.gradeLevel} ${record.class.section}`.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesClass = filterClass ? record.class._id === filterClass : true;
    const matchesDate = filterDate ? record.date === filterDate : true;
    return matchesSearch && matchesClass && matchesDate;
  });

  const selectedClassData = classes.find(cls => cls._id === selectedClass);

  return (
    <div className="space-y-8">
      {/* Current Attendance Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
            <p className="text-gray-600">Track and manage student attendance</p>
            {selectedClassData && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedClassData.name} - Grade {selectedClassData.gradeLevel} {selectedClassData.section}
              </p>
            )}
          </div>
          
          {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'teacher') && selectedClass && (
            <Button 
              variant="primary" 
              onClick={saveAttendance}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <Select
                  label="Class"
                  options={[
                    { value: '', label: 'Select a class' },
                    ...classes.map(cls => ({
                      value: cls._id,
                      label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
                    }))
                  ]}
                  value={selectedClass}
                  onChange={handleClassChange}
                  fullWidth
                />
              </div>
              
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : !selectedClass ? (
              <div className="text-center py-8 text-gray-500">
                Please select a class to view attendance
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students found in this class
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Student Name</TableHeader>
                      <TableHeader>Student ID</TableHeader>
                      <TableHeader>Admission Number</TableHeader>
                      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'teacher') ? (
                        <TableHeader>Mark Attendance</TableHeader>
                      ) : (
                        <TableHeader>Status</TableHeader>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.user_id_number}
                          </span>
                        </TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'teacher') ? (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={student.status === 'present' ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                                className={student.status === 'present' ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                Present
                              </Button>
                              <Button
                                variant={student.status === 'absent' ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                                className={student.status === 'absent' ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                              >
                                Absent
                              </Button>
                              <Button
                                variant={student.status === 'late' ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                className={student.status === 'late' ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}
                              >
                                Late
                              </Button>
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                              {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Not Marked'}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance History
            </h2>
            <p className="text-gray-600">View previously saved attendance records</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by class name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              
              <div className="w-full sm:w-48">
                <Select
                  options={[
                    { value: '', label: 'All Classes' },
                    ...classes.map(cls => ({
                      value: cls._id,
                      label: `${cls.name} - Grade ${cls.gradeLevel}`
                    }))
                  ]}
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  fullWidth
                />
              </div>
              
              <div className="w-full sm:w-48">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Filter by date"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading attendance history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Date</TableHeader>
                      <TableHeader>Class</TableHeader>
                      <TableHeader>Total Students</TableHeader>
                      <TableHeader>Present</TableHeader>
                      <TableHeader>Absent</TableHeader>
                      <TableHeader>Late</TableHeader>
                      <TableHeader>Attendance Rate</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHistory.map((record, index) => (
                      <TableRow key={`${record.date}-${record.class._id}-${index}`} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.class.name}</p>
                            <p className="text-sm text-gray-500">Grade {record.class.gradeLevel} {record.class.section}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {record.totalStudents}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {record.presentCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {record.absentCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {record.lateCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getAttendanceRateColor(record.attendanceRate)}`}>
                            {record.attendanceRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAttendanceDetails(record.class._id, record.date)}
                            disabled={detailsLoading}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Attendance Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Detailed attendance information for the selected date and class
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading details...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedAttendanceDetails.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2 font-semibold">{new Date(selectedAttendanceDetails[0].date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Class:</span>
                      <span className="ml-2 font-semibold">{selectedAttendanceDetails[0].class.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Records:</span>
                      <span className="ml-2 font-semibold">{selectedAttendanceDetails.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Marked By:</span>
                      <span className="ml-2 font-semibold">
                        {selectedAttendanceDetails[0]?.markedBy.firstName} {selectedAttendanceDetails[0]?.markedBy.lastName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Student Name</TableHeader>
                      <TableHeader>Student ID</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Reason</TableHeader>
                      <TableHeader>Time Recorded</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAttendanceDetails.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">
                          {record.student.firstName} {record.student.lastName}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {record.student.user_id_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.reason || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(record.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
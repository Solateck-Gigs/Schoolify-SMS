import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Grid, GridProps } from '@mui/material';
import { useAuthStore } from '../../lib/store';
import api from '../../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import { Users, GraduationCap, Receipt, Clock } from 'lucide-react';

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  class: {
    name: string;
    section: string;
  };
  parent: {
    first_name: string;
    last_name: string;
  };
}

interface Class {
  _id: string;
  name: string;
  section: string;
  academic_year: string;
  teacher: {
    first_name: string;
    last_name: string;
  };
}

interface StudentPerformance {
  student: Student;
  performance: {
    totalAssessments: number;
    averageScore: number;
    subjectAverages: {
      [key: string]: {
        total: number;
        count: number;
        average: number;
      };
    };
  };
}

interface StudentAttendance {
  student: Student;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    presentPercentage: number;
    absentPercentage: number;
    latePercentage: number;
  };
}

interface StudentFees {
  student: Student;
  fees: {
    totalFees: number;
    paidFees: number;
    outstandingFees: number;
    paymentStatus: {
      paid: number;
      partially_paid: number;
      unpaid: number;
    };
  };
}

interface ClassStatistics {
  class: Class;
  statistics: {
    totalStudents: number;
    performance: {
      averageScore: number;
      gradeDistribution: {
        'A+': number;
        'A': number;
        'B+': number;
        'B': number;
        'C+': number;
        'C': number;
        'F': number;
      };
      subjectAverages: {
        [key: string]: {
          total: number;
          count: number;
          average: number;
        };
      };
    };
    attendance: {
      totalDays: number;
      averageAttendance: number;
      present: number;
      absent: number;
      late: number;
    };
  };
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalFeesCollected: number;
  averageAttendance: number;
}

interface MonthlyStats {
  year: number;
  month: number;
  studentRegistrations: number;
  teacherRegistrations: number;
  feesCollected: number;
  attendanceRate: number;
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: 'flex',
}));

interface CustomGridProps extends GridProps {
  children: React.ReactNode;
}

const CustomGrid: React.FC<CustomGridProps> = (props) => (
  <StyledGrid {...props} />
);

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  period?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, period = "Last 30 days" }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          sx={{
            backgroundColor: 'primary.light',
            borderRadius: '50%',
            p: 1,
            mr: 2,
          }}
        >
          <Icon size={24} color="primary" />
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div" gutterBottom>
        {value}
      </Typography>
      <Box display="flex" alignItems="center">
        <Typography
          variant="body2"
          color={change >= 0 ? 'success.main' : 'error.main'}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {period}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [studentsPerformance, setStudentsPerformance] = useState<StudentPerformance[]>([]);
  const [studentsAttendance, setStudentsAttendance] = useState<StudentAttendance[]>([]);
  const [studentsFees, setStudentsFees] = useState<StudentFees[]>([]);
  const [classStatistics, setClassStatistics] = useState<ClassStatistics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [timeRange, setTimeRange] = useState('6');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch overall stats
        const overallResponse = await api.get('/stats/overall');
        setStats(overallResponse.data);

        // Fetch monthly stats
        const monthlyResponse = await api.get('/stats/monthly?months=6');
        setMonthlyStats(monthlyResponse.data);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]._id);
      }
    } catch (err) {
      setError('Error fetching classes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassData = async () => {
    setIsLoading(true);
    try {
      const [performanceRes, attendanceRes, feesRes, statsRes] = await Promise.all([
        api.get('/students/performance', { params: { classId: selectedClass } }),
        api.get('/students/attendance', { params: { classId: selectedClass } }),
        api.get('/fees/status', { params: { classId: selectedClass } }),
        api.get(`/classes/${selectedClass}/stats`)
      ]);

      setStudentsPerformance(performanceRes.data);
      setStudentsAttendance(attendanceRes.data);
      setStudentsFees(feesRes.data);
      setClassStatistics(statsRes.data);
    } catch (err) {
      setError('Error fetching class data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (event: SelectChangeEvent<string>) => {
    setSelectedClass(event.target.value);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box p={3}>
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  // Calculate changes from previous month
  const getMonthlyChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = monthlyStats[monthlyStats.length - 1] || {
    studentRegistrations: 0,
    teacherRegistrations: 0,
    feesCollected: 0,
    attendanceRate: 0
  };

  const previousMonth = monthlyStats[monthlyStats.length - 2] || {
    studentRegistrations: 0,
    teacherRegistrations: 0,
    feesCollected: 0,
    attendanceRate: 0
  };

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Statistics Cards */}
      <CustomGrid container spacing={3} mb={4}>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            change={getMonthlyChange(
              currentMonth.studentRegistrations,
              previousMonth.studentRegistrations
            )}
            icon={Users}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            change={getMonthlyChange(
              currentMonth.teacherRegistrations,
              previousMonth.teacherRegistrations
            )}
            icon={GraduationCap}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Fees Collected"
            value={`$${stats.totalFeesCollected.toLocaleString()}`}
            change={getMonthlyChange(
              currentMonth.feesCollected,
              previousMonth.feesCollected
            )}
            icon={Receipt}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Attendance"
            value={`${stats.averageAttendance}%`}
            change={getMonthlyChange(
              currentMonth.attendanceRate,
              previousMonth.attendanceRate
            )}
            icon={Clock}
          />
        </CustomGrid>
      </CustomGrid>

      {/* Charts Section */}
      <CustomGrid container spacing={3}>
        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">New Students Registration</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="3">3 months</MenuItem>
                  <MenuItem value="6">6 months</MenuItem>
                  <MenuItem value="12">12 months</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="studentRegistrations" fill="#8884d8" name="New Students" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </CustomGrid>

        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Performance Trends</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#8884d8" name="Attendance" />
                <Line type="monotone" dataKey="feesCollected" stroke="#ffc658" name="Fees Collection" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </CustomGrid>
      </CustomGrid>

      {/* Class Selection and Details */}
      <Box mt={4}>
        <Typography variant="h6" mb={2}>Class Details</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} - {cls.section} ({cls.academic_year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CustomGrid>

          {classStatistics && (
            <CustomGrid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} centered>
                  <Tab label="Performance" />
                  <Tab label="Attendance" />
                  <Tab label="Fees" />
                </Tabs>

                {activeTab === 0 && (
                  <Box p={3}>
                    <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Parent</TableCell>
                            <TableCell>Total Assessments</TableCell>
                            <TableCell>Average Score</TableCell>
                            <TableCell>Subject Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                          {studentsPerformance.map((item) => (
                            <TableRow key={item.student._id}>
                              <TableCell>
                                {item.student.first_name} {item.student.last_name}
                              </TableCell>
                              <TableCell>
                                {item.student.parent.first_name} {item.student.parent.last_name}
                              </TableCell>
                              <TableCell>{item.performance.totalAssessments}</TableCell>
                              <TableCell>{item.performance.averageScore.toFixed(1)}%</TableCell>
                    <TableCell>
                                {Object.entries(item.performance.subjectAverages).map(([subject, data]) => (
                                  <div key={subject}>
                                    {subject}: {data.average.toFixed(1)}%
                                  </div>
                                ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                    </TableContainer>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box p={3}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Parent</TableCell>
                            <TableCell>Total Days</TableCell>
                            <TableCell>Present</TableCell>
                            <TableCell>Absent</TableCell>
                            <TableCell>Late</TableCell>
                            <TableCell>Present Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {studentsAttendance.map((item) => (
                            <TableRow key={item.student._id}>
                              <TableCell>
                                {item.student.first_name} {item.student.last_name}
                              </TableCell>
                              <TableCell>
                                {item.student.parent.first_name} {item.student.parent.last_name}
                              </TableCell>
                              <TableCell>{item.attendance.totalDays}</TableCell>
                              <TableCell>{item.attendance.present}</TableCell>
                              <TableCell>{item.attendance.absent}</TableCell>
                              <TableCell>{item.attendance.late}</TableCell>
                              <TableCell>{item.attendance.presentPercentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box p={3}>
                    <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Parent</TableCell>
                            <TableCell>Total Fees</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Outstanding</TableCell>
                            <TableCell>Payment Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                          {studentsFees.map((item) => (
                            <TableRow key={item.student._id}>
                              <TableCell>
                                {item.student.first_name} {item.student.last_name}
                              </TableCell>
                              <TableCell>
                                {item.student.parent.first_name} {item.student.parent.last_name}
                              </TableCell>
                              <TableCell>${item.fees.totalFees.toLocaleString()}</TableCell>
                              <TableCell>${item.fees.paidFees.toLocaleString()}</TableCell>
                              <TableCell>${item.fees.outstandingFees.toLocaleString()}</TableCell>
                              <TableCell>
                                <CustomGrid container spacing={1}>
                                  <CustomGrid item>
                                    Paid: {item.fees.paymentStatus.paid}
                                  </CustomGrid>
                                  <CustomGrid item>
                                    Partial: {item.fees.paymentStatus.partially_paid}
                                  </CustomGrid>
                                  <CustomGrid item>
                                    Unpaid: {item.fees.paymentStatus.unpaid}
                                  </CustomGrid>
                                </CustomGrid>
                              </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                    </TableContainer>
                  </Box>
                )}
              </Paper>
            </CustomGrid>
          )}
        </CustomGrid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { useAuthStore } from '../../lib/store';
import api from '../../services/api';
import { Users, GraduationCap, Receipt, Clock } from 'lucide-react';

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  class: {
    name: string;
    section: string;
  };
}

interface Class {
  _id: string;
  name: string;
  section: string;
  academic_year: string;
}

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
  const { user, getCurrentUserId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
    averageAttendance: 85
  });
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classStats, setClassStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      // Fetch all dashboard data in parallel
      const [
        studentsRes,
        teachersRes,
        classesRes,
        feesRes,
        performanceRes,
        attendanceRes
      ] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/teachers'),
        api.get('/admin/classes'),
        api.get('/admin/fees'),
        api.get('/admin/students/performance'),
        api.get('/admin/students/attendance')
      ]);

      setStats({
        totalStudents: studentsRes.data.length,
        totalTeachers: teachersRes.data.length,
        totalClasses: classesRes.data.length,
        totalRevenue: feesRes.data.reduce((sum: number, fee: any) => sum + fee.amount, 0),
        averageAttendance: 85
      });

      setStudentPerformance(performanceRes.data);
      setAttendanceData(attendanceRes.data);
      setClasses(classesRes.data);
      
      if (classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0]._id);
        fetchClassStats(classesRes.data[0]._id);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStats = async (classId: string) => {
    try {
      const response = await api.get(`/classes/stats/${classId}`);
      setClassStats(response.data);
    } catch (err) {
      console.error('Error fetching class stats:', err);
    }
  };

  const handleClassChange = (event: SelectChangeEvent<string>) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    fetchClassStats(classId);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome back, {user?.firstName}! Here's your school overview.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            change={12.5}
            icon={Users}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            change={8.2}
            icon={GraduationCap}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            change={0}
            icon={Receipt}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Attendance"
            value={`${stats.averageAttendance}%`}
            change={3.4}
            icon={Clock}
          />
        </Grid>
      </Grid>

      {/* Class Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={selectedClass}
            onChange={handleClassChange}
            displayEmpty
          >
            <MenuItem value="">
              <em>Select a class</em>
            </MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.name} - {cls.section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Performance" />
          <Tab label="Attendance" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
        <Card>
          <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Performance
                </Typography>
                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Average Score</TableCell>
                        <TableCell>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {studentPerformance.map((item: any) => (
                        <TableRow key={item.student._id}>
                          <TableCell>
                            {item.student.first_name} {item.student.last_name}
                          </TableCell>
                    <TableCell>
                            {item.student.class.name} - {item.student.class.section}
                    </TableCell>
                          <TableCell>{item.performance.averageScore}%</TableCell>
                          <TableCell>{item.performance.grade || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </TableContainer>
          </CardContent>
        </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
        <Card>
          <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Attendance
                </Typography>
                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Present Days</TableCell>
                        <TableCell>Absent Days</TableCell>
                        <TableCell>Attendance %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {attendanceData.map((item: any) => (
                        <TableRow key={item.student._id}>
                          <TableCell>
                            {item.student.first_name} {item.student.last_name}
                          </TableCell>
                          <TableCell>
                            {item.student.class.name} - {item.student.class.section}
                          </TableCell>
                          <TableCell>{item.attendance.present}</TableCell>
                          <TableCell>{item.attendance.absent}</TableCell>
                          <TableCell>{item.attendance.presentPercentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analytics and charts will be displayed here.
                </Typography>
          </CardContent>
        </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminDashboard;
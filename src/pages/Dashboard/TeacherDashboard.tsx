import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { useAuthStore } from '../../lib/store';
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
import { CustomGrid } from '../../components/ui/CustomGrid';
import { Users, GraduationCap, BookOpen, Clock } from 'lucide-react';
interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  class: {
    name: string;
    section: string;
  };
}

interface Mark {
  _id: string;
  student: Student;
  subject: string;
  score: number;
  totalScore: number;
  grade: string;
  assessment_type: string;
  date: string;
}

interface AttendanceRecord {
  _id: string;
  student: Student;
  status: 'present' | 'absent' | 'late';
  date: string;
  reason?: string;
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

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, period = "Last 30 days" }) => {
  // Handle undefined/null values
  const displayValue = value !== undefined && value !== null ? value : 0;
  const displayChange = change !== undefined && change !== null && !isNaN(change) ? change : 0;
  
  // Define colors for different icons
  const getIconColor = () => {
    switch (title) {
      case 'Total Students':
        return '#3b82f6'; // Blue
      case 'Average Performance':
        return '#10b981'; // Green
      case 'Total Classes':
        return '#f59e0b'; // Orange
      case 'Average Attendance':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };
  
  const iconColor = getIconColor();
  
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box
            sx={{
              border: `2px solid ${iconColor}`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
              backgroundColor: 'transparent',
            }}
          >
            <Icon size={24} color={iconColor} />
          </Box>
          <Typography variant="h6" component="div" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h3" component="div" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
          {displayValue}
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: displayChange >= 0 ? 'transparent' : 'error.light',
                borderRadius: 1,
                px: 1,
                py: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: displayChange >= 0 ? '#47e653' : 'error.dark',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {displayChange >= 0 ? '↗' : '↘'} {Math.abs(displayChange)}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {period}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const TeacherDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [markForm, setMarkForm] = useState({
    studentId: '',
    subject: '',
    score: 0,
    totalScore: 100,
    assessmentType: 'exam',
    term: 'Term 1',
    academicYear: new Date().getFullYear().toString(),
    remarks: ''
  });
  const [attendanceForm, setAttendanceForm] = useState<{
    [key: string]: { status: 'present' | 'absent' | 'late'; reason?: string };
  }>({});
  const [timeRange, setTimeRange] = useState('6');
  const [teacherStats, setTeacherStats] = useState({
    totalStudents: 0,
    averagePerformance: 0,
    totalClasses: 0,
    averageAttendance: 0,
    studentChange: 0,
    performanceChange: 0,
    classesChange: 0,
    attendanceChange: 0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchAssignedClasses();
    fetchTeacherStats();
    fetchMonthlyStats();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  const fetchTeacherStats = async () => {
    try {
      const response = await api.get('/teachers/stats');
      const data = response.data;
      
      // Set stats with safe defaults to avoid undefined/NaN
      setTeacherStats({
        totalStudents: data.totalStudents || 0,
        averagePerformance: data.averageScore || 0,
        totalClasses: data.totalClasses || 0,
        averageAttendance: data.attendanceRate || 0,
        studentChange: Math.random() * 10, // Placeholder - you can calculate real change later
        performanceChange: Math.random() * 10,
        classesChange: 0,
        attendanceChange: Math.random() * 5
      });
    } catch (err) {
      console.error('Error fetching teacher statistics:', err);
      setError('Error fetching teacher statistics');
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get('/teachers/monthly-stats', {
        params: { months: timeRange }
      });
      setMonthlyStats(response.data);
    } catch (err) {
      setError('Error fetching monthly statistics');
    }
  };

  const fetchAssignedClasses = async () => {
    try {
      const response = await api.get('/teachers/classes');
      setAssignedClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]._id);
      }
    } catch (err) {
      setError('Error fetching assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const [marksRes, attendanceRes] = await Promise.all([
        api.get(`/marks/class/${selectedClass}`),
        api.get(`/attendance/class/${selectedClass}`)
      ]);
      setMarks(marksRes.data);
      setAttendance(attendanceRes.data);
    } catch (err) {
      setError('Error fetching class data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMark = async () => {
    try {
      // Form validation
      if (!markForm.studentId || !markForm.subject || markForm.score < 0) {
        console.error('Invalid mark form data:', markForm);
        return;
      }

      // Make API call to add the mark
      const response = await api.post('/api/marks', {
        studentId: markForm.studentId,
        classId: selectedClass,
        subject: markForm.subject,
        score: markForm.score,
        totalScore: markForm.totalScore,
        assessmentType: markForm.assessmentType,
        term: markForm.term,
        academicYear: markForm.academicYear,
        remarks: markForm.remarks
      });

      setOpenMarkDialog(false);
      
      // Reset the form
      setMarkForm({
        studentId: '',
        subject: '',
        score: 0,
        totalScore: 100,
        assessmentType: 'exam',
        term: 'Term 1',
        academicYear: new Date().getFullYear().toString(),
        remarks: ''
      });
      
      // Refresh data
      fetchClassData();
      
      // Success message
      console.log('Mark added successfully', response.data);
    } catch (error) {
      console.error('Error adding mark:', error);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      if (!selectedClass) {
        console.error('No class selected');
        return;
      }
      
      // Format attendance data for API
      const attendanceData = Object.entries(attendanceForm).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        reason: data.reason || '',
        date: new Date().toISOString()
      }));
      
      // Make API call
      await api.post(`/api/attendance/class/${selectedClass}`, {
        attendance: attendanceData,
        classId: selectedClass
      });
      
      setOpenAttendanceDialog(false);
      
      // Reset form
      setAttendanceForm({});
      
      // Refresh data
      fetchClassData();
      
      // Success message
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleClassChange = (event: SelectChangeEvent<string>) => {
    setSelectedClass(event.target.value);
  };

  const handleMarkFormChange = (field: keyof typeof markForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    setMarkForm({
      ...markForm,
      [field]: event.target.value
    });
  };

  const handleAttendanceFormChange = (studentId: string, field: 'status' | 'reason') => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    setAttendanceForm({
      ...attendanceForm,
      [studentId]: {
        ...attendanceForm[studentId],
        [field]: event.target.value
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <CustomGrid container spacing={3} mb={4}>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={teacherStats.totalStudents}
            change={teacherStats.studentChange}
            icon={Users}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Performance"
            value={teacherStats.averagePerformance ? `${teacherStats.averagePerformance}%` : '0%'}
            change={teacherStats.performanceChange}
            icon={GraduationCap}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classes"
            value={teacherStats.totalClasses}
            change={teacherStats.classesChange}
            icon={BookOpen}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Attendance"
            value={teacherStats.averageAttendance ? `${teacherStats.averageAttendance}%` : '0%'}
            change={teacherStats.attendanceChange}
            icon={Clock}
          />
        </CustomGrid>
      </CustomGrid>

      {/* Charts Section */}
      <CustomGrid container spacing={3}>
        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Class Performance Trends</Typography>
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
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="performance" stroke="#8884d8" name="Average Performance" />
                <Line type="monotone" dataKey="attendance" stroke="#82ca9d" name="Attendance Rate" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </CustomGrid>

        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Subject-wise Performance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
                <Bar dataKey="passRate" fill="#82ca9d" name="Pass Rate" />
              </BarChart>
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
                {assignedClasses.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} - {cls.section} ({cls.academic_year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CustomGrid>

          {selectedClass && (
            <CustomGrid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Class Performance Summary</Typography>
                {/* Add detailed class performance metrics here */}
              </Paper>
            </CustomGrid>
          )}
        </CustomGrid>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Marks" />
              <Tab label="Attendance" />
            </Tabs>

            {activeTab === 0 && (
              <Box p={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenMarkDialog(true)}
                  sx={{ mb: 2 }}
                >
                  Add New Mark
                </Button>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((mark) => (
                        <TableRow key={mark._id}>
                          <TableCell>{mark.student ? `${mark.student.first_name || ''} ${mark.student.last_name || ''}` : 'Unknown Student'}</TableCell>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>{mark.score}/{mark.totalScore}</TableCell>
                          <TableCell>{mark.grade}</TableCell>
                          <TableCell>{mark.assessment_type}</TableCell>
                          <TableCell>{mark.date ? new Date(mark.date).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 1 && (
              <Box p={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenAttendanceDialog(true)}
                  sx={{ mb: 2 }}
                >
                  Mark Attendance
                </Button>

                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{record.student ? `${record.student.first_name || ''} ${record.student.last_name || ''}` : 'Unknown Student'}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{record.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Mark Dialog */}
      <Dialog open={openMarkDialog} onClose={() => setOpenMarkDialog(false)}>
        <DialogTitle>Add New Mark</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="student-label">Student</InputLabel>
            <Select
              labelId="student-label"
              value={markForm.studentId}
              onChange={handleMarkFormChange('studentId')}
            >
              {students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student ? `${student.first_name || ''} ${student.last_name || ''}` : 'Unknown Student'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
              labelId="subject-label"
              value={markForm.subject}
              onChange={handleMarkFormChange('subject')}
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Mathematics">Mathematics</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="Social Studies">Social Studies</MenuItem>
              <MenuItem value="Physics">Physics</MenuItem>
              <MenuItem value="Chemistry">Chemistry</MenuItem>
              <MenuItem value="Biology">Biology</MenuItem>
              <MenuItem value="Geography">Geography</MenuItem>
              <MenuItem value="History">History</MenuItem>
              <MenuItem value="Religious Studies">Religious Studies</MenuItem>
              <MenuItem value="Physical Education">Physical Education</MenuItem>
              <MenuItem value="French">French</MenuItem>
              <MenuItem value="ICT">ICT</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="assessment-label">Assessment Type</InputLabel>
            <Select
              labelId="assessment-label"
              value={markForm.assessmentType}
              onChange={handleMarkFormChange('assessmentType')}
            >
              <MenuItem value="exam">Exam</MenuItem>
              <MenuItem value="test">Test</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="term-label">Term</InputLabel>
            <Select
              labelId="term-label"
              value={markForm.term}
              onChange={handleMarkFormChange('term')}
            >
              <MenuItem value="Term 1">Term 1</MenuItem>
              <MenuItem value="Term 2">Term 2</MenuItem>
              <MenuItem value="Term 3">Term 3</MenuItem>
              <MenuItem value="Annual">Annual</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            label="Score"
            type="number"
            fullWidth
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            value={markForm.score}
            onChange={(e) => handleMarkFormChange('score')(e)}
          />
          
          <TextField
            margin="normal"
            label="Total Score"
            type="number"
            fullWidth
            value={markForm.totalScore}
            onChange={(e) => handleMarkFormChange('totalScore')(e)}
          />
          
          <TextField
            margin="normal"
            label="Remarks"
            fullWidth
            multiline
            rows={2}
            value={markForm.remarks}
            onChange={(e) => handleMarkFormChange('remarks')(e)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarkDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddMark} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark Attendance Dialog */}
      <Dialog open={openAttendanceDialog} onClose={() => setOpenAttendanceDialog(false)}>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Date: {new Date().toLocaleDateString()}
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      {student ? `${student.first_name || ''} ${student.last_name || ''}` : 'Unknown Student'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={attendanceForm[student._id]?.status || 'present'}
                        onChange={handleAttendanceFormChange(student._id, 'status')}
                        size="small"
                        fullWidth
                      >
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                        <MenuItem value="late">Late</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Reason (optional)"
                        value={attendanceForm[student._id]?.reason || ''}
                        onChange={handleAttendanceFormChange(student._id, 'reason')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAttendanceDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleMarkAttendance} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherDashboard;
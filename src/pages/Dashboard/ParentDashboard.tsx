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
import { GraduationCap, Receipt, Clock, Award } from 'lucide-react';

interface Child {
  _id: string;
  firstName: string;
  lastName: string;
  class: {
    name: string;
    section: string;
  };
}

interface Mark {
  _id: string;
  subject: string;
  score: number;
  totalScore: number;
  grade: string;
  assessment_type: string;
  date: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceRecord {
  _id: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  reason?: string;
}

interface Fee {
  _id: string;
  academic_year: string;
  term: string;
  amount_due: number;
  amount_paid: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  due_date: string;
}

interface SubjectResult {
  subject: string;
  exam: {
    scores: any[];
    average: number;
  };
  test: {
    scores: any[];
    average: number;
  };
  overallAverage: number;
  grade: string;
}

interface ChildResults {
  studentInfo: {
    name: string;
    class: any;
    classSize: number;
  };
  resultsBySubject: SubjectResult[];
  promotionStatus: {
    totalScore: number;
    threshold: number;
    canBePromoted: boolean;
    nextClass: string;
  };
  term: string;
  academicYear: string;
}

interface TimetableEntry {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
}

interface PerformanceSummary {
  totalAssessments: number;
  averageScore: number;
  subjectAverages: {
    [key: string]: {
      total: number;
      count: number;
      average: number;
    };
  };
  gradeDistribution: {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'F': number;
  };
}

interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  presentPercentage: number;
  absentPercentage: number;
  latePercentage: number;
}

interface FeeSummary {
  totalFees: number;
  paidFees: number;
  outstandingFees: number;
  paymentStatus: {
    paid: number;
    partially_paid: number;
    unpaid: number;
  };
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

const ParentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('6');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [results, setResults] = useState<ChildResults | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [childStats, setChildStats] = useState({
    averagePerformance: 0,
    totalFees: 0,
    attendanceRate: 0,
    ranking: 0,
    performanceChange: 12.5,
    feesChange: -5.2,
    attendanceChange: 2.8,
    rankingChange: 15.0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData();
      fetchChildStats();
      fetchMonthlyStats();
    }
  }, [selectedChild, timeRange]);

  useEffect(() => {
    console.log('Fees state changed:', fees);
  }, [fees]);

  const fetchChildren = async () => {
    setChildrenLoading(true);
    try {
      const response = await api.get('/parents/children');
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]._id);
      }
    } catch (err) {
      setError('Error fetching children');
    } finally {
      setChildrenLoading(false);
      setLoading(false);
    }
  };

  const fetchChildData = async () => {
    setLoading(true);
    try {
      const [performanceRes, attendanceRes, feesRes, resultsRes, timetableRes] = await Promise.all([
        api.get(`/parents/child/${selectedChild}/performance`),
        api.get(`/parents/child/${selectedChild}/attendance`),
        api.get(`/parents/child/${selectedChild}/fees`),
        api.get(`/parents/child/${selectedChild}/results`),
        api.get(`/parents/child/${selectedChild}/timetable`)
      ]);

      setMarks(performanceRes.data.marks);
      setPerformanceSummary(performanceRes.data.summary);
      setAttendance(attendanceRes.data.attendance);
      setAttendanceSummary(attendanceRes.data.summary);
      setFees(feesRes.data.fees);
      setFeeSummary(feesRes.data.summary);
      setResults(resultsRes.data);
      setTimetable(timetableRes.data);
    } catch (err) {
      console.error('Error fetching child data:', err);
      setError('Error fetching child data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildStats = async () => {
    try {
      const response = await api.get(`/parents/child/${selectedChild}/stats`);
      setChildStats(response.data);
    } catch (err) {
      setError('Error fetching child statistics');
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get(`/parents/child/${selectedChild}/monthly-stats`, {
        params: { months: timeRange }
      });
      setMonthlyStats(response.data);
    } catch (err) {
      setError('Error fetching monthly statistics');
    }
  };

  const handleChildChange = (event: SelectChangeEvent<string>) => {
    setSelectedChild(event.target.value);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderResultsTab = () => {
    if (resultsLoading) {
      return <CircularProgress />;
    }

    if (!results || !results.resultsBySubject || results.resultsBySubject.length === 0) {
      return (
        <Alert severity="info">
          No results available for this child yet. Check back later.
        </Alert>
      );
    }

    return (
      <Box>
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            {results.studentInfo.name} - Results Summary
          </Typography>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Class:
                </Typography>
                <Typography variant="body1">
                  {results.studentInfo.class?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Total Score:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {results.promotionStatus.totalScore} / {results.resultsBySubject.length * 100}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Promotion Status:
                </Typography>
                <Typography 
                  variant="body1" 
                  color={results.promotionStatus.canBePromoted ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {results.promotionStatus.canBePromoted ? 
                    `Can be promoted to ${results.promotionStatus.nextClass}` : 
                    `Needs to repeat current class`}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Typography variant="h6" gutterBottom>
          Subject Performance
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Exam Average</TableCell>
                <TableCell>Test Average</TableCell>
                <TableCell>Overall</TableCell>
                <TableCell>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.resultsBySubject.map((subject) => (
                <TableRow key={subject.subject}>
                  <TableCell>{subject.subject}</TableCell>
                  <TableCell>{Math.round(subject.exam.average)}%</TableCell>
                  <TableCell>{Math.round(subject.test.average)}%</TableCell>
                  <TableCell>{subject.overallAverage}%</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: subject.grade.includes('A') ? 'success.light' :
                                  subject.grade.includes('B') ? 'info.light' :
                                  subject.grade.includes('C') ? 'warning.light' :
                                  'error.light',
                      }}
                    >
                      {subject.grade}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderTimetableTab = () => {
    if (timetableLoading) {
      return <CircularProgress />;
    }

    if (!timetable || timetable.length === 0) {
      return (
        <Alert severity="info">
          No timetable available for this child's class yet.
        </Alert>
      );
    }

    const dayGroups: { [day: string]: TimetableEntry[] } = {};
    timetable.forEach(entry => {
      if (!dayGroups[entry.day]) {
        dayGroups[entry.day] = [];
      }
      dayGroups[entry.day].push(entry);
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = Object.keys(dayGroups).sort(
      (a, b) => days.indexOf(a) - days.indexOf(b)
    );

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Class Timetable
        </Typography>
        
        {sortedDays.map(day => (
          <Box key={day} mb={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {day}
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dayGroups[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(entry => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        {entry.startTime} - {entry.endTime}
                      </TableCell>
                      <TableCell>{entry.subject}</TableCell>
                      <TableCell>
                        {entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>
    );
  };

  const getTabContent = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return renderOverview();
      case 1:
        return renderPerformanceTab();
      case 2:
        return renderAttendanceTab();
      case 3:
        return renderFeesTab();
      case 4:
        return renderResultsTab();
      case 5:
        return renderTimetableTab();
      default:
        return <div>Tab content not available</div>;
    }
  };

  if (loading || childrenLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Debug Information */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Debug Info:</strong><br/>
          User Role: {user?.role}<br/>
          User ID: {user?._id}<br/>
          Children Count: {children.length}<br/>
          Selected Child: {selectedChild || 'None'}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {!childrenLoading && children.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Your child hasn't enrolled yet</strong><br/>
                Please contact the school administration to link your children to your account or complete the enrollment process.
              </Typography>
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Child</InputLabel>
              <Select
                value={selectedChild}
                onChange={handleChildChange}
                disabled={children.length === 0}
              >
                {children.map((child) => (
                  <MenuItem key={child._id} value={child._id}>
                    {child.firstName} {child.lastName} - {child.class?.name} {child.class?.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Overview" />
              <Tab label="Performance" />
              <Tab label="Attendance" />
              <Tab label="Fees" />
              <Tab label="Results" />
              <Tab label="Timetable" />
            </Tabs>

            {getTabContent(activeTab)}
          </Paper>
        </Grid>
      </Grid>

      {/* Statistics Cards */}
      <CustomGrid container spacing={3} mb={4}>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Academic Performance"
            value={`${childStats.averagePerformance || 0}%`}
            change={childStats.performanceChange || 0}
            icon={GraduationCap}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fees Status"
            value={`$${(childStats.totalFees || 0).toLocaleString()}`}
            change={childStats.feesChange || 0}
            icon={Receipt}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance Rate"
            value={`${childStats.attendanceRate || 0}%`}
            change={childStats.attendanceChange || 0}
            icon={Clock}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Class Ranking"
            value={`#${childStats.ranking || 0}`}
            change={childStats.rankingChange || 0}
            icon={Award}
          />
        </CustomGrid>
      </CustomGrid>

      {/* Charts Section */}
      <CustomGrid container spacing={3}>
        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Performance Trends</Typography>
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
                <Line type="monotone" dataKey="performance" stroke="#8884d8" name="Academic Performance" />
                <Line type="monotone" dataKey="classAverage" stroke="#82ca9d" name="Class Average" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </CustomGrid>

        <CustomGrid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3}>Subject Performance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" name="Score" />
                <Bar dataKey="subjectAverage" fill="#82ca9d" name="Subject Average" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </CustomGrid>
      </CustomGrid>

      {/* Detailed Information */}
      <Box mt={4}>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Recent Assessments</Typography>
              {/* Add recent assessments table/list here */}
            </Paper>
          </CustomGrid>
          <CustomGrid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Attendance Details</Typography>
              {/* Add attendance details here */}
            </Paper>
          </CustomGrid>
        </CustomGrid>
      </Box>
    </Box>
  );
};

export default ParentDashboard;
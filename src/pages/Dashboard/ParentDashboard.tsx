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
  first_name: string;
  last_name: string;
  class: {
    name: string;
    section: string;
  };
}

interface Mark {
  _id: string;
  subject: string;
  score: number;
  total_score: number;
  grade: string;
  assessment_type: string;
  date: string;
  teacher: {
    first_name: string;
    last_name: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
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
  const [timeRange, setTimeRange] = useState('6');

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

  const fetchChildren = async () => {
    try {
      const response = await api.get('/parent/children');
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]._id);
      }
    } catch (err) {
      setError('Error fetching children');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async () => {
    setLoading(true);
    try {
      const [performanceRes, attendanceRes, feesRes] = await Promise.all([
        api.get(`/parent/child/${selectedChild}/performance`),
        api.get(`/parent/child/${selectedChild}/attendance`),
        api.get(`/parent/child/${selectedChild}/fees`)
      ]);

      setMarks(performanceRes.data.marks);
      setPerformanceSummary(performanceRes.data.summary);
      setAttendance(attendanceRes.data.attendance);
      setAttendanceSummary(attendanceRes.data.summary);
      setFees(feesRes.data.fees);
      setFeeSummary(feesRes.data.summary);
    } catch (err) {
      setError('Error fetching child data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildStats = async () => {
    try {
      const response = await api.get(`/parent/child/${selectedChild}/stats`);
      setChildStats(response.data);
    } catch (err) {
      setError('Error fetching child statistics');
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await api.get(`/parent/child/${selectedChild}/monthly-stats`, {
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select Child</InputLabel>
            <Select
              value={selectedChild}
              onChange={handleChildChange}
            >
              {children.map((child) => (
                <MenuItem key={child._id} value={child._id}>
                  {child.first_name} {child.last_name} - {child.class.name} {child.class.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Performance" />
              <Tab label="Attendance" />
              <Tab label="Fees" />
            </Tabs>

            {activeTab === 0 && (
              <Box p={3}>
                {performanceSummary && (
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Overall Performance</Typography>
                          <Typography variant="h4">{performanceSummary.averageScore.toFixed(1)}%</Typography>
                          <Typography color="textSecondary">
                            Total Assessments: {performanceSummary.totalAssessments}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
                          <Typography variant="h6" gutterBottom>Subject Averages</Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Subject</TableCell>
                                  <TableCell align="right">Average</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(performanceSummary.subjectAverages).map(([subject, data]) => (
                                  <TableRow key={subject}>
                                    <TableCell>{subject}</TableCell>
                                    <TableCell align="right">{data.average.toFixed(1)}%</TableCell>
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

                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Teacher</TableCell>
                        <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {marks.map((mark) => (
                        <TableRow key={mark._id}>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>{mark.score}/{mark.total_score}</TableCell>
                          <TableCell>{mark.grade}</TableCell>
                          <TableCell>{mark.assessment_type}</TableCell>
                          <TableCell>{mark.teacher.first_name} {mark.teacher.last_name}</TableCell>
                          <TableCell>{new Date(mark.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 1 && (
              <Box p={3}>
                {attendanceSummary && (
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
                          <Typography variant="h4">{attendanceSummary.presentPercentage.toFixed(1)}%</Typography>
                          <Typography color="textSecondary">
                            Present Rate
                          </Typography>
          </CardContent>
        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
                          <Typography variant="h6" gutterBottom>Attendance Summary</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Present</Typography>
                              <Typography variant="h6">{attendanceSummary.present}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Absent</Typography>
                              <Typography variant="h6">{attendanceSummary.absent}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Late</Typography>
                              <Typography variant="h6">{attendanceSummary.late}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>{record.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </TableContainer>
              </Box>
            )}

            {activeTab === 2 && (
              <Box p={3}>
                {feeSummary && (
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Fee Overview</Typography>
                          <Typography variant="h4">
                            ${feeSummary.paidFees.toLocaleString()}
                          </Typography>
                          <Typography color="textSecondary">
                            Total Paid
                          </Typography>
          </CardContent>
        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
      <Card>
        <CardContent>
                          <Typography variant="h6" gutterBottom>Fee Summary</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Total Fees</Typography>
                              <Typography variant="h6">${feeSummary.totalFees.toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Paid</Typography>
                              <Typography variant="h6">${feeSummary.paidFees.toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="textSecondary">Outstanding</Typography>
                              <Typography variant="h6">${feeSummary.outstandingFees.toLocaleString()}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}

                <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                        <TableCell>Academic Year</TableCell>
                        <TableCell>Term</TableCell>
                        <TableCell>Amount Due</TableCell>
                        <TableCell>Amount Paid</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee._id}>
                          <TableCell>{fee.academic_year}</TableCell>
                          <TableCell>{fee.term}</TableCell>
                          <TableCell>${fee.amount_due.toLocaleString()}</TableCell>
                          <TableCell>${fee.amount_paid.toLocaleString()}</TableCell>
                          <TableCell>{fee.status}</TableCell>
                          <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
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

      {/* Statistics Cards */}
      <CustomGrid container spacing={3} mb={4}>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Academic Performance"
            value={`${childStats.averagePerformance}%`}
            change={childStats.performanceChange}
            icon={GraduationCap}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fees Status"
            value={`$${childStats.totalFees.toLocaleString()}`}
            change={childStats.feesChange}
            icon={Receipt}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance Rate"
            value={`${childStats.attendanceRate}%`}
            change={childStats.attendanceChange}
            icon={Clock}
          />
        </CustomGrid>
        <CustomGrid item xs={12} sm={6} md={3}>
          <StatCard
            title="Class Ranking"
            value={`#${childStats.ranking}`}
            change={childStats.rankingChange}
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
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert, Button } from '@mui/material';
import { useAuthStore } from '../../lib/store';
import api from '../../services/api';
import { BookOpen, Clock, Award, Target, Calendar, TrendingUp } from 'lucide-react';

interface StudentStats {
  academicPerformance: {
    overallGrade: string;
    gpa: number;
    rank: number;
    totalStudentsInClass: number;
    subjectGrades: {
      [subject: string]: string;
    };
  };
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendancePercentage: number;
    lateArrivals: number;
  };
  fees: {
    totalFees: number;
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: string;
  };
  behavior: {
    conduct: string;
    disciplinaryActions: number;
    achievements: string[];
  };
}

const StudentDashboard: React.FC = () => {
  const { user, getCurrentUserId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);

  const fetchStudentStats = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }
      
      // First get user data to find the student profile
      const userResponse = await api.get(`/users/${userId}`);
      const studentId = userResponse.data.profile?._id;
      
      if (!studentId) {
        setError('Student profile not found');
        return;
      }
      
      const response = await api.get(`/students/profile/${studentId}/stats`);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching student stats:', err);
      setError(err.response?.data?.error || 'Error fetching student statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchStudentStats();
    }
  }, [user?._id]);

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

  if (!stats) {
    return (
      <Box p={3}>
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  const attendancePercentage = (stats.attendance.presentDays / stats.attendance.totalDays) * 100;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}!
      </Typography>

      <Grid container spacing={3}>
        {/* Attendance Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance
              </Typography>
              <Typography variant="h3" color="primary">
                {attendancePercentage.toFixed(1)}%
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Present: {stats.attendance.presentDays} days
                </Typography>
                <Typography variant="body2">
                  Absent: {stats.attendance.absentDays} days
                </Typography>
                <Typography variant="body2">
                  Late: {stats.attendance.lateArrivals} days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Performance Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Academic Performance
              </Typography>
              <Typography variant="h3" color="primary">
                {stats.academicPerformance.gpa.toFixed(1)}%
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Overall Grade: {stats.academicPerformance.overallGrade}
                </Typography>
                <Typography variant="body2">
                  GPA: {stats.academicPerformance.gpa.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Rank: {stats.academicPerformance.rank}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fees Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fees Status
              </Typography>
              <Typography variant="h3" color="primary">
                ${stats.fees.paidAmount}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Total Fees: ${stats.fees.totalFees}
                </Typography>
                <Typography variant="body2">
                  Pending Amount: ${stats.fees.pendingAmount}
                </Typography>
                <Typography variant="body2">
                  Payment Status: {stats.fees.paymentStatus}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Access Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Quick Access
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={4} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Calendar size={40} color="#4285F4" style={{ margin: '0 auto 16px' }} />
                <Typography variant="h6" gutterBottom>
                  Timetable
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/timetable"
                  fullWidth
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp size={40} color="#0F9D58" style={{ margin: '0 auto 16px' }} />
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/results"
                  fullWidth
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Clock size={40} color="#DB4437" style={{ margin: '0 auto 16px' }} />
                <Typography variant="h6" gutterBottom>
                  Attendance
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/attendance"
                  fullWidth
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Award size={40} color="#F4B400" style={{ margin: '0 auto 16px' }} />
                <Typography variant="h6" gutterBottom>
                  Report Cards
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/report-cards"
                  fullWidth
                >
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StudentDashboard; 
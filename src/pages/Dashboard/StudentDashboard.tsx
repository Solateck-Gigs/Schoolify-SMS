import React from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert } from '@mui/material';
import { useAuthStore } from '../../lib/store';
import { useState, useEffect } from 'react';
import api from '../../services/api';

interface StudentStats {
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  grades: {
    currentAverage: number;
    lastTermAverage: number;
    subjects: {
      name: string;
      grade: string;
      score: number;
    }[];
  };
  fees: {
    totalDue: number;
    totalPaid: number;
    nextDueDate: string;
  };
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch student statistics
        const response = await api.get(`/students/profile/${user?._id}/stats`);
        setStats(response.data);
      } catch (err: any) {
        console.error('Error fetching student stats:', err);
        setError(err.response?.data?.error || 'Failed to load student data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchStudentStats();
    }
  }, [user?._id]);

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

  const attendancePercentage = (stats.attendance.present / stats.attendance.total) * 100;

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
                  Present: {stats.attendance.present} days
                </Typography>
                <Typography variant="body2">
                  Absent: {stats.attendance.absent} days
                </Typography>
                <Typography variant="body2">
                  Late: {stats.attendance.late} days
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
                {stats.grades.currentAverage.toFixed(1)}%
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Previous Term: {stats.grades.lastTermAverage.toFixed(1)}%
                </Typography>
                {stats.grades.subjects.map((subject, index) => (
                  <Typography key={index} variant="body2">
                    {subject.name}: {subject.grade} ({subject.score}%)
                  </Typography>
                ))}
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
                ${stats.fees.totalPaid}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  Total Due: ${stats.fees.totalDue}
                </Typography>
                <Typography variant="body2">
                  Balance: ${stats.fees.totalDue - stats.fees.totalPaid}
                </Typography>
                <Typography variant="body2">
                  Next Due Date: {new Date(stats.fees.nextDueDate).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard; 
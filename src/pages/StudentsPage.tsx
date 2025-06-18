import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Avatar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuthStore } from '../lib/store';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Student {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  class?: {
    _id: string;
    name: string;
    section: string;
    academicYear: string;
  };
  parent?: {
    _id: string;
    user: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  };
  bloodType?: string;
  medicalConditions?: string[];
  createdAt: string;
}

interface NewStudentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType: string;
  classId: string;
  parentId: string;
}

const StudentsPage: React.FC = () => {
  const { user, getCurrentUserId } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentData, setNewStudentData] = useState<NewStudentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    admissionNumber: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: '',
    classId: '',
    parentId: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.error || 'Error fetching students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      // First create the user account
      const userResponse = await api.post('/auth/register', {
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        email: newStudentData.email,
        password: 'defaultPassword123', // You might want to generate this
        role: 'student',
        user_id_number: newStudentData.admissionNumber,
        phone: newStudentData.phone
      });

      // Then complete the student profile
      await api.post('/auth/complete-profile', {
        admissionNumber: newStudentData.admissionNumber,
        dateOfBirth: newStudentData.dateOfBirth,
        gender: newStudentData.gender,
        bloodType: newStudentData.bloodType,
        class: newStudentData.classId,
        parent: newStudentData.parentId
      });

      toast.success('Student added successfully!');
      setOpenAddDialog(false);
      setNewStudentData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        admissionNumber: '',
        dateOfBirth: '',
        gender: 'male',
        bloodType: '',
        classId: '',
        parentId: ''
      });
      fetchStudents();
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setOpenEditDialog(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      await api.put(`/students/profile/${editingStudent._id}`, {
        // Add update fields here
      });

      toast.success('Student updated successfully!');
      setOpenEditDialog(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      console.error('Error updating student:', err);
      toast.error(err.response?.data?.error || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/students/profile/${studentId}`);
      toast.success('Student deleted successfully!');
      fetchStudents();
    } catch (err: any) {
      console.error('Error deleting student:', err);
      toast.error(err.response?.data?.error || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.user.firstName} ${student.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Students Management
        </Typography>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Student
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search students by name, admission number, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{students.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {students.filter(s => s.gender === 'male').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Male Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {students.filter(s => s.gender === 'female').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Female Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {new Set(students.map(s => s.class?._id).filter(Boolean)).size}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Classes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Students Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Admission No.</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar 
                          src={student.user.profileImage} 
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          {student.user.firstName[0]}{student.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {student.user.firstName} {student.user.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {student.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell>
                      {student.class ? (
                        <Chip 
                          label={`${student.class.name} - ${student.class.section}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="Not Assigned" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                        size="small"
                        color={student.gender === 'male' ? 'info' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      {student.parent ? (
                        <Box>
                          <Typography variant="body2">
                            {student.parent.user.firstName} {student.parent.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {student.parent.user.phone}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not Assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.user.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditStudent(student)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        {(user?.role === 'super_admin') && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteStudent(student._id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newStudentData.firstName}
                onChange={(e) => setNewStudentData({ ...newStudentData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newStudentData.lastName}
                onChange={(e) => setNewStudentData({ ...newStudentData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newStudentData.email}
                onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newStudentData.phone}
                onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Admission Number"
                value={newStudentData.admissionNumber}
                onChange={(e) => setNewStudentData({ ...newStudentData, admissionNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={newStudentData.dateOfBirth}
                onChange={(e) => setNewStudentData({ ...newStudentData, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddStudent} variant="contained">Add Student</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          {editingStudent && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {editingStudent.user.firstName} {editingStudent.user.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Admission Number: {editingStudent.admissionNumber}
                </Typography>
              </Grid>
              {/* Add edit fields here */}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateStudent} variant="contained">Update Student</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage; 
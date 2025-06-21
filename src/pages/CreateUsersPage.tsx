import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { UserPlus, Users, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
}

export default function CreateUsersPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    user_id_number: '',
    admissionNumber: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContact: '',
    classId: '',
    subjects: [] as string[],
    assignedClasses: [] as string[]
  });

  // Only super admin should access this page
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-300" />
          <p className="text-gray-500">Access denied. This page is only available to Super Administrators.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const classesData = await apiFetch('/classes') as Class[];
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.role) {
      toast.error('Role is required');
      return false;
    }
    if (formData.role === 'student' && !formData.admissionNumber.trim()) {
      toast.error('Admission number is required for students');
      return false;
    }
    if (formData.role === 'teacher' && formData.assignedClasses.length === 0) {
      toast.error('At least one class must be assigned to teachers');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        user_id_number: formData.user_id_number,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact,
        ...(formData.role === 'student' && {
          admissionNumber: formData.admissionNumber,
          class: formData.classId
        }),
        ...(formData.role === 'teacher' && {
          subjects: formData.subjects,
          assignedClasses: formData.assignedClasses
        })
      };

      await apiFetch('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully`);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        user_id_number: '',
        admissionNumber: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        bloodGroup: '',
        emergencyContact: '',
        classId: '',
        subjects: [],
        assignedClasses: []
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: '', label: 'Select Role' },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Admin' }
  ];

  const subjectOptions = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'english', label: 'English' },
    { value: 'science', label: 'Science' },
    { value: 'social_studies', label: 'Social Studies' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'computer_science', label: 'Computer Science' }
  ];

  const bloodGroupOptions = [
    { value: '', label: 'Select Blood Group' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' }
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-5 w-5" />;
      case 'teacher': return <BookOpen className="h-5 w-5" />;
      case 'parent': return <Users className="h-5 w-5" />;
      case 'admin': return <Shield className="h-5 w-5" />;
      default: return <UserPlus className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create New User
          </h1>
          <p className="text-gray-600">
            Create new accounts for students, teachers, parents, and administrators
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {getRoleIcon(formData.role)}
            User Registration Form
          </h3>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                <Select
                  label="Role"
                  options={roleOptions}
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  fullWidth
                  required
                />
              </div>
            </div>

            {/* Security Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Security Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="User ID Number"
                  type="text"
                  value={formData.user_id_number}
                  onChange={(e) => handleInputChange('user_id_number', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
                <Select
                  label="Blood Group"
                  options={bloodGroupOptions}
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="md:col-span-2"
                />
                <Input
                  label="Emergency Contact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Student Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Admission Number"
                    type="text"
                    value={formData.admissionNumber}
                    onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                    required
                  />
                  <Select
                    label="Class"
                    options={[
                      { value: '', label: 'Select Class' },
                      ...classes.map(cls => ({
                        value: cls._id,
                        label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
                      }))
                    ]}
                    value={formData.classId}
                    onChange={(e) => handleInputChange('classId', e.target.value)}
                    fullWidth
                  />
                </div>
              </div>
            )}

            {/* Teacher-specific fields */}
            {formData.role === 'teacher' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Teacher Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subjects (Select multiple)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subjectOptions.map(subject => (
                        <label key={subject.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject.value)}
                            onChange={() => handleMultiSelectChange('subjects', subject.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Classes (Select multiple)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {classes.map(cls => (
                        <label key={cls._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.assignedClasses.includes(cls._id)}
                            onChange={() => handleMultiSelectChange('assignedClasses', cls._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {cls.name} - Grade {cls.gradeLevel} {cls.section}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  role: '',
                  user_id_number: '',
                  admissionNumber: '',
                  phone: '',
                  address: '',
                  dateOfBirth: '',
                  bloodGroup: '',
                  emergencyContact: '',
                  classId: '',
                  subjects: [],
                  assignedClasses: []
                })}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
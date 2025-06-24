import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';

interface FormData {
  userIdNumber: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  password: string;
  
  // Teacher fields
  employeeId: string;
  dateOfHire: string;
  subjectsTaught: string;
  qualifications: string;
  experienceYears: number;
  
  // Student fields
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  classId: string;
  parentId: string;
  medicalConditions: string;
  bloodType: string;
  allergies: string;
  specialNeeds: string;
  studentNotes: string;
  
  // Parent fields
  homeAddress: string;
  occupation: string;
  children: string;
}

export default function CreateUserPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    userIdNumber: '',
    role: 'teacher',
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    
    // Teacher fields
    employeeId: '',
    dateOfHire: '',
    subjectsTaught: '',
    qualifications: '',
    experienceYears: 0,
    
    // Student fields
    admissionNumber: '',
    dateOfBirth: '',
    gender: 'male',
    classId: '',
    parentId: '',
    medicalConditions: '',
    bloodType: '',
    allergies: '',
    specialNeeds: '',
    studentNotes: '',
    
    // Parent fields
    homeAddress: '',
    occupation: '',
    children: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      // Helper function to convert comma-separated string to array
      const stringToArray = (str: string) => {
        return str.split(',').map(item => item.trim()).filter(item => item);
      };

      // Prepare payload with all relevant fields based on role
      const payload: any = {
        user_id_number: formData.userIdNumber,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.contactNumber
      };

      // Add password for non-student roles
      if (formData.role !== 'student') {
        payload.password = formData.password;
      }

      // Add role-specific fields
      if (formData.role === 'teacher') {
        payload.employeeId = formData.employeeId;
        if (formData.dateOfHire) payload.dateOfHire = formData.dateOfHire;
        if (formData.subjectsTaught) payload.subjectsTaught = stringToArray(formData.subjectsTaught);
        if (formData.qualifications) payload.qualifications = stringToArray(formData.qualifications);
        if (formData.experienceYears) payload.experienceYears = formData.experienceYears;
      }

      if (formData.role === 'student') {
        payload.admissionNumber = formData.admissionNumber;
        payload.dateOfBirth = formData.dateOfBirth;
        payload.gender = formData.gender;
        if (formData.classId) payload.classId = formData.classId;
        if (formData.parentId) payload.parentId = formData.parentId;
        if (formData.medicalConditions) payload.medicalConditions = stringToArray(formData.medicalConditions);
        if (formData.bloodType) payload.bloodType = formData.bloodType;
        if (formData.allergies) payload.allergies = stringToArray(formData.allergies);
        if (formData.specialNeeds) payload.specialNeeds = stringToArray(formData.specialNeeds);
        if (formData.studentNotes) payload.studentNotes = formData.studentNotes;
      }

      if (formData.role === 'parent') {
        payload.homeAddress = formData.homeAddress;
        if (formData.occupation) payload.occupation = formData.occupation;
        if (formData.children) payload.children = stringToArray(formData.children);
      }

      console.log('Sending registration payload:', payload);

      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: payload,
      });

      console.log('Registration response:', response);
      setSuccess(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully!`);
      
      // Reset form
      setFormData({
        userIdNumber: '',
        role: 'teacher',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        password: '',
        employeeId: '',
        dateOfHire: '',
        subjectsTaught: '',
        qualifications: '',
        experienceYears: 0,
        admissionNumber: '',
        dateOfBirth: '',
        gender: 'male',
        classId: '',
        parentId: '',
        medicalConditions: '',
        bloodType: '',
        allergies: '',
        specialNeeds: '',
        studentNotes: '',
        homeAddress: '',
        occupation: '',
        children: ''
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create user.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
          Access Denied: Admins and Super Admins Only
        </div>
      </div>
    );
  }

  return (
    <div className="h-[150vh] bg-gray-50 p-[5%]">
      <div className="w-full h-full flex flex-col">
        <h1 className="text-left text-3xl font-extrabold text-blue-900 mb-6">Create New User</h1>
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                {/* Basic Information Section */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID Number</label>
                  <input
                    type="text"
                    name="userIdNumber"
                    value={formData.userIdNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="e.g., TEACH001, STU001, PAR001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                    {user.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number (optional)"
                  />
                </div>

                {/* Password field - not shown for students */}
                {formData.role !== 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={8}
                      placeholder="Enter secure password"
                    />
                  </div>
                )}

                {/* Teacher-specific fields */}
                {formData.role === 'teacher' && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                        Teacher Information
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="e.g., EMP001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Hire</label>
                      <input
                        type="date"
                        name="dateOfHire"
                        value={formData.dateOfHire}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subjects Taught</label>
                      <input
                        type="text"
                        name="subjectsTaught"
                        value={formData.subjectsTaught}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Mathematics, Physics, Chemistry (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                      <input
                        type="text"
                        name="qualifications"
                        value={formData.qualifications}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., B.Ed, M.Sc Mathematics (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="Years of teaching experience"
                      />
                    </div>
                  </>
                )}

                {/* Student-specific fields */}
                {formData.role === 'student' && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                        Student Information
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                      <input
                        type="text"
                        name="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="e.g., ADM2024001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                      <input
                        type="text"
                        name="bloodType"
                        value={formData.bloodType}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., A+, B-, O+"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                      <input
                        type="text"
                        name="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Asthma, Diabetes (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Allergies</label>
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Peanuts, Shellfish (comma separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Special Needs</label>
                      <input
                        type="text"
                        name="specialNeeds"
                        value={formData.specialNeeds}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Learning support, Physical assistance (comma separated)"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                      <textarea
                        name="studentNotes"
                        value={formData.studentNotes}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional information about the student"
                      />
                    </div>
                  </>
                )}

                {/* Parent-specific fields */}
                {formData.role === 'parent' && (
                  <>
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                        Parent Information
                      </h3>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Home Address</label>
                      <textarea
                        name="homeAddress"
                        value={formData.homeAddress}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Full home address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Parent's occupation"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 mt-auto">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    `Create ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
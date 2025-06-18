import { useState } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardContent } from '../../components/ui/Card';
import { apiFetch } from '../../lib/api';

export default function CreateUserPage() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    userIdNumber: '',
    role: 'teacher' as 'teacher' | 'parent' | 'admin' | 'super_admin' | 'student',
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    // Teacher specific fields
    subjects: [] as string[],
    classesTaught: '',
    qualification: '',
    joiningDate: '',
    // Parent specific fields
    address: '',
    occupation: '',
    // Student specific fields
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    admissionNumber: '',
    classLevel: '',
    section: '',
    // Common field
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      // Prepare payload for backend
      const payload: any = {
        user_id_number: formData.userIdNumber,
        password: formData.password,
        role: formData.role,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.contactNumber
      };

      // Add role-specific fields
      switch (formData.role) {
        case 'teacher':
          Object.assign(payload, {
            subjects: formData.subjects,
            classes_taught: formData.classesTaught
              .split(',')
              .map(str => Number(str.trim()))
              .filter(num => !isNaN(num)),
            qualification: formData.qualification,
            joining_date: formData.joiningDate
          });
          break;

        case 'parent':
          Object.assign(payload, {
            address: formData.address,
            occupation: formData.occupation
          });
          break;

        case 'student':
          Object.assign(payload, {
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            admission_number: formData.admissionNumber,
            class_level: formData.classLevel,
            section: formData.section
          });
          break;
      }

      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('User created successfully!');
      setFormData({
        userIdNumber: '',
        role: 'teacher',
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        subjects: [],
        classesTaught: '',
        qualification: '',
        joiningDate: '',
        address: '',
        occupation: '',
        dateOfBirth: '',
        gender: 'male',
        admissionNumber: '',
        classLevel: '',
        section: '',
        password: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <div>Access Denied: Admins and Super Admins Only</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h1 className="text-left text-3xl font-extrabold text-blue-900 mb-6">Create New User</h1>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Common Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID Number</label>
                  <input
                    type="text"
                    name="userIdNumber"
                    value={formData.userIdNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                {/* Teacher-specific fields */}
                {formData.role === 'teacher' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subjects Taught</label>
                      <input
                        type="text"
                        name="subjects"
                        value={formData.subjects.join(', ')}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value.split(',').map(s => s.trim()) }))}
                        placeholder="Enter subjects separated by commas"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Classes Taught</label>
                      <input
                        type="text"
                        name="classesTaught"
                        value={formData.classesTaught}
                        onChange={handleChange}
                        placeholder="Enter class numbers separated by commas"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                  </>
                )}

                {/* Parent-specific fields */}
                {formData.role === 'parent' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                  </>
                )}

                {/* Student-specific fields */}
                {formData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required={formData.role === 'student'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required={formData.role === 'student'}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                      <input
                        type="text"
                        name="admissionNumber"
                        value={formData.admissionNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required={formData.role === 'student'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class Level</label>
                      <input
                        type="text"
                        name="classLevel"
                        value={formData.classLevel}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        required={formData.role === 'student'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section</label>
                      <input
                        type="text"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              {success && <div className="text-green-600 font-semibold mt-2">{success}</div>}
              {error && <div className="text-red-600 font-semibold mt-2">{error}</div>}

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
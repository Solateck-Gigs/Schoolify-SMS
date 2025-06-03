import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { Card, CardContent } from '../../components/ui/Card'
import bcrypt from 'bcryptjs';

export default function CreateUserPage() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    userIdNumber: '',
    role: 'teacher' as 'teacher' | 'parent',
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    subjects: [] as string[],
    classesTaught: [] as number[],
    qualification: '',
    joiningDate: '',
    address: '',
    occupation: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hashedPassword = await bcrypt.hash('defaultPassword123', 10); // Generic password
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id_number: formData.userIdNumber,
          password: hashedPassword,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          contact_number: formData.contactNumber,
          profile_image: ''
        });

      if (error) throw error;

      // Add to teachers or parents table based on role
      if (formData.role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: (await supabase.from('profiles').select('id').eq('user_id_number', formData.userIdNumber).single()).data?.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            subjects: formData.subjects,
            classes_taught: formData.classesTaught,
            contact_number: formData.contactNumber,
            email: formData.email,
            qualification: formData.qualification,
            joining_date: formData.joiningDate
          });
        if (teacherError) throw teacherError;
      } else if (formData.role === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert({
            user_id: (await supabase.from('profiles').select('id').eq('user_id_number', formData.userIdNumber).single()).data?.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            contact_number: formData.contactNumber,
            email: formData.email,
            address: formData.address,
            occupation: formData.occupation
          });
        if (parentError) throw parentError;
      }

      alert('User created successfully!');
    } catch (error) {
      alert('Error creating user: ' + (error as Error).message);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access Denied: Super Admin Only</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-blue-900">Create New User</h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-4">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                >
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <div className="mb-4">
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

              <div className="mb-4">
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>

              {formData.role === 'teacher' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Subjects (comma-separated)</label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects.join(',')}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value.split(',') })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Classes Taught (comma-separated numbers)</label>
                    <input
                      type="text"
                      name="classesTaught"
                      value={formData.classesTaught.join(',')}
                      onChange={(e) => setFormData({ ...formData, classesTaught: e.target.value.split(',').map(Number) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Qualification</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>
                </>
              )}

              {formData.role === 'parent' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>

                  <div className="mb-4">
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

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Create User
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Label from './ui/Label';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface AddStudentFormProps {
  onSuccess: () => void; // Callback to run on successful student addition
  onCancel: () => void; // Callback to close the form
}

interface ParentOption {
  value: string; // profile ID
  label: string; // Parent's full name
}

interface ClassOption {
  value: string; // class ID
  label: string; // Class name with grade and section
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' |'',
    enrollmentDate: '',
    classId: '', // Changed from classLevel to classId
    parentId: '', // This will store the selected parent's profile ID
    address: '',
    contactNumber: '',
    email: '',
    profileImage: '',
    bloodType: '',
    medicalConditions: '', // Changed to string for comma-separated input
    allergies: '', // Changed to string for comma-separated input
    specialNeeds: '', // Changed to string for comma-separated input
    notes: '',
    emergencyContacts: [] as { name: string; relationship: string; phone: string }[],
  });

  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedParentName, setSelectedParentName] = useState(''); // To display selected parent's name
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await api.get('/classes');
        setClassOptions(response.data.map((cls: any) => ({
          value: cls._id,
          label: `${cls.name} - Grade ${cls.gradeLevel} ${cls.section}`
        })));
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
        setClassOptions([]);
      }
      setLoadingClasses(false);
    };
    fetchClasses();
  }, []);

  // Fetch parents when search term changes (with a debounce in a real app)
  useEffect(() => {
    const fetchParents = async () => {
      if (parentSearchTerm.length < 2) {
        setParentOptions([]);
        return;
      }
      setLoadingParents(true);
      try {
        const parents = await api.get('/parents/search', { params: { search: parentSearchTerm } });
        setParentOptions(parents.data.map((parent: any) => ({
          value: parent._id || parent.id,
          label: `${parent.firstName} ${parent.lastName}`,
        })));
      } catch (error) {
        console.error('Error fetching parents:', error);
        setParentOptions([]);
      }
      setLoadingParents(false);
    };
    const debounceTimer = setTimeout(() => {
      fetchParents();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [parentSearchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper function to convert comma-separated string to array
  const stringToArray = (str: string): string[] => {
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const handleEmergencyContactChange = (index: number, field: keyof (typeof formData.emergencyContacts)[0], value: string) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData((prev) => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', relationship: '', phone: '' }],
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
    }));
  };

  const handleParentSelect = (parentId: string, parentName: string) => {
    setFormData((prev) => ({ ...prev, parentId }));
    setSelectedParentName(parentName);
    setParentSearchTerm(''); // Clear search term after selection
    setParentOptions([]); // Clear options after selection
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
        toast.error('Please fill in all required fields.');
        return;
      }

      // Generate admission number and user ID number with timestamp to avoid duplicates
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const admissionNumber = `STU${currentYear}${timestamp}`;
      const userIdNumber = `STU${timestamp}${randomNum}`;

      // Prepare the request data
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}.${timestamp}@student.school.edu`,
        role: 'student',
        user_id_number: userIdNumber,
        phone: formData.contactNumber || undefined,
        // Student-specific fields
        admissionNumber: admissionNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        classId: formData.classId || undefined, // Now uses actual class ID
        parentId: formData.parentId || undefined,
        medicalConditions: formData.medicalConditions ? stringToArray(formData.medicalConditions) : undefined,
        bloodType: formData.bloodType || undefined,
        allergies: formData.allergies ? stringToArray(formData.allergies) : undefined,
        specialNeeds: formData.specialNeeds ? stringToArray(formData.specialNeeds) : undefined,
        studentNotes: formData.notes || undefined,
        address: formData.address || undefined,
        academicYear: '2024-2025' // Add current academic year
      };

      console.log('Sending student registration data:', requestData);

      // Create student via centralized auth registration
      const response = await api.post('/auth/register', requestData);

      console.log('Student registration response:', response.data);

      // Note: Emergency contacts functionality would need to be implemented separately
      // if required, as it's not part of the current User model
      if (formData.emergencyContacts.length > 0) {
        console.log('Emergency contacts not yet implemented in backend:', formData.emergencyContacts);
        // TODO: Implement emergency contacts if needed
      }

      toast.success('Student added successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding student:', error);
      
      // Log the specific error response
      if (error.response?.data?.error) {
        console.error('Backend error:', error.response.data.error);
        toast.error(`Failed to add student: ${error.response.data.error}`);
      } else {
        toast.error('Failed to add student');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options for gender
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Add New Student</h2>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select id="gender" name="gender" value={formData.gender} onChange={handleChange} options={genderOptions} required />
        </div>
        <div>
          <Label htmlFor="enrollmentDate">Enrollment Date</Label>
          <Input id="enrollmentDate" name="enrollmentDate" type="date" value={formData.enrollmentDate} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="classId">Class</Label>
          <Select 
            id="classId" 
            name="classId" 
            value={formData.classId} 
            onChange={handleChange} 
            options={[
              { value: '', label: loadingClasses ? 'Loading classes...' : 'Select a class' },
              ...classOptions
            ]}
            disabled={loadingClasses}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="parentSearch">Search and Select Parent</Label>
          <Input
            id="parentSearch"
            type="text"
            placeholder="Search for a parent by name..."
            value={parentSearchTerm}
            onChange={(e) => setParentSearchTerm(e.target.value)}
          />
          {loadingParents && <p className="text-sm text-gray-500 mt-1">Loading parents...</p>}
          {parentOptions.length > 0 && ( // Show options if available
            <ul className="border rounded-md mt-2 max-h-40 overflow-y-auto bg-white shadow-sm">
              {parentOptions.map(parent => (
                <li
                  key={parent.value}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleParentSelect(parent.value, parent.label)}
                >
                  {parent.label}
                </li>
              ))}
            </ul>
          )}
          {/* Display selected parent */}
          {formData.parentId && selectedParentName && (
            <p className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded">
              Selected Parent: <strong>{selectedParentName}</strong>
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="email">Email (Auto-generated)</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Will be auto-generated: firstname.lastname.####@student.school.edu"
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Student emails are automatically generated to ensure uniqueness</p>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="profileImage">Profile Image URL</Label>
          <Input id="profileImage" name="profileImage" value={formData.profileImage} onChange={handleChange} />
        </div>
      </div>

      {/* Medical Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Medical Information</h3>
        <div>
          <Label htmlFor="bloodType">Blood Type</Label>
          <Input id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} placeholder="e.g., A+, B-, O+" />
        </div>
        <div>
          <Label htmlFor="medicalConditions">Medical Conditions (Comma-separated)</Label>
          <Input 
            id="medicalConditions" 
            name="medicalConditions" 
            value={formData.medicalConditions} 
            onChange={handleChange} 
            placeholder="e.g., Asthma, Diabetes"
          />
        </div>
        <div>
          <Label htmlFor="allergies">Allergies (Comma-separated)</Label>
          <Input 
            id="allergies" 
            name="allergies" 
            value={formData.allergies} 
            onChange={handleChange} 
            placeholder="e.g., Peanuts, Shellfish"
          />
        </div>
        <div>
          <Label htmlFor="specialNeeds">Special Needs (Comma-separated)</Label>
          <Input 
            id="specialNeeds" 
            name="specialNeeds" 
            value={formData.specialNeeds} 
            onChange={handleChange} 
            placeholder="e.g., Learning support, Mobility assistance"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea 
            id="notes" 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            rows={3}
            placeholder="Additional notes about the student..."
          ></textarea>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Emergency Contacts</h3>
        <p className="text-sm text-gray-600">Note: Emergency contacts are not yet implemented in the backend but will be saved for future use.</p>
        {formData.emergencyContacts.map((contact, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md bg-gray-50">
            <div>
              <Label htmlFor={`contactName${index}`}>Name</Label>
              <Input 
                id={`contactName${index}`} 
                name={`contactName${index}`} 
                value={contact.name} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'name', e.target.value)} 
              />
            </div>
            <div>
              <Label htmlFor={`contactRelationship${index}`}>Relationship</Label>
              <Input 
                id={`contactRelationship${index}`} 
                name={`contactRelationship${index}`} 
                value={contact.relationship} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'relationship', e.target.value)} 
              />
            </div>
            <div>
              <Label htmlFor={`contactPhone${index}`}>Phone</Label>
              <Input 
                id={`contactPhone${index}`} 
                name={`contactPhone${index}`} 
                value={contact.phone} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'phone', e.target.value)} 
              />
            </div>
            <div className="md:col-span-3">
              <Button variant="outline" type="button" onClick={() => removeEmergencyContact(index)} className="text-red-600 border-red-300 hover:bg-red-50">
                Remove Contact
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addEmergencyContact}>Add Emergency Contact</Button>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Adding Student...' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
};

export default AddStudentForm; 
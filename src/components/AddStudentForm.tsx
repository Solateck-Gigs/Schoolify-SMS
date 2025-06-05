import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Label } from './ui/Label';

interface AddStudentFormProps {
  onSuccess: () => void; // Callback to run on successful student addition
  onCancel: () => void; // Callback to close the form
}

interface ParentOption {
  value: string; // profile ID
  label: string; // Parent's full name
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    enrollmentDate: '',
    classLevel: '' as number | '',
    section: '',
    parentId: '', // This will store the selected parent's profile ID
    address: '',
    contactNumber: '',
    email: '',
    profileImage: '',
    bloodType: '',
    medicalConditions: [] as string[],
    allergies: [] as string[],
    specialNeeds: [] as string[],
    notes: '',
    emergencyContacts: [] as { name: string; relationship: string; phone: string }[],
  });

  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [selectedParentName, setSelectedParentName] = useState(''); // To display selected parent's name

  // Fetch parents when search term changes (with a debounce in a real app)
  useEffect(() => {
    const fetchParents = async () => {
      if (parentSearchTerm.length < 2) {
        setParentOptions([]);
        return;
      }
      setLoadingParents(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'parent')
        .ilike('first_name', `%${parentSearchTerm}%`) // Search by first name
        .or(`last_name.ilike.%${parentSearchTerm}%`); // Or by last name

      if (error) {
        console.error('Error fetching parents:', error);
        setParentOptions([]);
      } else {
        setParentOptions(data?.map(parent => ({
          value: parent.id,
          label: `${parent.first_name} ${parent.last_name}`,
        })) || []);
      }
      setLoadingParents(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchParents();
    }, 300); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceTimer);

  }, [parentSearchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: 'medicalConditions' | 'allergies' | 'specialNeeds', value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value.split(',').map(item => item.trim()) }));
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
    try {
      // Basic validation (more robust validation can be added)
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender || !formData.enrollmentDate || !formData.classLevel || !formData.parentId) {
        alert('Please fill in all required fields.');
        return;
      }

      // Insert into students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          enrollment_date: formData.enrollmentDate,
          class_level: formData.classLevel,
          section: formData.section || null,
          parent_id: formData.parentId,
          address: formData.address || null,
          contact_number: formData.contactNumber || null,
          email: formData.email || null,
          profile_image: formData.profileImage || null,
          blood_type: formData.bloodType || null,
          medical_conditions: formData.medicalConditions.length > 0 ? formData.medicalConditions : null,
          allergies: formData.allergies.length > 0 ? formData.allergies : null,
          special_needs: formData.specialNeeds.length > 0 ? formData.specialNeeds : null,
          notes: formData.notes || null,
        }).select().single(); // Select the inserted data to get the student ID

      if (studentError) throw studentError;

      const newStudentId = studentData.id;

      // Insert emergency contacts if any
      if (formData.emergencyContacts.length > 0) {
        const contactsToInsert = formData.emergencyContacts.map(contact => ({
          student_id: newStudentId,
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
          // email and address fields from schema are not in this basic form yet
        }));
        const { error: contactsError } = await supabase
          .from('emergency_contacts')
          .insert(contactsToInsert);
        if (contactsError) throw contactsError;
      }

      alert('Student added successfully!');
      onSuccess(); // Call the success callback
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error adding student. Please try again.');
    }
  };

  // Options for gender and class level (can be fetched from database or configuration)
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const classLevelOptions = [
    { value: '', label: 'Select Class Level' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1), label: `Class ${i + 1}` }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Add New Student</h2>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select id="gender" name="gender" value={formData.gender} onChange={handleChange} options={genderOptions} required />
        </div>
        <div>
          <Label htmlFor="enrollmentDate">Enrollment Date</Label>
          <Input id="enrollmentDate" name="enrollmentDate" type="date" value={formData.enrollmentDate} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="classLevel">Class Level</Label>
          <Select id="classLevel" name="classLevel" value={formData.classLevel} onChange={handleChange} options={classLevelOptions} required />
        </div>
        <div>
          <Label htmlFor="section">Section (Optional)</Label>
          <Input id="section" name="section" value={formData.section} onChange={handleChange} />
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
          {loadingParents && <p>Loading parents...</p>}
          {parentOptions.length > 0 && ( // Show options if available
            <ul className="border rounded-md mt-2 max-h-40 overflow-y-auto">
              {parentOptions.map(parent => (
                <li
                  key={parent.value}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleParentSelect(parent.value, parent.label)}
                >
                  {parent.label}
                </li>
              ))}
            </ul>
          )}
          {/* Display selected parent */}
          {formData.parentId && selectedParentName && (
            <p className="mt-2 text-sm text-gray-700">Selected Parent: <strong>{selectedParentName}</strong></p>
          )}
        </div>
        <div>
          <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
          <Input id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="address">Address (Optional)</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="profileImage">Profile Image URL (Optional)</Label>
          <Input id="profileImage" name="profileImage" value={formData.profileImage} onChange={handleChange} />
        </div>
      </div>

      {/* Medical Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Medical Information</h3>
        <div>
          <Label htmlFor="bloodType">Blood Type (Optional)</Label>
          <Input id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="medicalConditions">Medical Conditions (Comma-separated, Optional)</Label>
          <Input id="medicalConditions" name="medicalConditions" value={formData.medicalConditions.join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange('medicalConditions', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="allergies">Allergies (Comma-separated, Optional)</Label>
          <Input id="allergies" name="allergies" value={formData.allergies.join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange('allergies', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="specialNeeds">Special Needs (Comma-separated, Optional)</Label>
          <Input id="specialNeeds" name="specialNeeds" value={formData.specialNeeds.join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleArrayChange('specialNeeds', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows={3}></textarea>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Emergency Contacts</h3>
        {formData.emergencyContacts.map((contact, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md">
            <div>
              <Label htmlFor={`contactName${index}`}>Name</Label>
              <Input id={`contactName${index}`} name={`contactName${index}`} value={contact.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'name', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor={`contactRelationship${index}`}>Relationship</Label>
              <Input id={`contactRelationship${index}`} name={`contactRelationship${index}`} value={contact.relationship} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'relationship', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor={`contactPhone${index}`}>Phone</Label>
              <Input id={`contactPhone${index}`} name={`contactPhone${index}`} value={contact.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEmergencyContactChange(index, 'phone', e.target.value)} required />
            </div>
            <div className="md:col-span-3">
              <Button variant="secondary" type="button" onClick={() => removeEmergencyContact(index)}>Remove Contact</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addEmergencyContact}>Add Emergency Contact</Button>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">Add Student</Button>
      </div>
    </form>
  );
};

export default AddStudentForm; 
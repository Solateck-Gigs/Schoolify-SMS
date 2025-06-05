import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Label } from './ui/Label';
import { toast } from 'react-hot-toast';

interface EditStudentFormProps {
  student: any; // TODO: Define a proper interface for student with all fields
  onSuccess: () => void; // Callback to run on successful student update
  onCancel: () => void; // Callback to close the form
}

interface ParentOption {
  value: string; // profile ID
  label: string; // Parent's full name
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  // email?: string; // Add if these fields are in your DB schema
  // address?: string; // Add if these fields are in your DB schema
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({ student, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: student.first_name || '',
    lastName: student.last_name || '',
    dateOfBirth: student.date_of_birth || '',
    gender: student.gender || '' as 'male' | 'female' | 'other' | '',
    enrollmentDate: student.enrollment_date || '',
    classLevel: student.class_level || '' as number | '',
    section: student.section || '',
    parentId: student.parent_id || '',
    address: student.address || '',
    contactNumber: student.contact_number || '',
    email: student.email || '',
    profileImage: student.profile_image || '',
    bloodType: student.blood_type || '',
    medicalConditions: student.medical_conditions || [] as string[],
    allergies: student.allergies || [] as string[],
    specialNeeds: student.special_needs || [] as string[],
    notes: student.notes || '',
    emergencyContacts: student.emergency_contacts || [] as EmergencyContact[],
  });

  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [selectedParentName, setSelectedParentName] = useState('');

  // Fetch parents when search term changes (with a debounce in a real app)
  useEffect(() => {
    const fetchParents = async () => {
      if (parentSearchTerm.length < 2 && !formData.parentId) {
         setParentOptions([]);
         return;
      }
      setLoadingParents(true);

      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'parent');

      if (parentSearchTerm.length >= 2) {
         query = query.ilike('first_name', `%${parentSearchTerm}%`)
                      .or(`last_name.ilike.%${parentSearchTerm}%`);
      } else if (formData.parentId) {
         query = query.eq('id', formData.parentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching parents:', error);
        setParentOptions([]);
      } else {
         if (parentSearchTerm.length >= 2) {
            setParentOptions(data?.map((parent: any) => ({ // Explicitly type parent
              value: parent.id,
              label: `${parent.first_name} ${parent.last_name}`,
            })) || []);
         } else if (formData.parentId && data && data.length > 0) {
             setSelectedParentName(`${data[0].first_name} ${data[0].last_name}`);
         }
      }
      setLoadingParents(false);
    };

    if (formData.parentId && parentSearchTerm === '') {
        fetchParents();
    } else if (parentSearchTerm.length >= 2) {
       const debounceTimer = setTimeout(() => {
         fetchParents();
       }, 300);

       return () => clearTimeout(debounceTimer);
    }


  }, [parentSearchTerm, formData.parentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: 'medicalConditions' | 'allergies' | 'specialNeeds', value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value.split(',').map(item => item.trim()) }));
  };

  const handleEmergencyContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData((prev) => ({ ...prev.emergencyContacts, [index]: updatedContacts[index] })); // Correct state update
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
      emergencyContacts: prev.emergencyContacts.filter((_: any, i: number) => i !== index), // Explicitly type parameters
    }));
  };

  const handleParentSelect = (parentId: string, parentName: string) => {
    setFormData((prev) => ({ ...prev, parentId }));
    setSelectedParentName(parentName);
    setParentSearchTerm('');
    setParentOptions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender || !formData.enrollmentDate || !formData.classLevel || !formData.parentId) {
        toast.error('Please fill in all required fields.');
        return;
      }

      // Update students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .update({
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
          specialNeeds: formData.specialNeeds.length > 0 ? formData.specialNeeds : null,
          notes: formData.notes || null,
        })
        .eq('id', student.id)
        .select().single();

      if (studentError) throw studentError;

      // Handle emergency contacts: Delete existing and re-insert all from form
      const { error: deleteContactsError } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('student_id', student.id);
      if (deleteContactsError) throw deleteContactsError;
      if (formData.emergencyContacts.length > 0) {
        const contactsToInsert = formData.emergencyContacts.map((contact: EmergencyContact) => ({
          student_id: student.id,
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
        }));
        const { error: insertContactsError } = await supabase
          .from('emergency_contacts')
          .insert(contactsToInsert);
        if (insertContactsError) throw insertContactsError;
      }

      // TODO: Implement update/delete/insert logic for achievements and extracurricular activities

      toast.success('Student updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Error updating student. Please try again.');
    }
  };

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const classLevelOptions = [
    { value: '', label: 'Select Class Level' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1), label: `Class ${i + 1}` })) as { value: number; label: string }[] // Explicitly type array elements
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Edit Student</h2>
      
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
            required 
            className="w-full"
          />
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
          {/* If a parent is already selected, display their name */}
          {formData.parentId && selectedParentName ? (
             <Input
               id="parentSearch"
               type="text"
               placeholder="Search for a parent by name..."
               value={parentSearchTerm === '' ? selectedParentName : parentSearchTerm}
               onChange={(e) => setParentSearchTerm(e.target.value)}
             />
          ) : (
             <Input
               id="parentSearch"
               type="text"
               placeholder="Search for a parent by name..."
               value={parentSearchTerm}
               onChange={(e) => setParentSearchTerm(e.target.value)}
             />
          )}

          {loadingParents && <p>Loading parents...</p>}
          {parentOptions.length > 0 && (
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
</div>
        </div>

         {/* Contact Information */}
         <div className="col-span-1 md:col-span-2">
           <h3 className="text-lg font-semibold text-gray-800 mt-4">Contact Information</h3>
         </div>
         <div>
           <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
           <Input id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
         </div>
          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
           <div className="col-span-1 md:col-span-2">
             <Label htmlFor="address">Address (Optional)</Label>
             <textarea id="address" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
           </div>

          {/* Medical Information */}
          <div className="col-span-1 md:col-span-2">
             <h3 className="text-lg font-semibold text-gray-800 mt-4">Medical Information</h3>
          </div>
          <div>
             <Label htmlFor="bloodType">Blood Type (Optional)</Label>
             <Input id="bloodType" name="bloodType" value={formData.bloodType} onChange={handleChange} />
          </div>
           <div>
             <Label htmlFor="medicalConditions">Medical Conditions (comma-separated, Optional)</Label>
             <Input id="medicalConditions" name="medicalConditions" value={formData.medicalConditions.join(',')}
               onChange={(e) => handleArrayChange('medicalConditions', e.target.value)}
             />
           </div>
            <div>
              <Label htmlFor="allergies">Allergies (comma-separated, Optional)</Label>
              <Input id="allergies" name="allergies" value={formData.allergies.join(',')}
                onChange={(e) => handleArrayChange('allergies', e.target.value)}
              />
            </div>
             <div>
               <Label htmlFor="specialNeeds">Special Needs (comma-separated, Optional)</Label>
               <Input id="specialNeeds" name="specialNeeds" value={formData.specialNeeds.join(',')}
                 onChange={(e) => handleArrayChange('specialNeeds', e.target.value)}
               />
             </div>
              <div className="col-span-1 md:col-span-2">
                 <Label htmlFor="notes">Notes (Optional)</Label>
                 <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
              </div>

              {/* Emergency Contacts */}
               <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mt-4 flex justify-between items-center">
                     Emergency Contacts
                      <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>Add Contact</Button>
                   </h3>
                    <div className="space-y-4 mt-2">
                      {formData.emergencyContacts.map((contact: EmergencyContact, index: number) => (
                         <div key={index} className="border p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`contact-name-${index}`}>Name</Label>
                              <Input id={`contact-name-${index}`} value={contact.name} onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor={`contact-relationship-${index}`}>Relationship</Label>
                                <Input id={`contact-relationship-${index}`} value={contact.relationship} onChange={(e) => handleEmergencyContactChange(index, 'relationship', e.target.value)} required />
                             </div>
                              <div>
                                 <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                                 <Input id={`contact-phone-${index}`} value={contact.phone} onChange={(e) => handleEmergencyContactChange(index, 'phone', e.target.value)} required />
                              </div>
                              <div className="md:col-span-3 text-right">
                                 <Button type="button" variant="danger" size="sm" onClick={() => removeEmergencyContact(index)}>Remove</Button>
                              </div>
                         </div>
                      ))}
                    </div>
                </div>


      <Button type="submit" variant="primary" className="w-full">Update Student</Button>
      <Button type="button" variant="outline" className="w-full mt-2" onClick={onCancel}>Cancel</Button>
    </form>
  );
};

export default EditStudentForm; 
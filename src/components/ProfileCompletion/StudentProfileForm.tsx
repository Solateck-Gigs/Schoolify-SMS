import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Select from '../ui/Select';

type StudentProfileFormProps = {
  onSubmit: (data: StudentProfileData) => void;
};

export type StudentProfileData = {
  grade: string;
  section: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
};

export default function StudentProfileForm({ onSubmit }: StudentProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentProfileData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="grade">Grade/Class</Label>
        <Select
          id="grade"
          {...register('grade', { required: 'Grade is required' })}
          className="mt-1"
          options={[
            { value: '', label: 'Select Grade' },
            { value: '1', label: 'Grade 1' },
            { value: '2', label: 'Grade 2' },
            { value: '3', label: 'Grade 3' },
            { value: '4', label: 'Grade 4' },
            { value: '5', label: 'Grade 5' },
            { value: '6', label: 'Grade 6' },
            { value: '7', label: 'Grade 7' },
            { value: '8', label: 'Grade 8' },
            { value: '9', label: 'Grade 9' },
            { value: '10', label: 'Grade 10' },
            { value: '11', label: 'Grade 11' },
            { value: '12', label: 'Grade 12' }
          ]}
        />
        {errors.grade && (
          <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="section">Section</Label>
        <Select
          id="section"
          {...register('section', { required: 'Section is required' })}
          className="mt-1"
          options={[
            { value: '', label: 'Select Section' },
            { value: 'A', label: 'Section A' },
            { value: 'B', label: 'Section B' },
            { value: 'C', label: 'Section C' },
            { value: 'D', label: 'Section D' }
          ]}
        />
        {errors.section && (
          <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...register('dateOfBirth', { required: 'Date of birth is required' })}
          className="mt-1"
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="parentName">Parent/Guardian Name</Label>
        <Input
          id="parentName"
          type="text"
          {...register('parentName', { required: 'Parent name is required' })}
          className="mt-1"
        />
        {errors.parentName && (
          <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
        <Input
          id="parentPhone"
          type="tel"
          {...register('parentPhone', { required: 'Parent phone is required' })}
          className="mt-1"
        />
        {errors.parentPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          type="text"
          {...register('address', { required: 'Address is required' })}
          className="mt-1"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="bloodGroup">Blood Group</Label>
        <Select
          id="bloodGroup"
          {...register('bloodGroup', { required: 'Blood group is required' })}
          className="mt-1"
          options={[
            { value: '', label: 'Select Blood Group' },
            { value: 'A+', label: 'A+' },
            { value: 'A-', label: 'A-' },
            { value: 'B+', label: 'B+' },
            { value: 'B-', label: 'B-' },
            { value: 'O+', label: 'O+' },
            { value: 'O-', label: 'O-' },
            { value: 'AB+', label: 'AB+' },
            { value: 'AB-', label: 'AB-' }
          ]}
        />
        {errors.bloodGroup && (
          <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          type="tel"
          {...register('emergencyContact', { required: 'Emergency contact is required' })}
          className="mt-1"
        />
        {errors.emergencyContact && (
          <p className="mt-1 text-sm text-red-600">{errors.emergencyContact.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Complete Profile
      </Button>
    </form>
  );
} 
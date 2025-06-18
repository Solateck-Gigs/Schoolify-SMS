import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Select from '../ui/Select';

type TeacherProfileFormProps = {
  onSubmit: (data: TeacherProfileData) => void;
};

export type TeacherProfileData = {
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  subjects: string[];
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
};

export default function TeacherProfileForm({ onSubmit }: TeacherProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherProfileData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="qualification">Highest Qualification</Label>
        <Select
          id="qualification"
          {...register('qualification', { required: 'Qualification is required' })}
          className="mt-1"
        >
          <option value="">Select Qualification</option>
          <option value="Bachelor's">Bachelor's Degree</option>
          <option value="Master's">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other</option>
        </Select>
        {errors.qualification && (
          <p className="mt-1 text-sm text-red-600">{errors.qualification.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="specialization">Specialization</Label>
        <Input
          id="specialization"
          type="text"
          {...register('specialization', { required: 'Specialization is required' })}
          className="mt-1"
        />
        {errors.specialization && (
          <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
        <Input
          id="yearsOfExperience"
          type="number"
          {...register('yearsOfExperience', {
            required: 'Years of experience is required',
            min: { value: 0, message: 'Years must be 0 or greater' },
          })}
          className="mt-1"
        />
        {errors.yearsOfExperience && (
          <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>
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
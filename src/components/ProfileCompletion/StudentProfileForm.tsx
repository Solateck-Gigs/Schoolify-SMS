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
        >
          <option value="">Select Grade</option>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
          <option value="4">Grade 4</option>
          <option value="5">Grade 5</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
          <option value="9">Grade 9</option>
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </Select>
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
        >
          <option value="">Select Section</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
          <option value="D">Section D</option>
        </Select>
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
        >
          <option value="">Select Blood Group</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
        </Select>
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
import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Select from '../ui/Select';

type ParentProfileFormProps = {
  onSubmit: (data: ParentProfileData) => void;
};

export type ParentProfileData = {
  occupation: string;
  relationship: string;
  alternatePhone: string;
  address: string;
  workAddress: string;
  emergencyContact: string;
  studentIds: string[];
};

export default function ParentProfileForm({ onSubmit }: ParentProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentProfileData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="relationship">Relationship to Student</Label>
        <Select
          id="relationship"
          {...register('relationship', { required: 'Relationship is required' })}
          className="mt-1"
        >
          <option value="">Select Relationship</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Guardian">Guardian</option>
          <option value="Other">Other</option>
        </Select>
        {errors.relationship && (
          <p className="mt-1 text-sm text-red-600">{errors.relationship.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          type="text"
          {...register('occupation', { required: 'Occupation is required' })}
          className="mt-1"
        />
        {errors.occupation && (
          <p className="mt-1 text-sm text-red-600">{errors.occupation.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="alternatePhone">Alternate Phone Number</Label>
        <Input
          id="alternatePhone"
          type="tel"
          {...register('alternatePhone', { required: 'Alternate phone is required' })}
          className="mt-1"
        />
        {errors.alternatePhone && (
          <p className="mt-1 text-sm text-red-600">{errors.alternatePhone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Residential Address</Label>
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
        <Label htmlFor="workAddress">Work Address</Label>
        <Input
          id="workAddress"
          type="text"
          {...register('workAddress', { required: 'Work address is required' })}
          className="mt-1"
        />
        {errors.workAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.workAddress.message}</p>
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
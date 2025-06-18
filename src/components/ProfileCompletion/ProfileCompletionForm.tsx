import React, { useState } from 'react';
import { useAuthStore } from '../../lib/store';
import TeacherProfileForm from './TeacherProfileForm';
import StudentProfileForm from './StudentProfileForm';
import ParentProfileForm from './ParentProfileForm';
import { Card, CardContent } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

export default function ProfileCompletionForm() {
  const { user, completeProfile, isLoading, error } = useAuthStore();
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleSubmit = async (formData: any) => {
    try {
      await completeProfile(formData);
      setSuccess('Profile completed successfully!');
      // Redirect to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide additional information required for your role
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                {user.role === 'teacher' && (
                  <TeacherProfileForm onSubmit={handleSubmit} />
                )}
                {user.role === 'student' && (
                  <StudentProfileForm onSubmit={handleSubmit} />
                )}
                {user.role === 'parent' && (
                  <ParentProfileForm onSubmit={handleSubmit} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
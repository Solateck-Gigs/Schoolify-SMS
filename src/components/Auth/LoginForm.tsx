import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import { useAuthStore } from '../../lib/store';

type LoginFormData = {
  user_id_number: string;
  password: string;
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, error, user, isLoading } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.user_id_number, data.password);
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="user_id_number">User ID</Label>
        <Input
          id="user_id_number"
          type="text"
          {...register('user_id_number', { required: 'User ID is required' })}
          className="mt-1"
          placeholder="Enter your user ID"
        />
        {errors.user_id_number && (
          <p className="mt-1 text-sm text-red-600">{errors.user_id_number.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password', { required: 'Password is required' })}
          className="mt-1"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full bg-green-400 text-white hover:bg-blue-800"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
} 
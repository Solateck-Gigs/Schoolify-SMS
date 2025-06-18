import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { BrowserRouter } from 'react-router-dom';
import FeesPage from '../pages/Fee/FeesPage';
import { useAuthStore } from '../lib/store';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('FeesPage', () => {
  beforeEach(() => {
    // Set authenticated user
    useAuthStore.setState({
      user: {
        id: '1',
        role: 'admin',
        first_name: 'Test',
        last_name: 'User'
      },
      isLoading: false,
      error: null
    });
    localStorage.setItem('token', 'fake-token');
  });

  it('should fetch and display fees', async () => {
    render(<FeesPage />, { wrapper: Wrapper });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    server.use(
      http.get('http://localhost:5000/api/fees', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<FeesPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch fees/i)).toBeInTheDocument();
    });
  });

  it('should allow recording payments', async () => {
    // Mock successful payment
    server.use(
      http.post('http://localhost:5000/api/fees/:id/payments', () => {
        return HttpResponse.json({
          id: '1',
          student: {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            class: { name: '1A', section: 'A' },
          },
          amount: 1000,
          paid_amount: 1000,
          due_date: '2024-03-31',
          status: 'paid',
        });
      })
    );

    render(<FeesPage />, { wrapper: Wrapper });

    // Wait for the Record Payment button to be available
    const paymentButton = await screen.findByText('Record Payment');
    expect(paymentButton).toBeInTheDocument();

    // Test payment recording functionality
    // Note: This would need to be expanded based on your actual payment flow
  });
}); 
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../pages/Auth/AuthPage';
import { useAuthStore } from '../lib/store';

// Create a wrapper component that provides necessary context
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('Authentication', () => {
  beforeEach(() => {
    // Clear auth store before each test
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    // Clear localStorage
    localStorage.clear();
  });

  it('should render login form', async () => {
    render(<AuthPage />, { wrapper: Wrapper });
    
    expect(await screen.findByLabelText(/ID Number/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Password/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    render(<AuthPage />, { wrapper: Wrapper });
    
    const idInput = await screen.findByLabelText(/ID Number/i);
    const passwordInput = await screen.findByLabelText(/Password/i);
    const submitButton = await screen.findByRole('button', { name: /login/i });

    await user.type(idInput, 'admin123');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      const store = useAuthStore.getState();
      expect(store.user).toBeTruthy();
      expect(store.user?.role).toBe('admin');
      expect(localStorage.getItem('token')).toBe('fake-token');
    });
  });

  it('should persist authentication after refresh', async () => {
    // Simulate existing token
    localStorage.setItem('token', 'fake-token');
    
    render(<AuthPage />, { wrapper: Wrapper });

    await waitFor(() => {
      const store = useAuthStore.getState();
      expect(store.user).toBeTruthy();
      expect(store.user?.role).toBe('admin');
    });
  });

  it('should handle logout', async () => {
    // Set initial authenticated state
    localStorage.setItem('token', 'fake-token');
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

    const { logout } = useAuthStore.getState();
    logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
}); 
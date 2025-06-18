import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Define handlers for API mocking
export const handlers = [
  // Auth endpoints
  http.post('http://localhost:5000/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
      },
      token: 'fake-token',
    });
  }),
  
  http.get('http://localhost:5000/api/auth/me', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
      },
    });
  }),

  // Students endpoints
  http.get('http://localhost:5000/api/students', () => {
    return HttpResponse.json([
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        class: { name: '1A', section: 'A' },
      },
    ]);
  }),

  // Fees endpoints
  http.get('http://localhost:5000/api/fees', () => {
    return HttpResponse.json([
      {
        id: '1',
        student: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          class: { name: '1A', section: 'A' },
        },
        amount: 1000,
        paid_amount: 500,
        due_date: '2024-03-31',
        status: 'pending',
      },
    ]);
  }),

  // Teachers endpoints
  http.get('http://localhost:5000/api/teachers', () => {
    return HttpResponse.json([
      {
        id: '1',
        first_name: 'Jane',
        last_name: 'Smith',
        subject: 'Mathematics',
      },
    ]);
  }),
];

export const server = setupServer(...handlers);

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after the tests are finished.
afterAll(() => server.close()); 
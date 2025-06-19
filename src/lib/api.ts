import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiFetch = async <T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> => {
  const { method = 'GET', body, headers = {} } = options;

  // Add Content-Type header for JSON requests
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await api.request({
      url: endpoint,
      method,
      data: body,
      headers: defaultHeaders,
    });

    return response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.response) {
      // Backend returned an error response
      const errorMessage = error.response.data?.error || error.response.data?.message || 'An error occurred';
      const errorObj = new Error(errorMessage);
      (errorObj as any).response = error.response;
      throw errorObj;
    }
    throw error;
  }
};

export default api; 
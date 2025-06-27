import axios from 'axios';

// Get the base URL from environment variables or use a default
// Remove the '/api' suffix since the server routes already include it
const baseURL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.endsWith('/api') 
    ? import.meta.env.VITE_API_URL.slice(0, -4) // Remove '/api' from the end
    : import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api';

// Log the base URL for debugging
console.log('API Base URL:', baseURL);

const api = axios.create({
  baseURL,
});

// Add request interceptor to attach token and log requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log the full URL being requested
  console.log('Request URL:', `${config.baseURL}/${config.url}`);
  
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

  const fullUrl = endpoint.startsWith('/') ? `api${endpoint}` : `api/${endpoint}`;
  console.log('Making API request to:', fullUrl);

  try {
    const response = await api.request({
      url: fullUrl,
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
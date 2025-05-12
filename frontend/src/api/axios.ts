import axios from 'axios';

// Include /api in the base URL so endpoints don't need to repeat it
// IMPORTANT: All API calls should use paths like '/user/profile' NOT '/api/user/profile'
const API_URL = 'http://localhost:5003/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const storedAuth = localStorage.getItem('auth-storage');
    let token = null;
    
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        token = parsedAuth.state?.token;
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Log successful requests for debugging
    console.log(`API Success [${response.config.method?.toUpperCase()}] ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    // Enhanced error logging with more details
    console.error(`API Error: ${error.message}`, {
      config: error.config,
      method: error.config?.method?.toUpperCase(),
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers
    });
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      // Clear localStorage and redirect to login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    
    // Handle 404 errors with specific message
    if (error.response?.status === 404) {
      console.error(`API Endpoint not found: ${error.config?.baseURL}${error.config?.url}`);
      error.message = `API Endpoint not found: ${error.config?.baseURL}${error.config?.url}`;
    }
    
    return Promise.reject(error);
  }
);

export default api; 
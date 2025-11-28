import axios from 'axios';

// Create an Axios instance
const apiService = axios.create({
  // Replace with your actual backend URL
  baseURL: 'http://localhost:5000/api/v1', // Example: use environment variable
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a request interceptor to include the token
// This assumes you store your token in local storage or a Redux store
apiService.interceptors.request.use(
  (config) => {
    // Example: Get token from Redux store
    // const token = store.getState().auth.token; 
    // For now, let's assume it's not needed for profile creation/update initially
    // if (token) {
    //   config.headers['x-auth-token'] = token;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific errors like 401 (Unauthorized), 404 (Not Found), etc.
    if (error.response && error.response.status === 401) {
      // Redirect to login or dispatch logout action
      console.error('Unauthorized access - Redirecting to login...');
      // Example: store.dispatch(logout());
    } else if (error.response && error.response.status === 404) {
       console.error('Resource not found');
    }
    // For other errors, you might want to show a general error message
    return Promise.reject(error);
  }
);

export default apiService;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api/v1'; // Default for Android emulator

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            // Add Authorization header if token exists
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Do something with request error
        return Promise.reject(error);
    }
);

// Optional: Add a response interceptor for handling global errors or token expiration
api.interceptors.response.use(
    (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Handle non-2xx responses
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error Response:', error.response.data);
            // You could dispatch an action here to show a global error message
            // or handle specific errors like 401 Unauthorized
            if (error.response.status === 401) {
                // Handle unauthorized access, e.g., redirect to login
                // You might need to navigate outside the component or use a global state/event
                console.error('Unauthorized access - redirecting to login');
                // Example: dispatch(logout()); navigate('/login');
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('API Error Request:', error.request);
            // This might indicate network issues or the server being down
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;

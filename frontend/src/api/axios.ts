import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Axios error:', error.response?.status, error.config?.url);

        if (error.response?.status === 401) {
            // Only redirect if it's not a login/signup request
            const isAuthRequest = error.config?.url?.includes('/login') || error.config?.url?.includes('/signup');

            if (!isAuthRequest) {
                // Token expired or invalid
                console.error('Unauthorized request detected:', error.config?.url);
                console.error('Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');

                // Don't auto-redirect, let components handle it
                // Uncomment below if you want auto-redirect
                // localStorage.removeItem('token');
                // localStorage.removeItem('user');
                // localStorage.removeItem('credits');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
export { API_BASE_URL };

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isSignup ? '/signup' : '/login';
            console.log('Attempting to:', endpoint, 'with username:', username);
            const response = await axios.post(endpoint, {
                username,
                password,
            });

            console.log('Response received:', response.data);
            const { token, user, credits } = response.data;
            login(token, user, credits);
            console.log('Navigating to dashboard...');
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login/Signup error:', err);
            const errorMessage = err.response?.data?.error || err.response?.data || err.message || 'An error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-2xl w-96">
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-gray-100">
                    Trading Dashboard
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                    {isSignup ? 'Create your account' : 'Sign in to continue'}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    {isSignup && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-2 rounded-md text-sm">
                            You'll receive $2,000 in credits to start trading!
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-semibold"
                    >
                        {loading ? (isSignup ? 'Creating Account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setError('');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

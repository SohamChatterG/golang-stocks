import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrdersTable from '../components/OrdersTable';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NavButton from '../components/NavButton';

const Orders: React.FC = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { dark, toggle } = useTheme();

    // Removed unused handleLogout (using inline logout in button)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-x-hidden">
            {/* Header */}
            <header className="bg-white/90 dark:bg-slate-900/80 backdrop-blur shadow-sm">
                <div className="main-container py-3 sm:py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Order History</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Signed in as <span className="font-semibold">{user}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button
                                onClick={toggle}
                                className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                            >
                                {dark ? '☀️' : '🌙'}
                            </button>
                            <NavButton to="/dashboard" variant="secondary">
                                Dashboard
                            </NavButton>
                            <NavButton to="/portfolio" variant="secondary">
                                Portfolio
                            </NavButton>
                            <NavButton to="/login" variant="danger" onClick={() => { logout(); navigate('/login'); }}>
                                Logout
                            </NavButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="main-container py-8">
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">All Orders</h2>
                        <button
                            onClick={() => setRefreshTrigger((x) => x + 1)}
                            className="px-4 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                        >
                            Refresh
                        </button>
                    </div>
                    <OrdersTable refreshTrigger={refreshTrigger} />
                </div>
            </main>
        </div>
    );
};

export default Orders;

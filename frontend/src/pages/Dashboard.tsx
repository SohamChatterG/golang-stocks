import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LivePricesTable from '../components/LivePricesTable';
import StockDetail from '../components/StockDetail';
import { useTheme } from '../context/ThemeContext';
import NavButton from '../components/NavButton';

const Dashboard: React.FC = () => {
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user, credits, logout } = useAuth();
    const { dark, toggle } = useTheme();

    const handleOrderCreated = () => {
        // No-op on dashboard; orders are now on a separate Orders page
    };

    const handleStockClick = (symbol: string) => {
        setSelectedStock(symbol);
    };

    const handleCloseDetail = () => {
        setSelectedStock(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
            {/* Header */}
            <header className="bg-white/90 dark:bg-slate-900/80 backdrop-blur shadow-sm">
                <div className="main-container py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="page-title">Trading Dashboard</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Credits: <span className="font-bold text-green-600 dark:text-emerald-400">${credits.toFixed(2)}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-300">Welcome, <strong>{user}</strong></span>
                            <button
                                onClick={toggle}
                                className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                                title="Toggle theme"
                            >
                                {dark ? '☀️' : '🌙'}
                            </button>
                            <NavButton to="/portfolio" variant="secondary">
                                Portfolio
                            </NavButton>
                            <NavButton to="/orders" variant="secondary">
                                Orders
                            </NavButton>
                            <NavButton to="/login" variant="danger" onClick={handleLogout}>
                                Logout
                            </NavButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-container py-8">
                <div className="space-y-8">
                    {/* Live Prices */}
                    <LivePricesTable onStockClick={handleStockClick} />

                    {/* Orders Table moved to Orders page */}
                </div>
            </main>

            {/* Stock Detail Modal */}
            {selectedStock && (
                <StockDetail
                    symbol={selectedStock}
                    onClose={handleCloseDetail}
                    onOrderCreated={handleOrderCreated}
                />
            )}
        </div>
    );
};

export default Dashboard;

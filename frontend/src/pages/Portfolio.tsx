import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StockPrice } from '../types';
import StockDetail from '../components/StockDetail';
import { useTheme } from '../context/ThemeContext';
import NavButton from '../components/NavButton';

interface PortfolioItem {
    symbol: string;
    quantity: number;
    currentPrice: number;
    totalValue: number;
    name: string;
    logo: string;
    change: number;
    avgPrice?: number;
}

const Portfolio: React.FC = () => {
    const { user, credits, logout, updateCredits } = useAuth();
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState(0);
    const [investedTotal, setInvestedTotal] = useState(0);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [selectedSide, setSelectedSide] = useState<'buy' | 'sell'>('buy');

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            // Fetch account to get portfolio
            const accountResponse = await axios.get('/api/account');
            const portfolioData = accountResponse.data.portfolio || {};
            // Keep AuthContext credits in sync with server
            if (typeof accountResponse.data?.credits === 'number') {
                updateCredits(accountResponse.data.credits);
            }

            // Fetch current stock prices
            const stocksResponse = await axios.get('/prices');
            const stocks: StockPrice[] = stocksResponse.data;

            // Fetch orders to compute average buy price per symbol (done orders only)
            const ordersResponse = await axios.get('/api/orders');
            const orders = (ordersResponse.data || []) as Array<{ symbol: string; side: string; status: string; price: number; quantity: number }>;

            // Build portfolio items
            const items: PortfolioItem[] = [];
            let total = 0;
            let invested = 0;

            for (const symbol in portfolioData) {
                const quantity = portfolioData[symbol];
                if (quantity > 0) {
                    const stock = stocks.find(s => s.symbol === symbol);
                    if (stock) {
                        const value = stock.price * quantity;
                        total += value;

                        // Weighted average of completed buy orders
                        let buyQty = 0;
                        let buyCost = 0;
                        orders.filter(o => o.symbol === symbol && o.status === 'done' && o.side === 'buy')
                            .forEach(o => { buyQty += o.quantity; buyCost += o.quantity * o.price; });
                        const avgPrice = buyQty > 0 ? buyCost / buyQty : undefined;
                        if (avgPrice !== undefined) {
                            invested += avgPrice * quantity;
                        }
                        items.push({
                            symbol: stock.symbol,
                            quantity,
                            currentPrice: stock.price,
                            totalValue: value,
                            name: stock.name,
                            logo: stock.logo,
                            change: stock.change,
                            avgPrice: avgPrice,
                        });
                    }
                }
            }

            // Sort by total value descending
            items.sort((a, b) => b.totalValue - a.totalValue);

            setPortfolio(items);
            setTotalValue(total);
            setInvestedTotal(invested);
        } catch (err) {
            console.error('Error fetching portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-600">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    const netWorth = credits + totalValue;

    // Removed unused handleLogout (direct inline logout used in button)

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="bg-white/90 dark:bg-slate-900/80 backdrop-blur shadow-sm">
                <div className="main-container py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="page-title">Portfolio</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Welcome back, <span className="font-semibold">{user}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggle}
                                className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                            >
                                {dark ? '☀️' : '🌙'}
                            </button>
                            <NavButton to="/dashboard" variant="secondary">
                                Dashboard
                            </NavButton>
                            <NavButton to="/orders" variant="secondary">
                                Orders
                            </NavButton>
                            <NavButton to="/login" variant="danger" onClick={() => { logout(); navigate('/login'); }}>
                                Logout
                            </NavButton>
                        </div>
                    </div>
                </div>
            </header>
            <div className="main-container py-8">
                {/* Summary Cards & Analytics */}
                {(() => {
                    const profit = totalValue - investedTotal;
                    const pct = investedTotal > 0 ? (profit / investedTotal) * 100 : 0;
                    const profitPositive = profit >= 0;
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                            {/* Credits */}
                            <div className="stat-card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Available Credits</h3>
                                    <span className="text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded">Cash</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${credits.toFixed(2)}</p>
                            </div>
                            {/* Holdings Value */}
                            <div className="stat-card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Holdings Value</h3>
                                    <span className="text-xs font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-1 rounded">Live</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${totalValue.toFixed(2)}</p>
                            </div>
                            {/* Invested Amount */}
                            <div className="stat-card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Invested Amount</h3>
                                    <span className="text-xs font-medium bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">Cost</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${investedTotal.toFixed(2)}</p>
                            </div>
                            {/* Unrealized P/L */}
                            <div className="stat-card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Unrealized P/L</h3>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${profitPositive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {profitPositive ? 'Gain' : 'Loss'}
                                    </span>
                                </div>
                                <p className={`text-3xl font-bold ${profitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {profitPositive ? '+' : ''}{profit.toFixed(2)}
                                </p>
                                <p className={`text-sm mt-1 ${profitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {profitPositive ? '+' : ''}{pct.toFixed(2)}%
                                </p>
                            </div>
                            {/* Net Worth */}
                            <div className="stat-card">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Net Worth</h3>
                                    <span className="text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">Total</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${netWorth.toFixed(2)}</p>
                            </div>
                        </div>
                    );
                })()}

                {/* Holdings Table */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Holdings</h2>
                    </div>

                    {portfolio.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2 font-semibold">No holdings yet</p>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Start trading to build your portfolio!</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-primary inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Trade Now
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Avg Buy Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Total Value
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                    {portfolio.map((item) => (
                                        <tr key={item.symbol} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        src={item.logo}
                                                        alt={item.symbol}
                                                        className="w-10 h-10 rounded-full mr-3"
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.symbol}&background=random`;
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.symbol}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</div>
                                            </td>
                                            {/* Current Price column removed per spec */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.avgPrice !== undefined ? (
                                                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">${item.avgPrice.toFixed(2)}</div>
                                                ) : (
                                                    <div className="text-sm text-gray-400 dark:text-gray-500">—</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">${item.totalValue.toFixed(2)}</div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedSymbol(item.symbol); setSelectedSide('buy'); }}
                                                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs font-semibold"
                                                    >Buy</button>
                                                    <button
                                                        onClick={() => { setSelectedSymbol(item.symbol); setSelectedSide('sell'); }}
                                                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
                                                    >Sell</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {selectedSymbol && (
                    <StockDetail
                        symbol={selectedSymbol}
                        defaultSide={selectedSide}
                        onClose={() => { setSelectedSymbol(null); fetchPortfolio(); }}
                        onOrderCreated={() => { fetchPortfolio(); }}
                    />
                )}
            </div>
        </div>
    );
};

export default Portfolio;

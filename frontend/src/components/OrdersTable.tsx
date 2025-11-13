import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Order, StockPrice } from '../types';

interface OrdersTableProps {
    refreshTrigger?: number;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ refreshTrigger }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stocks, setStocks] = useState<Record<string, StockPrice>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [filterSymbol, setFilterSymbol] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const [ordersRes, pricesRes] = await Promise.all([
                axios.get('/api/orders'),
                axios.get('/prices')
            ]);
            setOrders(ordersRes.data || []);

            // Create a map of stocks for quick lookup
            const stockMap: Record<string, StockPrice> = {};
            (pricesRes.data || []).forEach((stock: StockPrice) => {
                stockMap[stock.symbol] = stock;
            });
            setStocks(stockMap);
        } catch (err: any) {
            setError('Failed to fetch orders');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [refreshTrigger]);

    const getSideBadgeColor = (side: string): string => {
        return side === 'buy'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-red-100 text-red-800 border border-red-300';
    };

    const getStatusBadgeColor = (status: string): string => {
        return status === 'done'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Get unique symbols and dates for filters
    const symbols = Array.from(new Set(orders.map(o => o.symbol)));
    const dates = Array.from(new Set(orders.map(o => formatDate(o.createdAt))));

    // Apply filters
    const filteredOrders = orders.filter(order => {
        if (filterSymbol !== 'all' && order.symbol !== filterSymbol) return false;
        if (filterStatus !== 'all' && order.status !== filterStatus) return false;
        if (filterDate !== 'all' && formatDate(order.createdAt) !== filterDate) return false;
        return true;
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Stock</label>
                    <select
                        value={filterSymbol}
                        onChange={(e) => setFilterSymbol(e.target.value)}
                        className="select-custom"
                    >
                        <option value="all">All Stocks</option>
                        {symbols.map(symbol => (
                            <option key={symbol} value={symbol}>{symbol}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Date</label>
                    <select
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="select-custom"
                    >
                        <option value="all">All Dates</option>
                        {dates.map(date => (
                            <option key={date} value={date}>{date}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="select-custom"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-slate-800">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Side
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Date
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-2 font-semibold">No orders found</p>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        {filterSymbol !== 'all' || filterDate !== 'all' || filterStatus !== 'all'
                                            ? 'Try adjusting your filters'
                                            : 'Start trading to see your order history'}
                                    </p>
                                    {filterSymbol === 'all' && filterDate === 'all' && filterStatus === 'all' && (
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="btn btn-primary inline-flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            Go to Dashboard
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {stocks[order.symbol] && (
                                                <img
                                                    src={stocks[order.symbol].logo}
                                                    alt={order.symbol}
                                                    className="w-8 h-8 rounded-full"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${order.symbol}&background=random`;
                                                    }}
                                                />
                                            )}
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{order.symbol}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getSideBadgeColor(
                                                order.side
                                            )}`}
                                        >
                                            {order.side}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${order.orderType === 'market'
                                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                : 'bg-purple-100 text-purple-800 border border-purple-300'
                                                }`}
                                        >
                                            {order.orderType || 'limit'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-100">
                                        {order.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-100">
                                        ${order.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!loading && filteredOrders.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                        Showing {filteredOrders.length} of {orders.length} orders
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTable;

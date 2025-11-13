import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { StockPrice } from '../types';
import PriceChart from './PriceChart';
import { useAuth } from '../context/AuthContext';

interface StockDetailProps {
    symbol: string;
    onClose: () => void;
    onOrderCreated: () => void;
    defaultSide?: 'buy' | 'sell';
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol, onClose, onOrderCreated, defaultSide }) => {
    const { updateCredits } = useAuth();
    const [stock, setStock] = useState<StockPrice | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);
    const [orderForm, setOrderForm] = useState({
        side: (defaultSide || 'buy') as 'buy' | 'sell',
        orderType: 'market' as 'market' | 'limit',
        quantity: 1,
        price: 0,
    });
    const [orderLoading, setOrderLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

    useEffect(() => {
        fetchStockDetail();
        // Prevent background scroll when modal is open
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [symbol]);

    const fetchStockDetail = async () => {
        try {
            const response = await axios.get(`/stocks/${symbol}`);
            setStock(response.data);
            setOrderForm(prev => ({ ...prev, price: response.data.price }));
        } catch (err) {
            console.error('Error fetching stock detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setOrderLoading(true);

        try {
            // Build payload and omit price for market orders
            const payload: any = {
                symbol,
                side: orderForm.side,
                orderType: orderForm.orderType,
                quantity: orderForm.quantity,
            };
            if (orderForm.orderType === 'limit') {
                payload.price = Math.round(orderForm.price * 100) / 100;
            }
            await axios.post('/api/orders', payload);
            setMessage({ type: 'success', text: 'Order placed successfully!' });
            // Refresh credits from account
            try {
                const acc = await axios.get('/api/account');
                if (typeof acc.data?.credits === 'number') {
                    updateCredits(acc.data.credits);
                }
            } catch (e) {
                // Non-fatal if account refresh fails
                console.warn('Failed to refresh account after order');
            }
            onOrderCreated();
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to place order'
            });
        } finally {
            setOrderLoading(false);
        }
    };

    if (loading || !stock) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-900 rounded-lg p-8">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${isMaximized ? 'w-full h-full' : 'max-w-2xl w-full max-h-[90vh]'
                }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={stock.logo}
                                alt={stock.symbol}
                                className="w-12 h-12 rounded-full bg-white p-1"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${stock.symbol}&background=random`;
                                }}
                            />
                            <div>
                                <h2 className="text-2xl font-bold">{stock.symbol}</h2>
                                <p className="text-sm text-blue-100">{stock.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors"
                                title={isMaximized ? 'Minimize' : 'Maximize'}
                            >
                                {isMaximized ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Current Price */}
                    <div className="mt-3">
                        <div className="text-3xl font-bold">${stock.price.toFixed(2)}</div>
                        <div className={`text-sm ${stock.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </div>
                    </div>
                </div>

                <div className={`overflow-y-auto ${isMaximized ? 'h-[calc(100%-180px)]' : 'max-h-[calc(90vh-180px)]'}`}>
                    <div className="p-6 space-y-6">
                        {/* Message */}
                        {message.text && (
                            <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Chart */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Price Chart</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Last {stock.priceHistory?.length || 0} ticks</span>
                            </div>
                            <PriceChart
                                data={stock.priceHistory || []}
                                height={isMaximized ? 300 : 200}
                                color={
                                    stock.priceHistory && stock.priceHistory.length > 0
                                        ? stock.priceHistory[0] > stock.price
                                            ? '#dc2626' // red - loss (first price was higher)
                                            : '#16a34a' // green - gain (current price is higher or equal)
                                        : '#3b82f6' // default blue
                                }
                                showGradient
                                axes
                                tooltip
                            />
                        </div>

                        {/* Order Form */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Place Order</h3>
                            <form onSubmit={handleOrderSubmit}>
                                {/* Buy/Sell Toggle */}
                                <div className="flex gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setOrderForm({ ...orderForm, side: 'buy' })}
                                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${orderForm.side === 'buy'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderForm({ ...orderForm, side: 'sell' })}
                                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${orderForm.side === 'sell'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        Sell
                                    </button>
                                </div>

                                {/* Market/Limit Toggle */}
                                <div className="flex gap-4 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setOrderForm({ ...orderForm, orderType: 'market' })}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${orderForm.orderType === 'market'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        Market Order
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderForm({ ...orderForm, orderType: 'limit' })}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${orderForm.orderType === 'limit'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        Limit Order
                                    </button>
                                </div>

                                {orderForm.orderType === 'market' && (
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                            <strong>Market Order:</strong> Will execute immediately at current market price (${stock.price.toFixed(2)})
                                        </p>
                                    </div>
                                )}

                                {orderForm.orderType === 'limit' && (
                                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                        <p className="text-sm text-purple-800 dark:text-purple-300">
                                            <strong>Limit Order:</strong> Will execute when price reaches your set price
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            step={1}
                                            value={orderForm.quantity}
                                            onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) })}
                                            required
                                            className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none"
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {orderForm.orderType === 'market' ? 'Price (Current)' : 'Limit Price'}
                                        </label>
                                        {orderForm.orderType === 'market' ? (
                                            <input
                                                type="text"
                                                value={stock.price.toFixed(2)}
                                                readOnly
                                                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={orderForm.price}
                                                onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) })}
                                                required
                                                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter limit price"
                                            />
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={orderLoading}
                                    className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${orderLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : orderForm.side === 'buy'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {orderLoading ? 'Placing Order...' : `Place ${orderForm.side.toUpperCase()} Order`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetail;

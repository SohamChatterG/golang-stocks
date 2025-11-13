import React, { useState } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface OrderFormProps {
    onOrderCreated?: () => void;
}

interface OrderFormData {
    symbol: string;
    side: string;
    orderType: 'market' | 'limit';
    quantity: number;
    price?: number; // only for limit orders
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderCreated }) => {
    const { updateCredits } = useAuth();
    const [formData, setFormData] = useState<OrderFormData>({
        symbol: 'AAPL',
        side: 'buy',
        orderType: 'market',
        quantity: 1,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

    const stocks = ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            const payload: any = {
                symbol: formData.symbol,
                side: formData.side,
                orderType: formData.orderType,
                quantity: formData.quantity,
            };
            if (formData.orderType === 'limit') {
                payload.price = Math.round((formData.price || 0) * 100) / 100;
            }
            await axios.post('/api/orders', payload);
            setMessage({ type: 'success', text: 'Order created successfully!' });

            // Refresh credits from account after order
            try {
                const acc = await axios.get('/api/account');
                if (typeof acc.data?.credits === 'number') {
                    updateCredits(acc.data.credits);
                }
            } catch (e) {
                console.warn('Failed to refresh account after order');
            }

            // Reset form
            setFormData({
                symbol: 'AAPL',
                side: 'buy',
                orderType: 'market',
                quantity: 1,
            });

            // Notify parent component
            if (onOrderCreated) {
                onOrderCreated();
            }
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to create order',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                            Symbol
                        </label>
                        <select
                            id="symbol"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {stocks.map((stock) => (
                                <option key={stock} value={stock}>
                                    {stock}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="side" className="block text-sm font-medium text-gray-700 mb-1">
                            Side
                        </label>
                        <select
                            id="side"
                            name="side"
                            value={formData.side}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="1"
                            step={1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.orderType === 'market' ? 'Price (Market)' : 'Limit Price ($)'}
                        </label>
                        {formData.orderType === 'market' ? (
                            <input
                                type="text"
                                id="price"
                                name="price"
                                value="-- market --"
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                            />
                        ) : (
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price || 0}
                                onChange={handleChange}
                                min="0.01"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        )}
                    </div>
                </div>

                {message.text && (
                    <div
                        className={`px-4 py-3 rounded-md ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-medium"
                >
                    {loading ? 'Creating Order...' : 'Create Order'}
                </button>
            </form>
        </div>
    );
};

export default OrderForm;

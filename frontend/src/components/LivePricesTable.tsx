import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/axios';
import { StockPrice } from '../types';
import PriceChart from './PriceChart';

interface PriceUpdate {
    type: string;
    prices: StockPrice[];
}

interface LivePricesTableProps {
    onStockClick: (symbol: string) => void;
}

const LivePricesTable: React.FC<LivePricesTableProps> = ({ onStockClick }) => {
    const [prices, setPrices] = useState<StockPrice[]>([]);
    // const [hoveredStock, setHoveredStock] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const stockOrderRef = useRef<string[]>([]);
    const previousPrices = useRef<Record<string, number>>({});

    useEffect(() => {
        // Connect to WebSocket
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
            const data: PriceUpdate = JSON.parse(event.data);
            if (data.type === 'priceUpdate' && data.prices) {
                // Save initial order if not set
                if (stockOrderRef.current.length === 0) {
                    stockOrderRef.current = data.prices.map(p => p.symbol);
                }

                // Maintain the original order
                const orderedPrices = stockOrderRef.current
                    .map(symbol => data.prices.find(p => p.symbol === symbol))
                    .filter(Boolean) as StockPrice[];

                data.prices.forEach((price) => {
                    previousPrices.current[price.symbol] = price.price;
                });

                setPrices(orderedPrices);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const renderMiniChart = (priceHistory?: number[]) => {
        if (!priceHistory || priceHistory.length === 0) return null;
        return <PriceChart data={priceHistory.slice(-20)} height={60} className="mt-2" axes={false} tooltip={false} showGradient={true} />;
    };

    if (prices.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Live Stock Prices</h2>
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Live Stock Prices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {prices.map((stock) => (
                    <div
                        key={stock.symbol}
                        onClick={() => onStockClick(stock.symbol)}
                        className="stock-card"
                    >
                        {/* Stock Info */}
                        <div className="flex items-start gap-3 mb-3">
                            <img
                                src={stock.logo}
                                alt={stock.symbol}
                                className="w-12 h-12 rounded-full flex-shrink-0"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${stock.symbol}&background=random`;
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{stock.symbol}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{stock.name}</div>
                            </div>
                        </div>

                        {/* Price and Change */}
                        <div className="mb-3">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ${stock.price.toFixed(2)}
                            </div>
                            <div
                                className={`text-sm font-semibold ${stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}
                            >
                                {stock.change >= 0 ? '+' : ''}
                                {stock.change.toFixed(2)}%
                            </div>
                        </div>

                        {/* Mini Chart */}
                        {renderMiniChart(stock.priceHistory)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LivePricesTable;

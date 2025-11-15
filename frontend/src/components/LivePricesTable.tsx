import React, { useState, useEffect, useRef } from 'react';
import { StockPrice } from '../types';
import PriceChart from './PriceChart';
import { createWebSocket } from '../utils/websocket';

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
        // Connect to WebSocket using the utility function
        ws.current = createWebSocket('/ws');

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
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">Live Stock Prices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {prices.map((stock) => (
                    <div
                        key={stock.symbol}
                        onClick={() => onStockClick(stock.symbol)}
                        className="stock-card p-3 sm:p-4"
                    >
                        {/* Stock Info */}
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <img
                                src={stock.logo}
                                alt={stock.symbol}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${stock.symbol}&background=4F46E5&color=fff&bold=true&size=128`;
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">{stock.symbol}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{stock.name}</div>
                            </div>
                        </div>

                        {/* Price and Change */}
                        <div className="mb-2 sm:mb-3">
                            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                        <div className="h-12 sm:h-16">
                            {renderMiniChart(stock.priceHistory)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LivePricesTable;

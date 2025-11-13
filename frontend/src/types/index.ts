export interface StockPrice {
    symbol: string;
    price: number;
    change: number;
    priceHistory: number[];
    logo: string;
    name: string;
}

export interface Order {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    orderType: 'market' | 'limit';
    quantity: number;
    price: number;
    status: 'pending' | 'done';
    createdAt: string;
}

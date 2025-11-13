# Trading Dashboard Frontend

React application built with TypeScript, Vite, and Tailwind CSS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will start on `http://localhost:3000`

## Features

- **Authentication**: Login page with JWT token management using React Context
- **Protected Routes**: Dashboard is protected and requires authentication
- **Live Prices**: Real-time stock prices with WebSocket connection
  - Green flash for price increases
  - Red flash for price decreases
- **Order Form**: Create buy/sell orders with validation
- **Order History**: View all submitted orders with auto-refresh

## Technologies

- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Context API (for state management)
- Axios (HTTP client)
- WebSocket API

## Default Credentials

- Username: `test`
- Password: `test`

## Project Structure

```
src/
├── api/
│   └── axios.ts          # Axios configuration with interceptors
├── components/
│   ├── LivePricesTable.tsx
│   ├── OrderForm.tsx
│   ├── OrdersTable.tsx
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx   # React Context for authentication
├── pages/
│   ├── Login.tsx
│   └── Dashboard.tsx
├── App.tsx
├── main.tsx
└── index.css
```

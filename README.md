# Trading Dashboard - Full Stack Application

A real-time trading dashboard built with Go (backend) and React (frontend).

## 🚀 Quick Start

### Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Go dependencies:
```bash
go mod download
```

3. Run the backend server:
```bash
go run cmd/server/main.go
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📋 Features

### Backend (Go)
- ✅ RESTful API with gorilla/mux
- ✅ JWT authentication with golang-jwt/jwt
- ✅ WebSocket support with gorilla/websocket
- ✅ Real-time price simulation (updates every 3 seconds)
- ✅ Thread-safe in-memory storage using mutexes
- ✅ Modular architecture

### Frontend
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ JWT-based authentication with React Context
- ✅ Protected routes
- ✅ Real-time price updates via WebSocket
- ✅ Visual price change indicators (green/red flash)
- ✅ Order creation and management
- ✅ No external state management libraries (pure React Context)

## 🔐 Authentication

**Default Credentials:**
- Username: `test`
- Password: `test`

## 📡 API Endpoints

### Public Endpoints
- `POST /login` - Authenticate and get JWT token
- `GET /prices` - Get current stock prices
- `GET /ws` - WebSocket endpoint for real-time updates

### Protected Endpoints (require JWT)
- `POST /orders` - Create a new order
- `GET /orders` - Get all orders

## 🏗️ Architecture

### Backend Structure
```
backend/
├── cmd/
│   └── server/
│       └── main.go           # Entry point
├── internal/
│   ├── api/
│   │   └── handlers.go       # HTTP handlers
│   ├── auth/
│   │   └── jwt.go            # JWT logic
│   ├── websocket/
│   │   └── hub.go            # WebSocket hub
│   ├── simulation/
│   │   └── simulator.go      # Price simulation
│   └── storage/
│       └── storage.go        # In-memory storage
└── go.mod
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts          # API client
│   ├── components/
│   │   ├── LivePricesTable.tsx
│   │   ├── OrderForm.tsx
│   │   ├── OrdersTable.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   └── AuthContext.tsx   # React Context for auth
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## 🎯 Tech Stack

### Backend
- Go 1.21
- gorilla/mux (router)
- gorilla/websocket
- golang-jwt/jwt v5
- google/uuid

### Frontend (React + TypeScript)
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Context API (state management)
- Axios

## 📊 Mock Stock Data

The application simulates prices for:
- AAPL (Apple)
- TSLA (Tesla)
- AMZN (Amazon)
- GOOGL (Google)
- MSFT (Microsoft)

Prices update automatically every 3 seconds with random fluctuations between -2% and +2%.

## 🔧 Development

### Backend
```bash
cd backend
go run cmd/server/main.go
```

### Frontend
```bash
cd frontend
npm run dev
```

## 🚢 Production Build

### Backend
```bash
cd backend
go build -o trading-server cmd/server/main.go
./trading-server
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📝 License

This is a demo project for educational purposes.

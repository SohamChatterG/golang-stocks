# Trading Dashboard Backend

This is the Golang backend for the trading dashboard application.

## Setup

1. Install dependencies:
```bash
go mod download
```

2. Run the server:
```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Public Endpoints

- `POST /login` - Authenticate and get JWT token
  - Body: `{"username": "test", "password": "test"}`
  - Returns: `{"token": "...", "user": "test"}`

- `GET /prices` - Get current stock prices
  - Returns: Array of stock prices

- `GET /ws` - WebSocket endpoint for real-time price updates

### Protected Endpoints (require JWT token in Authorization header)

- `POST /orders` - Create a new order
  - Header: `Authorization: Bearer <token>`
  - Body: `{"symbol": "AAPL", "side": "buy", "quantity": 10, "price": 150.00}`
  - Returns: Created order object

- `GET /orders` - Get all orders
  - Header: `Authorization: Bearer <token>`
  - Returns: Array of orders

## Architecture

- `/cmd/server` - Main application entry point
- `/internal/api` - HTTP handlers
- `/internal/auth` - JWT authentication
- `/internal/websocket` - WebSocket hub and client management
- `/internal/simulation` - Stock price simulation service
- `/internal/storage` - Thread-safe in-memory storage

## Mock Credentials

- Username: `test`
- Password: `test`

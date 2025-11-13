# 🚀 Quick Start Guide

## Prerequisites
- Go 1.21 or higher
- Node.js 18 or higher

## Option 1: Automated Setup (Recommended)

Run the setup script from the project root:

```powershell
.\setup.ps1
```

This will automatically:
- Check for Go and Node.js installations
- Install backend Go dependencies
- Install frontend npm packages

## Option 2: Manual Setup

### Backend Setup

```powershell
cd backend
go mod download
```

### Frontend Setup

```powershell
cd frontend
npm install
```

## Running the Application

### Start Backend (Terminal 1)

```powershell
.\start-backend.ps1
```

Or manually:
```powershell
cd backend
go run cmd/server/main.go
```

Backend will run on: `http://localhost:8080`

### Start Frontend (Terminal 2)

```powershell
.\start-frontend.ps1
```

Or manually:
```powershell
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

## Access the Application

1. Open your browser to `http://localhost:3000`
2. Login with:
   - Username: `test`
   - Password: `test`
3. Enjoy the real-time trading dashboard!

## Features to Test

✅ **Login** - Authenticate with JWT tokens  
✅ **Live Prices** - Watch stocks update every 3 seconds with color flash animations  
✅ **Create Orders** - Submit buy/sell orders  
✅ **View Orders** - See your order history  
✅ **WebSocket** - Real-time price updates without page refresh  

## Technology Stack

### Backend
- **Language**: Go 1.21
- **Router**: gorilla/mux
- **WebSocket**: gorilla/websocket  
- **Auth**: golang-jwt/jwt v5
- **Architecture**: Clean modular structure with internal packages

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **State**: React Context API (no external libraries!)
- **HTTP Client**: Axios

## API Endpoints

### Public
- `POST /login` - Get JWT token
- `GET /prices` - Get current prices
- `GET /ws` - WebSocket connection

### Protected (requires JWT)
- `POST /orders` - Create order
- `GET /orders` - List orders

## Troubleshooting

### Backend won't start
- Ensure Go 1.21+ is installed: `go version`
- Run `go mod download` in the backend directory

### Frontend won't start
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`

### CORS errors
- Ensure backend is running on port 8080
- Check that frontend is configured to connect to `http://localhost:8080`

### WebSocket not connecting
- Verify backend WebSocket endpoint is accessible at `ws://localhost:8080/ws`
- Check browser console for connection errors

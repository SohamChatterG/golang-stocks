# Trading Dashboard - Project Structure

## 📁 Complete Directory Layout

```
stocks-go/
│
├── backend/                          # Go Backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # Application entry point
│   │
│   ├── internal/                     # Private application code
│   │   ├── api/
│   │   │   └── handlers.go          # HTTP request handlers
│   │   │
│   │   ├── auth/
│   │   │   └── jwt.go               # JWT token logic & middleware
│   │   │
│   │   ├── websocket/
│   │   │   └── hub.go               # WebSocket hub & client management
│   │   │
│   │   ├── simulation/
│   │   │   └── simulator.go         # Stock price simulation with goroutines
│   │   │
│   │   └── storage/
│   │       └── storage.go           # Thread-safe in-memory storage
│   │
│   ├── go.mod                        # Go module dependencies
│   └── README.md                     # Backend documentation
│
├── frontend/                         # React + TypeScript Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts             # Axios instance with JWT interceptors
│   │   │
│   │   ├── components/
│   │   │   ├── LivePricesTable.tsx  # Real-time price display with WebSocket
│   │   │   ├── OrderForm.tsx        # Order creation form
│   │   │   ├── OrdersTable.tsx      # Order history table
│   │   │   └── ProtectedRoute.tsx   # Route guard component
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # React Context for authentication
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login page
│   │   │   └── Dashboard.tsx        # Main dashboard page
│   │   │
│   │   ├── App.tsx                  # Root component with routing
│   │   ├── main.tsx                 # Application entry point
│   │   └── index.css                # Global styles & Tailwind
│   │
│   ├── public/                       # Static assets
│   ├── index.html                    # HTML template
│   ├── package.json                  # npm dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tsconfig.node.json           # TypeScript config for Vite
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── eslint.config.js             # ESLint configuration
│   └── README.md                     # Frontend documentation
│
├── setup.ps1                         # Automated setup script (PowerShell)
├── start-backend.ps1                 # Backend start script
├── start-frontend.ps1                # Frontend start script
├── SETUP.md                          # Detailed setup instructions
├── README.md                         # Main project documentation
└── .gitignore                        # Git ignore rules

```

## 🔧 Backend Architecture

### Modular Design
- **cmd/server**: Entry point that wires everything together
- **internal/api**: HTTP handlers for REST endpoints
- **internal/auth**: JWT authentication and middleware
- **internal/websocket**: WebSocket hub pattern for real-time updates
- **internal/simulation**: Price simulation using goroutines
- **internal/storage**: Thread-safe in-memory data store

### Key Features
✅ Gorilla/mux for routing (no heavy frameworks!)
✅ Goroutines for concurrent price simulation
✅ Mutexes for thread-safe data access
✅ WebSocket hub for broadcasting to multiple clients
✅ JWT middleware for protected routes
✅ CORS enabled for development

## 🎨 Frontend Architecture

### Component Hierarchy
```
App (Router + AuthProvider)
├── Login Page
└── Dashboard (Protected)
    ├── Header (with logout)
    ├── LivePricesTable (WebSocket)
    ├── OrderForm
    └── OrdersTable
```

### State Management
- **No Redux, Zustand, or external libraries!**
- Uses React Context API for authentication state
- Component local state for UI state
- WebSocket for real-time data

### TypeScript Integration
- Full type safety across all components
- Interfaces for API responses
- Type-safe props and state
- No `any` types (where possible)

## 🔄 Data Flow

### Authentication Flow
```
1. User enters credentials → Login component
2. POST /login → Backend validates
3. Backend returns JWT token
4. Token stored in localStorage + Context
5. Axios interceptor adds token to all requests
6. Protected routes check Context for authentication
```

### Real-Time Price Updates
```
1. Backend simulator runs every 3 seconds (goroutine)
2. Generates random price changes (-2% to +2%)
3. Updates in-memory storage (thread-safe)
4. Broadcasts to WebSocket hub
5. Hub sends to all connected clients
6. Frontend LivePricesTable receives update
7. Compares with previous price
8. Applies green/red flash animation
```

### Order Creation Flow
```
1. User fills OrderForm
2. POST /orders with JWT token
3. Backend validates token (middleware)
4. Creates order with UUID
5. Stores in memory (thread-safe)
6. Returns created order
7. Frontend shows success message
8. Triggers OrdersTable refresh
9. GET /orders to fetch updated list
```

## 🎯 Design Decisions

### Why Go with gorilla/mux?
- Lightweight and standard library-focused
- No framework bloat
- Direct control over middleware and routing
- Perfect for learning Go patterns

### Why TypeScript without state libraries?
- Demonstrates pure React patterns
- Context API is sufficient for this scale
- Reduces bundle size
- Shows TypeScript benefits without complexity

### Why WebSocket?
- Real-time updates without polling
- Efficient for frequent price changes
- Demonstrates concurrent Go patterns
- Better UX with instant updates

### Why In-Memory Storage?
- Simplifies setup (no database needed)
- Fast access for demo purposes
- Shows proper mutex usage
- Easy to understand for learning

## 🚀 Deployment Considerations

### For Production
- Replace in-memory storage with a real database
- Add proper logging (zerolog, zap)
- Use environment variables for configuration
- Add rate limiting
- Implement proper error handling
- Add health check endpoints
- Use HTTPS/WSS
- Add user authentication beyond mock credentials
- Implement order validation business logic
- Add database transactions for orders

### Potential Enhancements
- User registration and management
- Real stock data integration (Alpha Vantage, etc.)
- Order execution simulation
- Portfolio tracking
- Trade history charts
- Email notifications
- Multi-user support
- Admin dashboard
- Rate limiting per user
- WebSocket authentication

# MongoDB Setup Guide

## Option 1: Install MongoDB Locally (Recommended for Development)

### Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" installation)
3. MongoDB will start automatically as a Windows service
4. Default connection: `mongodb://localhost:27017`

### Verify Installation:
```powershell
# Check if MongoDB is running
mongosh --eval "db.version()"
```

## Option 2: Use MongoDB Atlas (Cloud - Free Tier Available)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0 Sandbox)
4. Get your connection string
5. Update `.env` file:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Option 3: Use Docker

```powershell
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Stop MongoDB
docker stop mongodb

# Start MongoDB
docker start mongodb
```

## Configuration

Update `backend/.env` file with your MongoDB connection string:

```env
# Local MongoDB
MONGO_URI=mongodb://localhost:27017

# MongoDB Atlas (Cloud)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

DATABASE_NAME=stocks_trading
JWT_SECRET=your-secret-key-change-in-production
PORT=8080
```

## Running the Application

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
go mod tidy

# Run the server
go run cmd/server/main.go
```

## Database Structure

The application will automatically create these collections:

### 1. **users** collection
- Stores user accounts with credentials and portfolio
- Schema: username, passwordHash, credits, portfolio

### 2. **orders** collection  
- Stores all trading orders (buy/sell, market/limit)
- Schema: username, symbol, side, orderType, quantity, price, status, createdAt
- Indexes: username, symbol, status

### 3. **prices** collection
- Stores current stock prices and price history
- Schema: symbol, price, change, priceHistory, logo, name

## Viewing Data

### Using MongoDB Compass (GUI):
1. Download: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `stocks_trading`
4. View collections: users, orders, prices

### Using mongosh (CLI):
```bash
mongosh

use stocks_trading
db.users.find().pretty()
db.orders.find().pretty()
db.prices.find().pretty()
```

## Troubleshooting

### Connection Error:
```
Failed to connect to MongoDB: server selection error
```
**Solution:** Make sure MongoDB is running:
- Windows Service: Check Services app for "MongoDB Server"
- Docker: `docker ps` to see if container is running
- Atlas: Check if IP is whitelisted in Network Access

### Port Already in Use:
```
Failed to bind to 0.0.0.0:27017
```
**Solution:** 
- Check if another MongoDB instance is running
- Change port in MONGO_URI: `mongodb://localhost:27018`

### Authentication Error:
```
Authentication failed
```
**Solution:**
- Verify username/password in connection string
- For Atlas, make sure database user is created with correct permissions

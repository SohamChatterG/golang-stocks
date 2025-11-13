# Trading Dashboard - Quick Start Guide

## 🚀 Starting the Application

### Option 1: Using the Start Script (Easiest)
1. Double-click `start-servers.bat` in the root folder
2. Wait for both servers to start
3. Open your browser to http://localhost:3000

### Option 2: Manual Start

#### Start Backend Server:
```bash
cd backend
go run cmd\server\main.go
```
You should see:
```
Price simulation started
Server starting on :8080
```

#### Start Frontend Server (in a new terminal):
```bash
cd frontend
npm run dev
```
You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:3000/
```

## 🔑 Using the Application

### First Time Setup:
1. Open http://localhost:3000
2. Click "Don't have an account? Sign Up"
3. Enter any username and password
4. You'll automatically receive $2,000 in credits!

### Login:
1. Enter your username and password
2. Click "Login"
3. You'll be redirected to the dashboard

## 💰 Trading:

### View Stocks:
- Stocks are displayed as cards
- **Hover** over any stock to see price history graph
- **Click** on a stock to open the detail modal

### Place Orders:
1. Click on a stock card
2. Toggle between **Buy** or **Sell**
3. Enter quantity and price
4. Click "Place BUY/SELL Order"

**Important Rules:**
- ✅ **Buy**: You need enough credits (quantity × price)
- ✅ **Sell**: You need to own the stocks first (buy them before selling)

### Filter Orders:
- Use the dropdowns to filter by:
  - **Stock symbol** (AAPL, TSLA, etc.)
  - **Date** (when order was placed)
  - **Status** (pending or done)

## 🐛 Troubleshooting

### Backend won't start - "port 8080 already in use":
```bash
# Kill any process using port 8080
Get-Process | Where-Object {$_.ProcessName -eq "main"} | Stop-Process -Force
```

### Frontend shows "Network Error":
- Make sure backend is running on port 8080
- Check browser console (F12) for error details
- Verify CORS is working

### Login doesn't redirect:
1. Open browser console (F12)
2. Look for any red errors
3. Check if you see "Attempting to: /login" log
4. Verify backend server is responding

### "Insufficient credits" error:
- You only have $2,000 starting credits
- Check how much the order costs (quantity × price)
- View your credits in the dashboard header

### "Insufficient stocks to sell":
- You can only sell stocks you own
- Buy stocks first, then you can sell them
- Check your portfolio in the account details

## 📊 Stock List

The dashboard includes these stocks:
- **AAPL** - Apple Inc. (~$150)
- **TSLA** - Tesla, Inc. (~$250)
- **AMZN** - Amazon.com, Inc. (~$135)
- **GOOGL** - Alphabet Inc. (~$140)
- **MSFT** - Microsoft Corporation (~$380)

Prices update automatically every 2 seconds!

## 🎯 Features

- ✅ Real-time stock prices via WebSocket
- ✅ Credit system ($2,000 starting balance)
- ✅ Buy/Sell validation
- ✅ Portfolio tracking
- ✅ Order history with filters
- ✅ Auto-execution when price conditions met
- ✅ Stock logos from Clearbit
- ✅ Beautiful card-based UI
- ✅ Hover for price graphs
- ✅ Maximize/minimize modal

Enjoy trading! 📈

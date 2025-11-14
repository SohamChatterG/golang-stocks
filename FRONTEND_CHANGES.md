# Frontend Changes Summary - EC2 + Nginx Deployment

## ✅ Changes Made

### 1. **axios.ts** - Updated API configuration
- Changed `baseURL` from `/api` to empty string `''`
- All routes are now relative to the current domain
- Public routes: `/login`, `/signup`, `/prices`, `/stocks/{symbol}`
- Protected routes: `/api/orders`, `/api/account`
- Works seamlessly with Nginx proxy

### 2. **websocket.ts** - Created WebSocket utility
- **New file**: `frontend/src/utils/websocket.ts`
- `createWebSocket(path)` - Automatically uses `ws://` or `wss://`
- `createReconnectingWebSocket()` - With auto-reconnect logic
- Protocol detection based on `window.location.protocol`
- No hardcoded URLs

### 3. **LivePricesTable.tsx** - Updated WebSocket connection
- Now uses `createWebSocket('/ws')` helper
- Removed manual protocol/host construction
- Cleaner, more maintainable code

### 4. **.env** - Updated environment documentation
- Removed hardcoded EC2 URLs
- Added documentation for development vs production
- Production uses relative URLs via Nginx proxy

### 5. **netlify.toml** - Updated for Netlify deployment (optional)
- Added redirects for all routes (public + protected)
- Separate handling for `/api/*`, `/login`, `/signup`, etc.
- WebSocket redirect configuration

### 6. **DEPLOYMENT.md** - Created deployment guide
- **New file**: Complete EC2 + Nginx deployment instructions
- Step-by-step build and deploy process
- Nginx configuration examples
- Systemd service setup
- Troubleshooting guide

### 7. **nginx.conf** - Created Nginx configuration template
- **New file**: Production-ready Nginx config
- Handles all route types correctly
- WebSocket proxy with proper headers
- Security headers included
- SSL/HTTPS ready (commented)

## 🎯 How It Works

### Development (localhost)
```
Frontend: http://localhost:5173
Backend: http://localhost:8080
WebSocket: ws://localhost:5173/ws (proxied via Vite)
```

### Production (EC2 + Nginx)
```
User → http://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/
       ↓
    [Nginx]
       ↓
    Frontend: Static files from /var/www/stock-app
    API: /login → http://127.0.0.1:8080/login
    API: /api/orders → http://127.0.0.1:8080/api/orders
    WebSocket: /ws → ws://127.0.0.1:8080/ws
```

## 🚀 Deployment Commands

### Build Frontend
```bash
cd frontend
npm install
npm run build
```

### Deploy to EC2
```bash
# Copy files
scp -r dist/* ec2-user@3.108.9.240:/var/www/stock-app/

# Update Nginx config
scp nginx.conf ec2-user@3.108.9.240:/tmp/
ssh ec2-user@3.108.9.240
sudo mv /tmp/nginx.conf /etc/nginx/sites-available/stock-app
sudo ln -sf /etc/nginx/sites-available/stock-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Backend Service
```bash
# Build
cd backend
go build -o stocks-backend cmd/server/main.go

# Deploy
scp stocks-backend ec2-user@3.108.9.240:/home/ec2-user/golang-stocks/backend/
ssh ec2-user@3.108.9.240
sudo systemctl restart stock-backend
```

## ✨ Key Improvements

1. **No Hardcoded URLs**: Everything uses relative paths
2. **Protocol Agnostic**: Automatically detects HTTP/HTTPS for WebSocket
3. **Nginx Compatible**: Works perfectly with reverse proxy
4. **Clean Separation**: Public vs protected routes handled correctly
5. **Production Ready**: Includes deployment docs and systemd service
6. **Maintainable**: WebSocket logic in reusable utility
7. **Secure**: Ready for HTTPS with minimal changes

## 📝 Files Modified

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts (MODIFIED)
│   ├── utils/
│   │   └── websocket.ts (NEW)
│   └── components/
│       └── LivePricesTable.tsx (MODIFIED)
├── .env (MODIFIED)
└── netlify.toml (MODIFIED)

root/
├── nginx.conf (NEW)
└── DEPLOYMENT.md (NEW)
```

## 🔧 Testing

### Test API Routes
```bash
# From EC2
curl http://localhost:8080/prices
curl -X POST http://localhost:8080/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'

# From browser
http://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/prices
```

### Test WebSocket
```javascript
// Open browser console on deployed site
const ws = new WebSocket('ws://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## ⚠️ Important Notes

1. **Backend Routes**: No changes needed to Go backend
2. **CORS**: Already configured in backend middleware
3. **JWT**: Already handled in axios interceptors
4. **WebSocket Reconnect**: Built into utility (optional)
5. **Environment**: Production uses empty baseURL, no env vars needed

## 🎉 Ready to Deploy!

All code changes are complete. Just build and deploy following the DEPLOYMENT.md guide.

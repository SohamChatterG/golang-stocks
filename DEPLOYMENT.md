# EC2 + Nginx Deployment Guide

## Current Setup
- **EC2 Public IP**: `3.108.9.240`
- **EC2 Public DNS**: `ec2-3-108-9-240.ap-south-1.compute.amazonaws.com`
- **Backend Internal**: `http://127.0.0.1:8080`
- **Frontend Served From**: `http://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/`

## Nginx Configuration

Your Nginx config at `/etc/nginx/sites-available/stock-app`:

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/stock-app;
    index index.html;

    # Serve frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy protected API routes
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy public routes (no /api prefix in backend)
    location ~ ^/(login|signup|prices|stocks) {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Deployment Steps

### 1. Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Deploy Frontend to EC2
```bash
# Copy build files to EC2
scp -r dist/* ec2-user@3.108.9.240:/var/www/stock-app/

# Or use rsync
rsync -avz --delete dist/ ec2-user@3.108.9.240:/var/www/stock-app/
```

### 3. Update Nginx Configuration
```bash
# SSH into EC2
ssh ec2-user@3.108.9.240

# Edit Nginx config
sudo nano /etc/nginx/sites-available/stock-app

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Deploy Backend
```bash
# SSH into EC2
ssh ec2-user@3.108.9.240

# Navigate to backend directory
cd /home/ec2-user/golang-stocks/backend

# Build backend
go build -o stocks-backend cmd/server/main.go

# Run backend (use systemd or screen/tmux for persistence)
./stocks-backend

# Or with systemd service (recommended)
sudo systemctl restart stock-backend
```

### 5. Create Systemd Service for Backend (Recommended)

Create `/etc/systemd/system/stock-backend.service`:

```ini
[Unit]
Description=Stock Trading Backend
After=network.target mongod.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/golang-stocks/backend
ExecStart=/home/ec2-user/golang-stocks/backend/stocks-backend
Restart=always
RestartSec=5
Environment="PATH=/usr/local/go/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable stock-backend
sudo systemctl start stock-backend
sudo systemctl status stock-backend
```

## Frontend Code Structure

### API Routes
- **Public routes** (no auth required):
  - `POST /login` - User login
  - `POST /signup` - User registration
  - `GET /prices` - Get all stock prices
  - `GET /stocks/{symbol}` - Get specific stock details

- **Protected routes** (require JWT):
  - `POST /api/orders` - Create order
  - `GET /api/orders` - Get user orders
  - `GET /api/account` - Get user account

- **WebSocket**:
  - `WS /ws` - Live price updates

### How It Works

1. **Frontend** (`axios.ts`):
   - Uses empty `baseURL: ''`
   - All routes are relative to the current domain
   - Nginx proxies them to backend

2. **WebSocket** (`websocket.ts`):
   - Automatically uses `ws://` or `wss://` based on page protocol
   - Connects to `/ws` which Nginx proxies to backend

3. **Nginx Proxy**:
   - `/api/*` → `http://127.0.0.1:8080/api/*`
   - `/(login|signup|prices|stocks)` → `http://127.0.0.1:8080/...`
   - `/ws` → `ws://127.0.0.1:8080/ws`

## Troubleshooting

### Check Backend is Running
```bash
curl http://localhost:8080/prices
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Backend Logs
```bash
sudo journalctl -u stock-backend -f
```

### Test WebSocket
```bash
# Install websocat
curl -O https://github.com/vi/websocat/releases/download/v1.11.0/websocat_amd64-linux
chmod +x websocat_amd64-linux

# Test WebSocket
./websocat_amd64-linux ws://localhost:8080/ws
```

### Common Issues

1. **CORS Errors**: Backend already has CORS middleware, should work
2. **WebSocket not connecting**: Check Nginx WebSocket proxy headers
3. **401 Unauthorized**: Check JWT token in localStorage
4. **Mixed Content**: Ensure using relative URLs, not hardcoded http://

## Environment Variables

### Backend `.env`
```env
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=stocks_db
JWT_SECRET=your-secret-key-here
SERVER_PORT=8080
```

### Frontend `.env`
```env
# Not needed for production - uses relative URLs
# Only needed for local development
```

## Security Checklist

- [ ] Update `JWT_SECRET` in backend `.env`
- [ ] Configure MongoDB authentication
- [ ] Set up SSL/TLS (use Let's Encrypt with Certbot)
- [ ] Configure firewall (allow 80, 443, 22 only)
- [ ] Update CORS allowed origins in production
- [ ] Never commit `.env` files to git

## Future Improvements

1. **HTTPS Setup**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ec2-3-108-9-240.ap-south-1.compute.amazonaws.com
```

2. **Auto-deployment with GitHub Actions**
3. **Load balancing for multiple backend instances**
4. **Redis for session management**
5. **MongoDB replica set for HA**

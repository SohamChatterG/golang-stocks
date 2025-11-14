# 🚀 Deployment Checklist - EC2 + Nginx

## ✅ Pre-Deployment Checklist

### 1. Verify Code Changes
```bash
# Check current commit
git rev-parse HEAD

# Compare with remote
git fetch origin
git log HEAD..origin/main --oneline
```

### 2. Review Critical Files

**Frontend (`axios.ts`):**
```typescript
baseURL: ''  // ✅ MUST be empty string
```

**Frontend (`websocket.ts`):**
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${host}${cleanPath}`;
```

**No hardcoded URLs:**
- ❌ `http://localhost:8080`
- ❌ `import.meta.env.VITE_BACKEND_URL`
- ❌ `ec2-3-108-9-240.ap-south-1.compute.amazonaws.com`

## 📦 Build & Deploy Steps

### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build

# Verify build output
ls -la dist/
```

### Step 2: Deploy to EC2
```bash
# Copy to EC2
scp -r dist/* ec2-user@3.108.9.240:/var/www/stock-app/

# OR use rsync (better)
rsync -avz --delete dist/ ec2-user@3.108.9.240:/var/www/stock-app/
```

### Step 3: Update Nginx Config
```bash
# Copy nginx config
scp nginx.conf ec2-user@3.108.9.240:/tmp/stock-app-nginx.conf

# SSH to EC2
ssh ec2-user@3.108.9.240

# Update config
sudo mv /tmp/stock-app-nginx.conf /etc/nginx/sites-available/stock-app

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Restart Backend (if needed)
```bash
# On EC2
sudo systemctl restart stock-backend
sudo systemctl status stock-backend
```

## 🧪 Testing After Deployment

### 1. Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### 2. Test Public Routes
```bash
# From EC2
curl http://localhost:8080/prices
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# From browser (replace with your URL)
http://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/prices
```

### 3. Test Frontend Routes
Open browser to: `http://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/`

Check browser console (F12):
- ✅ No CORS errors
- ✅ No 404 errors
- ✅ WebSocket connects: "Creating WebSocket connection to: ws://..."
- ✅ API calls succeed

### 4. Test WebSocket
Open browser console:
```javascript
const ws = new WebSocket('ws://ec2-3-108-9-240.ap-south-1.compute.amazonaws.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Data:', JSON.parse(e.data));
ws.onerror = (e) => console.error('Error:', e);
```

### 5. Test Full Flow
1. ✅ Open homepage - stocks load
2. ✅ Sign up new user
3. ✅ Login
4. ✅ View live prices (WebSocket working)
5. ✅ Click stock - modal opens
6. ✅ Place order
7. ✅ View portfolio
8. ✅ View orders

## 🐛 Troubleshooting

### Issue: 404 on /login
**Cause:** Nginx not proxying public routes
**Fix:** Check nginx config has public routes section
```bash
sudo nginx -t
sudo tail /var/log/nginx/error.log
```

### Issue: WebSocket fails to connect
**Cause:** Nginx WebSocket proxy missing Upgrade header
**Fix:** Verify nginx /ws location has:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
```

### Issue: CORS errors
**Cause:** Backend CORS middleware issue
**Fix:** Check backend logs:
```bash
sudo journalctl -u stock-backend -f
```

### Issue: Old code still running
**Cause:** Browser cache or old build deployed
**Fix:**
```bash
# Clear browser cache (Ctrl+Shift+R)
# Verify deployed files
ssh ec2-user@3.108.9.240
cat /var/www/stock-app/index.html | grep -o 'src="[^"]*"'
```

### Issue: Backend not responding
**Cause:** Backend service down
**Fix:**
```bash
sudo systemctl status stock-backend
sudo journalctl -u stock-backend -n 50
sudo systemctl restart stock-backend
```

## 📋 Nginx Config Quick Reference

```nginx
# Public routes - NO /api prefix
/login → http://127.0.0.1:8080/login
/signup → http://127.0.0.1:8080/signup
/prices → http://127.0.0.1:8080/prices
/stocks/AAPL → http://127.0.0.1:8080/stocks/AAPL

# Protected routes - WITH /api prefix
/api/orders → http://127.0.0.1:8080/api/orders
/api/account → http://127.0.0.1:8080/api/account

# WebSocket
/ws → ws://127.0.0.1:8080/ws
```

## ✅ Success Indicators

- [ ] `git rev-parse HEAD` matches expected commit
- [ ] `npm run build` completes without errors
- [ ] Files deployed to `/var/www/stock-app/`
- [ ] Nginx config updated and tested (`nginx -t`)
- [ ] Nginx reloaded successfully
- [ ] Backend service running
- [ ] Browser loads homepage without errors
- [ ] Login/Signup works
- [ ] Live prices update (WebSocket)
- [ ] Can place orders
- [ ] No console errors

## 🔄 Quick Redeploy Command

```bash
# One-liner to rebuild and deploy
cd frontend && npm run build && rsync -avz --delete dist/ ec2-user@3.108.9.240:/var/www/stock-app/ && echo "✅ Deployed!"
```

## 📞 Need Help?

1. Check logs: `sudo tail -f /var/log/nginx/error.log`
2. Check backend: `sudo journalctl -u stock-backend -f`
3. Test routes manually with `curl`
4. Open browser DevTools (F12) → Network tab
5. Verify git commit matches: `git rev-parse HEAD`

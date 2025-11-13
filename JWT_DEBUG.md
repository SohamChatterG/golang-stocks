# JWT Login Debugging Guide

## What I Fixed:

### Added Comprehensive Logging
The backend now logs every step of the JWT authentication process:

1. **Login Flow:**
   - Request received
   - Username extracted
   - Account lookup/creation
   - Token generation
   - Response sent

2. **JWT Middleware:**
   - Every protected request
   - Authorization header presence
   - Token format validation
   - Token content validation
   - Username extraction

## How to Test:

### Step 1: Start Backend with Logging
```bash
cd d:\jao\stocks-go\backend
go run cmd/server/main.go
```

Watch the console for logs starting with:
- `Login:`
- `JWT Middleware:`

### Step 2: Test Login
1. Go to http://localhost:3000/login
2. Enter any username/password (e.g., `testuser` / `password123`)
3. Click "Login"

### Step 3: Check Backend Logs

**You should see:**
```
Login request received from [::1]:xxxxx
Login: Username=testuser
Login: Found existing account for testuser with 2000.00 credits
Login: Token generated successfully for testuser: eyJhbGciOiJIUzI1Ni...
Login: Response sent for testuser
```

### Step 4: Check Browser Console (F12)

**You should see:**
```
Attempting to: /login with username: testuser
Response received: {token: "...", user: "testuser", credits: 2000}
AuthContext: Setting authentication {newUser: "testuser", newCredits: 2000}
Navigating to dashboard...
```

### Step 5: After Login - Protected Routes

When you navigate to Dashboard/Portfolio/Orders, check backend logs:

**You should see:**
```
JWT Middleware: GET /api/account
JWT Middleware: Authorization header = Bearer eyJhbGciOiJIUzI1Ni...
JWT Middleware: Validating token: eyJhbGciOiJIUzI1Ni...
JWT Middleware: Token valid for user: testuser
```

## Common Issues & Solutions:

### Issue 1: "Authorization header required"
**Symptoms:** Backend logs show `JWT Middleware: No authorization header`

**Cause:** Frontend not sending token

**Fix:** Check browser localStorage:
```javascript
localStorage.getItem('token')
```

Should return a JWT token string. If null, login didn't save the token.

**Solution:**
```javascript
// In browser console
localStorage.clear()
// Then login again
```

---

### Issue 2: "Invalid or expired token"
**Symptoms:** Backend logs show `JWT Middleware: Token validation failed: ...`

**Causes:**
1. Token expired (24 hours)
2. Token malformed
3. Secret key changed

**Solution:**
```javascript
// Clear old token
localStorage.removeItem('token')
localStorage.removeItem('user')
localStorage.removeItem('credits')
// Login again
```

---

### Issue 3: Redirect loop (Login → Dashboard → Login)
**Symptoms:** Page keeps redirecting to login

**Causes:**
1. `isAuthenticated` stays false
2. Token not in localStorage
3. AuthContext not initializing

**Debug:**
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'))
console.log('User:', localStorage.getItem('user'))
console.log('Credits:', localStorage.getItem('credits'))
```

**Solution:** Check `AuthContext.tsx` initialization

---

### Issue 4: Network Error / CORS
**Symptoms:** Red errors in browser console about CORS or network

**Causes:**
1. Backend not running
2. CORS not configured
3. Wrong URL

**Check:**
1. Backend running on http://localhost:8080
2. Frontend connecting to correct URL in `axios.ts`

---

### Issue 5: 401 on Protected Routes
**Symptoms:** Can login but get 401 on /api/orders, /api/account

**Debug Steps:**
1. Check browser Network tab (F12 → Network)
2. Find the failing request
3. Check "Headers" → "Request Headers" → "Authorization"
4. Should be: `Bearer <token>`

**If Authorization header is missing:**
- Check axios interceptor in `frontend/src/api/axios.ts`
- Verify token is in localStorage

**If token is being sent but still 401:**
- Check backend logs for JWT validation errors
- Token might be expired or invalid

---

## Testing Checklist:

- [ ] Backend starts without errors
- [ ] Can access http://localhost:8080/prices (should return stock data)
- [ ] Login form appears at http://localhost:3000/login
- [ ] Can submit login form
- [ ] Backend logs show "Login: Response sent for <username>"
- [ ] Browser console shows "AuthContext: Setting authentication"
- [ ] localStorage has token/user/credits
- [ ] Redirects to /dashboard
- [ ] Dashboard loads (no redirect back to login)
- [ ] Can click on stock to see detail modal
- [ ] Can place an order
- [ ] Can navigate to Portfolio
- [ ] Can navigate to Orders
- [ ] Backend logs show JWT validation for each protected request

## Quick Test Script (Browser Console):

```javascript
// 1. Check auth state
console.log('Auth State:', {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user'),
  credits: localStorage.getItem('credits')
})

// 2. Test API with current token
fetch('http://localhost:8080/api/account', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('Account:', data))
.catch(err => console.error('Error:', err))
```

## Still Having Issues?

Run this complete diagnostic:

1. **Clear everything:**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. **Open browser DevTools (F12)**
   - Console tab
   - Network tab

3. **In backend terminal, watch for logs**

4. **Login with username: `debuguser`**

5. **Share these outputs:**
   - Backend console logs
   - Browser console logs  
   - Network tab → failing request → Headers & Response

The logging I added will tell us exactly where it's failing!

# Fix "Unauthorized" Error - Step by Step

## Problem
- ✅ Works on `localhost:8080`
- ❌ `http://43.224.137.27:8080/comparison.html` → Connection Refused
- ❌ `http://43.224.137.27/comparison.html` → Unauthorized Error

## Root Causes

1. **Application not running** on the server
2. **Application binding to localhost only** (127.0.0.1 instead of 0.0.0.0)
3. **Nginx proxying to wrong service** (another app with authentication)
4. **Port 8080 blocked by firewall**

## Solution Steps

### Step 1: SSH into Server and Check Application Status

```bash
ssh user@43.224.137.27

# Check if application is running
ps aux | grep premium

# Check what's on port 8080
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080
```

### Step 2: Verify Application is Running Correctly

```bash
# Navigate to application directory
cd /opt/premium-calculator

# Check if JAR exists
ls -la premium.jar

# Check startup script
cat start.sh | grep server.address
# Should show: -Dserver.address=0.0.0.0
```

### Step 3: Start/Restart Application with Correct Binding

```bash
# Stop if running
./stop.sh

# Verify start.sh has correct configuration
# Edit if needed:
nano start.sh
```

**Ensure start.sh contains:**
```bash
java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.port=8080 \
    -Dserver.address=0.0.0.0 \  # ← This is critical!
    -Xms512m \
    -Xmx1024m \
    premium.jar
```

```bash
# Start application
./start.sh

# Wait a few seconds, then check
sleep 5
ps aux | grep premium
netstat -tlnp | grep 8080
```

### Step 4: Test Application Directly

```bash
# Test from server itself
curl http://localhost:8080/
curl http://localhost:8080/comparison.html

# Test with server IP
curl http://43.224.137.27:8080/
curl http://43.224.137.27:8080/comparison.html
```

**If these work**, the app is running correctly. If not, check logs:
```bash
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log
```

### Step 5: Check Nginx Configuration

```bash
# View nginx config
cat /etc/nginx/sites-available/premium-calculator

# Verify it's enabled
ls -la /etc/nginx/sites-enabled/premium-calculator

# Test nginx config
sudo nginx -t
```

**Ensure nginx config has:**
```nginx
location / {
    proxy_pass http://127.0.0.1:8080;  # ← Must point to localhost:8080
    proxy_set_header Host $host;
    ...
}
```

### Step 6: Check What Nginx is Actually Proxying To

The "Unauthorized" error suggests nginx might be proxying to a different service.

```bash
# Check nginx error logs
sudo tail -20 /var/log/nginx/error.log
sudo tail -20 /var/log/nginx/premium-calculator-error.log

# Check what's actually running on port 8080
sudo lsof -i :8080
# or
sudo netstat -tlnp | grep 8080
```

**If you see a different process** (not your premium.jar), that's the problem!

### Step 7: Fix Port Conflict (if needed)

If another service is using port 8080:

**Option A: Stop the conflicting service**
```bash
# Find the process
sudo lsof -i :8080

# Kill it (if it's safe to do so)
sudo kill <PID>
```

**Option B: Use a different port for your app**
```bash
# Edit start.sh to use port 8081
# Change: -Dserver.port=8080
# To:     -Dserver.port=8081

# Update nginx config to proxy to 8081
# Change: proxy_pass http://127.0.0.1:8080;
# To:     proxy_pass http://127.0.0.1:8081;
```

### Step 8: Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

### Step 9: Configure Firewall

```bash
# Allow port 8080 (for direct access)
sudo ufw allow 8080/tcp

# Allow port 80 (for nginx)
sudo ufw allow 80/tcp

# Reload firewall
sudo ufw reload
```

### Step 10: Final Verification

```bash
# From server, test both:
curl http://localhost:8080/comparison.html
curl http://localhost/comparison.html

# From your local machine, test:
curl http://43.224.137.27:8080/comparison.html
curl http://43.224.137.27/comparison.html
```

## Quick Fix Script

Run this on the server to fix common issues:

```bash
#!/bin/bash

echo "Fixing Premium Calculator access..."

# 1. Stop application
cd /opt/premium-calculator
./stop.sh 2>/dev/null

# 2. Update start.sh to ensure 0.0.0.0 binding
sed -i 's/-Dserver.port=8080/-Dserver.port=8080\n    -Dserver.address=0.0.0.0/' start.sh

# 3. Start application
./start.sh

# 4. Wait for startup
sleep 10

# 5. Check if running
if ps aux | grep premium | grep -v grep > /dev/null; then
    echo "✅ Application started"
else
    echo "❌ Application failed to start - check logs"
    exit 1
fi

# 6. Test local access
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✅ Application responding on localhost:8080"
else
    echo "❌ Application not responding"
    exit 1
fi

# 7. Reload nginx
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# 8. Test nginx proxy
if curl -s http://localhost/ > /dev/null; then
    echo "✅ Nginx proxy working"
else
    echo "❌ Nginx proxy not working - check nginx logs"
fi

echo ""
echo "Test from browser:"
echo "  Direct: http://43.224.137.27:8080/comparison.html"
echo "  Via Nginx: http://43.224.137.27/comparison.html"
```

## Most Common Issue

**The "Unauthorized" error usually means:**
- Nginx is proxying to a **different service** that has authentication
- OR the Spring Boot app isn't running, and nginx is hitting something else

**Solution:**
1. Make sure your Spring Boot app is **actually running** on port 8080
2. Verify nginx is proxying to `http://127.0.0.1:8080` (not another port)
3. Check nginx error logs to see what's happening

## Still Not Working?

1. **Check application logs:**
   ```bash
   tail -50 /opt/premium-calculator/logs/premium-calculator-uat.log
   ```

2. **Check nginx logs:**
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   sudo tail -50 /var/log/nginx/premium-calculator-error.log
   ```

3. **Verify the JAR file is the correct one:**
   ```bash
   ls -lh /opt/premium-calculator/premium.jar
   # Should be recent and around 20-25MB
   ```

4. **Rebuild and redeploy if needed:**
   ```bash
   # On your local machine
   mvn clean package
   scp target/premium.jar user@43.224.137.27:/opt/premium-calculator/
   
   # On server
   cd /opt/premium-calculator
   ./stop.sh
   ./start.sh
   ```


# Diagnose "Unauthorized" Error

## 🔍 **Problem Analysis**

You're getting:
- ❌ `ERR_CONNECTION_REFUSED` on `http://43.224.137.27:8080/comparison.html` (expected - port 8080 should be internal only)
- ❌ `{"error": "Unauthorized"}` on `http://43.224.137.27/comparison.html` (via Nginx)

This suggests **Nginx is working**, but either:
1. Spring Boot application is not running
2. Nginx is proxying to the wrong service
3. Another service is running on port 8080

---

## 🔧 **Step 1: Check What's Running on Port 8080**

Run these commands **on your server**:

```bash
# Check what process is using port 8080
sudo lsof -i :8080
# or
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080
```

**Expected Output:**
```
tcp  0  0  127.0.0.1:8080  LISTEN  12345/java
```
or
```
tcp  0  0  0.0.0.0:8080  LISTEN  12345/java
```

**If you see a different process** (not Java/premium.jar), that's the problem!

---

## 🔧 **Step 2: Check if Spring Boot Application is Running**

```bash
# Check if premium.jar is running
ps aux | grep java | grep premium

# Check application logs
tail -50 /opt/premium-calculator/logs/premium-calculator-uat.log
# or
journalctl -u premium-calculator -n 50
```

**If application is NOT running:**
```bash
cd /opt/premium-calculator
./start.sh
# or
java -jar -Dspring.profiles.active=uat -Dserver.address=0.0.0.0 premium.jar
```

---

## 🔧 **Step 3: Test Spring Boot Directly (from server)**

```bash
# Test if Spring Boot responds on localhost:8080
curl -v http://localhost:8080/comparison.html

# Check the response
# Should return HTML content, not JSON error
```

**If you get "Unauthorized" here too**, the problem is in Spring Boot, not Nginx.

**If you get HTML content**, then Nginx is the issue.

---

## 🔧 **Step 4: Check Nginx Configuration**

```bash
# Verify Nginx config file exists
ls -la /etc/nginx/sites-available/premium-calculator

# Check if it's enabled
ls -la /etc/nginx/sites-enabled/premium-calculator

# View the actual config
cat /etc/nginx/sites-available/premium-calculator | grep proxy_pass

# Test Nginx configuration
sudo nginx -t
```

**Verify `proxy_pass` points to:**
```nginx
proxy_pass http://127.0.0.1:8080;
```
**NOT:**
```nginx
proxy_pass http://localhost:8080;  # This might resolve differently
```

---

## 🔧 **Step 5: Check Nginx Error Logs**

```bash
# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/premium-calculator-error.log

# Check Nginx access logs
sudo tail -50 /var/log/nginx/premium-calculator-access.log
```

Look for:
- Connection refused errors
- 502 Bad Gateway (means Nginx can't connect to Spring Boot)
- 401 Unauthorized (means Spring Boot is returning this)

---

## 🔧 **Step 6: Test Nginx Connection to Spring Boot**

```bash
# From the server, test if Nginx can reach Spring Boot
curl -H "Host: 43.224.137.27" http://127.0.0.1:8080/comparison.html

# Compare with direct access
curl http://127.0.0.1:8080/comparison.html
```

Both should return the same HTML content.

---

## 🔧 **Step 7: Check for Other Services**

```bash
# Check if there are multiple Java processes
ps aux | grep java

# Check if there are other services on port 8080
sudo lsof -i :8080 | grep -v java
```

---

## 🛠️ **Quick Fix Script**

Run this on your server to diagnose everything:

```bash
#!/bin/bash

echo "=== Diagnosing Unauthorized Error ==="
echo ""

echo "1. Checking port 8080..."
if sudo lsof -i :8080 &> /dev/null; then
    echo "   ✅ Port 8080 is in use:"
    sudo lsof -i :8080
else
    echo "   ❌ Port 8080 is NOT in use - Spring Boot is not running!"
fi
echo ""

echo "2. Checking Spring Boot process..."
if ps aux | grep -v grep | grep -q "premium.jar"; then
    echo "   ✅ Spring Boot is running:"
    ps aux | grep -v grep | grep "premium.jar" | head -1
else
    echo "   ❌ Spring Boot is NOT running!"
    echo "   → Start with: cd /opt/premium-calculator && ./start.sh"
fi
echo ""

echo "3. Testing Spring Boot directly..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/comparison.html 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Spring Boot responds with HTTP 200"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ❌ Spring Boot returns HTTP 401 Unauthorized"
    echo "   → Check application logs for security configuration"
else
    echo "   ⚠️  Spring Boot returns HTTP $HTTP_CODE"
fi
echo ""

echo "4. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/premium-calculator" ]; then
    PROXY_PASS=$(grep "proxy_pass" /etc/nginx/sites-available/premium-calculator | head -1)
    echo "   Proxy pass: $PROXY_PASS"
    if echo "$PROXY_PASS" | grep -q "127.0.0.1:8080"; then
        echo "   ✅ Nginx points to correct address"
    else
        echo "   ⚠️  Nginx may point to wrong address"
    fi
else
    echo "   ❌ Nginx config file not found!"
fi
echo ""

echo "5. Testing via Nginx..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/comparison.html 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Nginx proxy works (HTTP 200)"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ❌ Nginx returns HTTP 401 - Spring Boot is returning Unauthorized"
else
    echo "   ⚠️  Nginx returns HTTP $HTTP_CODE"
fi
echo ""

echo "6. Checking Nginx error logs..."
if [ -f "/var/log/nginx/premium-calculator-error.log" ]; then
    echo "   Last 5 error log entries:"
    sudo tail -5 /var/log/nginx/premium-calculator-error.log
else
    echo "   ℹ️  Error log file not found"
fi
echo ""

echo "=== Summary ==="
echo "If Spring Boot is not running, start it first."
echo "If Spring Boot returns 401, check for security configuration."
echo "If Nginx can't connect, check proxy_pass address."
```

---

## 🎯 **Most Likely Causes & Solutions**

### Cause 1: Spring Boot Not Running
**Solution:**
```bash
cd /opt/premium-calculator
./start.sh
```

### Cause 2: Wrong Service on Port 8080
**Solution:**
```bash
# Find what's using port 8080
sudo lsof -i :8080

# If it's not your app, stop it or change your app's port
```

### Cause 3: Nginx Proxy to Wrong Address
**Solution:**
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/premium-calculator

# Ensure it has:
proxy_pass http://127.0.0.1:8080;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Cause 4: Spring Boot Binding Issue
**Solution:**
Check `application-uat.yml` has:
```yaml
server:
  address: 0.0.0.0
  port: 8080
```

---

## 📋 **Checklist**

Run through this checklist on your server:

- [ ] Port 8080 is in use by Java process
- [ ] `ps aux | grep premium` shows running process
- [ ] `curl http://localhost:8080/comparison.html` returns HTML (not JSON error)
- [ ] Nginx config has `proxy_pass http://127.0.0.1:8080;`
- [ ] `sudo nginx -t` shows no errors
- [ ] `curl http://localhost/comparison.html` returns HTML (not JSON error)
- [ ] Nginx error logs show no connection errors

---

## 🚀 **Next Steps**

1. **Run the diagnostic commands above on your server**
2. **Share the output** so we can identify the exact issue
3. **Most likely**: Spring Boot is not running or wrong service on port 8080


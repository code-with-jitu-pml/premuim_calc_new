# Firewall Setup for Nginx Reverse Proxy

## 🎯 **Quick Answer**

Since you're using **Nginx as a reverse proxy**, you only need to open **port 80** (HTTP).

**Port 8080 should NOT be exposed to the internet** - it's only for Nginx to connect locally.

---

## 📊 **Architecture Overview**

```
Internet → Port 80 (Nginx) → Port 8080 (Spring Boot - localhost only)
```

- **Port 80**: Public access (users connect here)
- **Port 8080**: Internal only (Nginx connects via `127.0.0.1:8080`)

---

## 🔥 **Step 1: Open Port 80 for Nginx**

### Ubuntu/Debian (UFW):
```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Or use service name
sudo ufw allow 'Nginx HTTP'

# Reload firewall
sudo ufw reload

# Verify
sudo ufw status | grep 80
```

### CentOS/RHEL (firewalld):
```bash
# Allow HTTP service
sudo firewall-cmd --permanent --add-service=http

# Or add port directly
sudo firewall-cmd --permanent --add-port=80/tcp

# Reload firewall
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-services
```

---

## 🔒 **Step 2: Secure Port 8080 (Optional but Recommended)**

Since Nginx connects via `127.0.0.1:8080`, you can block external access to port 8080:

### Ubuntu/Debian:
```bash
# Block external access to port 8080
sudo ufw deny 8080/tcp

# But allow localhost (Nginx needs this)
# This is usually the default, but verify:
sudo ufw status | grep 8080
```

### CentOS/RHEL:
```bash
# Port 8080 is not in the allowed list, so it's blocked by default
# Verify nothing is listening on 0.0.0.0:8080
sudo netstat -tlnp | grep 8080
```

---

## ✅ **Step 3: Verify Everything**

### Check Nginx:
```bash
# Check Nginx is running
sudo systemctl status nginx

# Check Nginx is listening on port 80
sudo netstat -tlnp | grep :80
# Should show: tcp 0 0 0.0.0.0:80 LISTEN nginx
```

### Check Spring Boot:
```bash
# Check application is running
ps aux | grep java | grep premium

# Check application is listening on port 8080
sudo netstat -tlnp | grep 8080
# Should show: tcp 0 0 127.0.0.1:8080 LISTEN java
# OR: tcp 0 0 0.0.0.0:8080 LISTEN java
```

### Test Connections:
```bash
# Test Nginx (from server)
curl -I http://localhost/comparison.html

# Test Spring Boot directly (from server)
curl -I http://localhost:8080/comparison.html

# Test from your local machine (via Nginx)
curl -I http://43.224.137.27/comparison.html
```

---

## 🌐 **Step 4: Cloud Provider Firewall (If Applicable)**

If you're using AWS, Azure, or GCP, also configure their firewall:

### AWS (Security Groups):
1. Go to **EC2 Dashboard** → **Security Groups**
2. Select your instance's security group
3. Click **Edit Inbound Rules**
4. Add rule:
   - **Type**: HTTP
   - **Port**: 80
   - **Source**: 0.0.0.0/0 (or specific IP)
5. Click **Save Rules**

### Azure (Network Security Group):
1. Go to **Virtual Machines** → Your VM → **Networking**
2. Click **Add inbound port rule**
3. Set:
   - **Port**: 80
   - **Protocol**: TCP
   - **Source**: Any
4. Click **Add**

### Google Cloud:
```bash
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP for Nginx"
```

---

## 🛠️ **Troubleshooting**

### Issue: Can't access via IP address
```bash
# Check if port 80 is open
sudo ufw status | grep 80
# or
sudo firewall-cmd --list-services

# Check if Nginx is running
sudo systemctl status nginx

# Check Nginx logs
sudo tail -20 /var/log/nginx/error.log
```

### Issue: Nginx can't connect to Spring Boot
```bash
# Check if Spring Boot is running
ps aux | grep java | grep premium

# Check if port 8080 is listening
sudo netstat -tlnp | grep 8080

# Test from Nginx server
curl http://127.0.0.1:8080/comparison.html
```

### Issue: "502 Bad Gateway"
This means Nginx can't connect to Spring Boot:
```bash
# Check Spring Boot is running
ps aux | grep java

# Check Spring Boot logs
tail -50 /opt/premium-calculator/logs/application.log

# Verify Nginx config points to correct port
grep proxy_pass /etc/nginx/sites-available/premium-calculator
```

---

## 📋 **Complete Checklist**

- [ ] Nginx is installed and running
- [ ] Nginx configuration is correct (`sudo nginx -t`)
- [ ] Nginx is listening on port 80
- [ ] Spring Boot application is running
- [ ] Spring Boot is listening on port 8080
- [ ] Port 80 is open in server firewall (UFW/firewalld)
- [ ] Port 80 is open in cloud provider firewall (if applicable)
- [ ] Port 8080 is NOT exposed externally (or blocked)
- [ ] Test from server: `curl http://localhost/comparison.html` ✅
- [ ] Test from local: `curl http://43.224.137.27/comparison.html` ✅

---

## 🚀 **Quick Setup Script**

Run this on your server:

```bash
#!/bin/bash

echo "=== Setting up firewall for Nginx ==="

# Detect OS and configure firewall
if command -v ufw &> /dev/null; then
    echo "Configuring UFW..."
    sudo ufw allow 80/tcp
    sudo ufw reload
    echo "✅ UFW configured"
elif command -v firewall-cmd &> /dev/null; then
    echo "Configuring firewalld..."
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --reload
    echo "✅ firewalld configured"
else
    echo "⚠️  No firewall detected. Please configure manually."
fi

# Verify Nginx
echo ""
echo "=== Checking Nginx ==="
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running. Start with: sudo systemctl start nginx"
fi

# Verify Spring Boot
echo ""
echo "=== Checking Spring Boot ==="
if ps aux | grep -v grep | grep -q "premium.jar"; then
    echo "✅ Spring Boot is running"
else
    echo "❌ Spring Boot is not running. Start with: cd /opt/premium-calculator && ./start.sh"
fi

# Test connections
echo ""
echo "=== Testing Connections ==="
echo "Testing Nginx (port 80)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/comparison.html)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Nginx is working (HTTP $HTTP_CODE)"
else
    echo "⚠️  Nginx returned HTTP $HTTP_CODE"
fi

echo "Testing Spring Boot (port 8080)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/comparison.html)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Spring Boot is working (HTTP $HTTP_CODE)"
else
    echo "⚠️  Spring Boot returned HTTP $HTTP_CODE"
fi

echo ""
echo "=== Summary ==="
echo "Port 80 (Nginx): $(sudo netstat -tlnp | grep :80 | wc -l) listener(s)"
echo "Port 8080 (Spring Boot): $(sudo netstat -tlnp | grep 8080 | wc -l) listener(s)"
```

---

## 📝 **Summary**

**For Nginx reverse proxy setup:**
1. ✅ Open **port 80** (HTTP) - This is what users access
2. ❌ **Don't expose port 8080** - It's internal only
3. ✅ Verify Nginx is running and configured correctly
4. ✅ Verify Spring Boot is running on localhost:8080
5. ✅ Test from both server and your local machine

**Access your application via:**
- ✅ `http://43.224.137.27/comparison.html` (via Nginx on port 80)
- ❌ `http://43.224.137.27:8080/comparison.html` (should be blocked or not accessible)


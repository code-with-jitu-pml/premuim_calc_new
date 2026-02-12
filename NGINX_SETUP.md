# Nginx Reverse Proxy Setup for Premium Calculator

## Overview

If you're using Nginx as a reverse proxy, you need to configure it to forward requests to your Spring Boot application running on port 8080.

## Step-by-Step Setup

### Step 1: Install Nginx (if not already installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
# or
sudo dnf install nginx -y
```

### Step 2: Create Nginx Configuration

1. **Copy the configuration file**:
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/premium-calculator
```

2. **Edit the configuration** (if needed):
```bash
sudo nano /etc/nginx/sites-available/premium-calculator
```

3. **Enable the site**:
```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### Step 3: Test Nginx Configuration

```bash
# Test configuration syntax
sudo nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Start/Restart Nginx

```bash
# Start nginx
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Restart nginx (if already running)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Step 5: Configure Firewall

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp
# or
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# If using HTTPS (port 443)
sudo ufw allow 443/tcp
# or
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 6: Verify Setup

1. **Check Nginx is running**:
```bash
sudo systemctl status nginx
```

2. **Check Nginx is listening on port 80**:
```bash
sudo netstat -tlnp | grep :80
# or
sudo ss -tlnp | grep :80
```

3. **Test from server**:
```bash
curl http://localhost/
curl http://43.224.137.27/
```

4. **Test from browser**:
```
http://43.224.137.27/comparison.html
```

## Important: Ensure Spring Boot is Running

Nginx will proxy requests to `http://localhost:8080`, so your Spring Boot application must be:

1. **Running** on port 8080
2. **Binding to localhost** (127.0.0.1) or all interfaces (0.0.0.0)

Check:
```bash
# Check if Spring Boot is running
ps aux | grep premium

# Check if port 8080 is listening
netstat -tlnp | grep 8080
# Should show: 127.0.0.1:8080 or 0.0.0.0:8080
```

## Troubleshooting

### Issue 1: 502 Bad Gateway

**Cause**: Nginx can't connect to Spring Boot application

**Solution**:
```bash
# Check if Spring Boot is running
ps aux | grep premium

# Check if port 8080 is listening
netstat -tlnp | grep 8080

# Check Spring Boot logs
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log

# Restart Spring Boot application
cd /opt/premium-calculator
./stop.sh
./start.sh
```

### Issue 2: 504 Gateway Timeout

**Cause**: Spring Boot is taking too long to respond

**Solution**: Increase timeout in nginx config:
```nginx
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 3: Connection Refused

**Cause**: Nginx not running or wrong port

**Solution**:
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if nginx is listening
sudo netstat -tlnp | grep nginx
```

### Issue 4: Static Files Not Loading

**Cause**: Static files path issue

**Solution**: Check that static files are accessible:
```bash
# Test static file access
curl http://localhost:8080/comparison.html
curl http://localhost:8080/css/comparison.css
```

### Issue 5: CORS Errors

**Cause**: CORS headers not being forwarded

**Solution**: The nginx config already includes proper headers. If issues persist, check Spring Boot CORS configuration.

## Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/premium-calculator-access.log

# Error logs
sudo tail -f /var/log/nginx/premium-calculator-error.log

# General nginx error log
sudo tail -f /var/log/nginx/error.log
```

## Common Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration (without downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Stop nginx
sudo systemctl stop nginx

# Start nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx

# View configuration
sudo nginx -T
```

## Alternative: Direct Access (No Nginx)

If you want to access the application directly on port 8080 (without nginx):

1. **Ensure Spring Boot binds to 0.0.0.0**:
```bash
# In start.sh or when running:
-Dserver.address=0.0.0.0
```

2. **Open port 8080 in firewall**:
```bash
sudo ufw allow 8080/tcp
```

3. **Access directly**:
```
http://43.224.137.27:8080/comparison.html
```

## Recommended Setup

For production, use Nginx as reverse proxy:
- ✅ Better security (hide backend port)
- ✅ SSL/TLS termination
- ✅ Load balancing (if multiple instances)
- ✅ Static file serving optimization
- ✅ Better error handling

## Quick Diagnostic Script

Run this to check your setup:

```bash
#!/bin/bash
echo "=== Nginx & Spring Boot Diagnostic ==="
echo ""
echo "1. Nginx Status:"
sudo systemctl status nginx --no-pager | head -3
echo ""
echo "2. Nginx Listening Ports:"
sudo netstat -tlnp | grep nginx || sudo ss -tlnp | grep nginx
echo ""
echo "3. Spring Boot Status:"
ps aux | grep premium | grep -v grep || echo "❌ Not running"
echo ""
echo "4. Port 8080 Status:"
sudo netstat -tlnp | grep 8080 || sudo ss -tlnp | grep 8080
echo ""
echo "5. Test Localhost:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ || echo "❌ Failed"
echo ""
echo "6. Test IP:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://43.224.137.27/ || echo "❌ Failed"
echo ""
echo "7. Nginx Error Log (last 5 lines):"
sudo tail -5 /var/log/nginx/error.log
```

Save as `check-nginx.sh`, make executable, and run:
```bash
chmod +x check-nginx.sh
./check-nginx.sh
```


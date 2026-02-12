# Fix "Unauthorized" Error via Nginx

## ✅ **Good News: Spring Boot is Working!**

Your test shows Spring Boot is working perfectly:
```bash
curl http://localhost:8080/comparison.html
# Returns full HTML ✅
```

The issue is **Nginx configuration**, not Spring Boot.

---

## 🔧 **Solution: Update Nginx Host Header**

The "Unauthorized" error via Nginx is likely caused by the `Host` header. Spring Boot might be rejecting requests when the Host header is the IP address instead of `localhost`.

### **Step 1: Update Nginx Configuration**

Edit your Nginx config file:
```bash
sudo nano /etc/nginx/sites-available/premium-calculator
```

**Change this line:**
```nginx
proxy_set_header Host $host;
```

**To this:**
```nginx
proxy_set_header Host localhost;
```

This ensures Nginx sends `Host: localhost` to Spring Boot, which matches what works when you test directly.

### **Step 2: Test Nginx Configuration**

```bash
# Test the configuration syntax
sudo nginx -t
```

Should output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### **Step 3: Reload Nginx**

```bash
# Reload Nginx to apply changes
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx
```

### **Step 4: Test Again**

```bash
# Test via Nginx (should now work)
curl http://localhost/comparison.html

# Test from external IP
curl http://43.224.137.27/comparison.html
```

---

## 🔍 **Alternative: Check Current Nginx Config**

First, verify what's actually in your Nginx config:

```bash
# View the actual config on server
cat /etc/nginx/sites-available/premium-calculator | grep -A 5 "location /"
```

**If it already has `proxy_set_header Host localhost;`**, then the issue might be:

1. **Nginx not reloaded** after config change
2. **Multiple Nginx configs** conflicting
3. **Default Nginx site** still active

---

## 🛠️ **Complete Fix Steps**

Run these commands on your server:

```bash
# 1. Backup current config
sudo cp /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-available/premium-calculator.backup

# 2. Edit config
sudo nano /etc/nginx/sites-available/premium-calculator

# 3. Change both occurrences of:
#    proxy_set_header Host $host;
#    To:
#    proxy_set_header Host localhost;

# 4. Test config
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Test
curl http://localhost/comparison.html
```

---

## 🔍 **If Still Not Working: Check These**

### 1. Verify Nginx is Using Correct Config

```bash
# Check which configs are enabled
ls -la /etc/nginx/sites-enabled/

# Make sure only premium-calculator is enabled (or default is disabled)
sudo rm /etc/nginx/sites-enabled/default  # If it exists
```

### 2. Check Nginx Error Logs

```bash
# Check for errors
sudo tail -20 /var/log/nginx/premium-calculator-error.log
sudo tail -20 /var/log/nginx/error.log
```

### 3. Test with Different Host Headers

```bash
# Test with explicit Host header
curl -H "Host: localhost" http://localhost/comparison.html

# Test with IP as Host
curl -H "Host: 43.224.137.27" http://localhost/comparison.html
```

### 4. Verify Spring Boot is Listening Correctly

```bash
# Check what Spring Boot is actually listening on
sudo netstat -tlnp | grep 8080

# Should show: 0.0.0.0:8080 or 127.0.0.1:8080
```

---

## 📋 **Updated Nginx Config (Complete)**

Here's the complete updated config section:

```nginx
server {
    listen 80;
    server_name 43.224.137.27;
    
    client_max_body_size 10M;
    
    access_log /var/log/nginx/premium-calculator-access.log;
    error_log /var/log/nginx/premium-calculator-error.log;
    
    # Handle static files
    location ~* \.(html|css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host localhost;  # ← Changed from $host
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Root location
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host localhost;  # ← Changed from $host
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering off;
        proxy_intercept_errors off;
        proxy_redirect off;
    }
}
```

---

## ✅ **Quick Test After Fix**

```bash
# 1. Test locally via Nginx
curl -I http://localhost/comparison.html
# Should return: HTTP/1.1 200 OK

# 2. Test from external IP
curl -I http://43.224.137.27/comparison.html
# Should return: HTTP/1.1 200 OK

# 3. Open in browser
# http://43.224.137.27/comparison.html
# Should show the page, not JSON error
```

---

## 🎯 **Summary**

**The Problem:**
- Spring Boot works directly ✅
- Nginx returns "Unauthorized" ❌
- Issue: `Host` header mismatch

**The Solution:**
- Change `proxy_set_header Host $host;` to `proxy_set_header Host localhost;`
- Reload Nginx
- Test again

This should fix the "Unauthorized" error!


# Fix: Forex and Premium Calculator Nginx Conflict

## 🔍 **Problem**

You have **two Nginx configs** enabled:
- `forex` → `/etc/nginx/sites-enabled/forex`
- `premium-calculator` → `/etc/nginx/sites-enabled/premium-calculator`

Both likely have:
- `server_name 43.224.137.27`
- `listen 80`

This causes Nginx to use the **first one it finds** (probably `forex`), which might proxy to a different service with authentication.

---

## 🔧 **Solution Options**

### **Option 1: Temporarily Disable Forex (Quick Test)**

```bash
# Disable forex temporarily
sudo rm /etc/nginx/sites-enabled/forex

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test premium calculator
curl http://localhost/comparison.html
```

**If this works**, then forex was the problem. You can then:
- Use different `server_name` for each (see Option 2)
- Use different ports (see Option 3)

---

### **Option 2: Use Different server_name (Recommended)**

Edit forex config to use a different server_name:

```bash
# Edit forex config
sudo nano /etc/nginx/sites-available/forex

# Change:
# server_name 43.224.137.27;
# To:
# server_name forex.43.224.137.27;
# Or:
# server_name _;  # Catch-all for forex

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

Then access forex via: `http://forex.43.224.137.27` (if DNS is set up) or keep using IP with different config.

---

### **Option 3: Use Different Ports**

Change forex to use a different port:

```bash
# Edit forex config
sudo nano /etc/nginx/sites-available/forex

# Change:
# listen 80;
# To:
# listen 8081;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

Then access forex via: `http://43.224.137.27:8081`

---

### **Option 4: Use Location-Based Routing (Advanced)**

Keep both on port 80, but route by path:

**Forex config:**
```nginx
server {
    listen 80;
    server_name 43.224.137.27;
    
    location /forex/ {
        proxy_pass http://127.0.0.1:FOREX_PORT;
        # ... other settings
    }
}
```

**Premium Calculator config:**
```nginx
server {
    listen 80;
    server_name 43.224.137.27;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        # ... other settings
    }
}
```

---

## 🚀 **Quick Test (Recommended First Step)**

Run this to see what's conflicting:

```bash
# Check both configs
echo "=== FOREX CONFIG ==="
grep -E "server_name|listen|proxy_pass" /etc/nginx/sites-available/forex | head -5

echo ""
echo "=== PREMIUM CALCULATOR CONFIG ==="
grep -E "server_name|listen|proxy_pass" /etc/nginx/sites-available/premium-calculator | head -5

echo ""
echo "=== NGINX TEST ==="
sudo nginx -t
```

Then temporarily disable forex:

```bash
sudo rm /etc/nginx/sites-enabled/forex
sudo nginx -t
sudo systemctl reload nginx
curl http://localhost/comparison.html
```

**If this fixes it**, then forex was intercepting the requests!

---

## 📋 **Diagnostic Script**

I've created `check-and-fix-nginx-conflict.sh` to help diagnose:

```bash
chmod +x check-and-fix-nginx-conflict.sh
sudo ./check-and-fix-nginx-conflict.sh
```

This will show you exactly what's conflicting.

---

## ✅ **Expected Result After Fix**

- ✅ `sudo nginx -t` shows no conflicting server name warning
- ✅ `curl http://localhost/comparison.html` returns HTML
- ✅ `curl http://43.224.137.27/comparison.html` returns HTML
- ✅ Both services work (forex on different port/server_name)

---

## 🎯 **Most Likely Solution**

**The forex config is probably intercepting all requests** because it's loaded first. 

**Quick fix:**
```bash
# Temporarily disable forex
sudo rm /etc/nginx/sites-enabled/forex

# Test
sudo nginx -t
sudo systemctl reload nginx
curl http://localhost/comparison.html
```

If this works, then configure forex to use a different `server_name` or port.


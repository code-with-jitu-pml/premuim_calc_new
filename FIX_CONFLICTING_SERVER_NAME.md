# Fix: Nginx Conflicting Server Name

## ⚠️ **Problem**

You're seeing this warning:
```
nginx: [warn] conflicting server name "43.224.137.27" on 0.0.0.0:80, ignored
```

This means **multiple Nginx configs** have the same `server_name`, and Nginx is using the wrong one (or default).

---

## 🔧 **Quick Fix**

### **Step 1: Disable Default Site**

```bash
# Check if default site is enabled
ls -la /etc/nginx/sites-enabled/default

# If it exists, disable it
sudo rm /etc/nginx/sites-enabled/default
```

### **Step 2: Check for Other Conflicting Configs**

```bash
# List all enabled sites
ls -la /etc/nginx/sites-enabled/

# Check which ones have the same server_name
grep -r "server_name.*43.224.137.27" /etc/nginx/sites-enabled/
```

### **Step 3: Ensure Only Premium Calculator is Enabled**

```bash
# Should only see premium-calculator
ls -la /etc/nginx/sites-enabled/

# If you see others (like default, forex, etc.), disable them:
sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-enabled/forex  # If it conflicts
```

### **Step 4: Test and Reload**

```bash
# Test configuration
sudo nginx -t

# Should NOT show conflicting server name warning

# Reload Nginx
sudo systemctl reload nginx

# Test
curl http://localhost/comparison.html
```

---

## 🔍 **Diagnosis**

Run this to see what's conflicting:

```bash
# See all server_name entries
grep -r "server_name" /etc/nginx/sites-enabled/

# See full Nginx test output
sudo nginx -T 2>&1 | grep -A 10 "server_name.*43.224.137.27"
```

---

## 🛠️ **Complete Fix Script**

I've created `fix-nginx-conflict.sh` that does all of this automatically:

```bash
chmod +x fix-nginx-conflict.sh
sudo ./fix-nginx-conflict.sh
```

---

## 📋 **What to Check**

1. **Only one config should be enabled** for port 80 with `server_name 43.224.137.27`
2. **Default site should be disabled** (unless you need it for something else)
3. **No conflicting server_name** warnings in `nginx -t`

---

## ✅ **Expected Result**

After fix:
- ✅ `sudo nginx -t` shows no warnings
- ✅ `curl http://localhost/comparison.html` returns HTML
- ✅ `curl http://43.224.137.27/comparison.html` returns HTML

---

## 🚨 **If Still Not Working**

The "Unauthorized" error might be coming from:
1. **Another service** on port 8080 (not your Spring Boot app)
2. **Spring Boot security** (though we don't have Spring Security configured)
3. **Nginx proxying to wrong port/service**

Check:
```bash
# What's actually on port 8080?
sudo lsof -i :8080

# What does Nginx think it's proxying to?
grep "proxy_pass" /etc/nginx/sites-available/premium-calculator

# Test Spring Boot directly
curl http://127.0.0.1:8080/comparison.html
```


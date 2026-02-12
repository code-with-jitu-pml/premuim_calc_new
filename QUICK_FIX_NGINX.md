# Quick Fix: Nginx "Unauthorized" Error

## ✅ **Problem Confirmed**

- ✅ Spring Boot works: `curl http://localhost:8080/comparison.html` → Returns HTML
- ❌ Nginx fails: `curl http://localhost/comparison.html` → Returns `{"error":"Unauthorized"}`

**This means Nginx is proxying, but Spring Boot is rejecting the request.**

---

## 🔧 **Quick Fix (Run on Server)**

### **Option 1: Automated Script**

```bash
# Copy the script to server, then:
chmod +x fix-nginx-unauthorized-on-server.sh
sudo ./fix-nginx-unauthorized-on-server.sh
```

### **Option 2: Manual Fix**

```bash
# 1. Backup current config
sudo cp /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-available/premium-calculator.backup

# 2. Edit the config
sudo nano /etc/nginx/sites-available/premium-calculator

# 3. Find and replace (2 occurrences):
#    Change: proxy_set_header Host $host;
#    To:     proxy_set_header Host localhost;

# 4. Test config
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Test
curl http://localhost/comparison.html
```

### **Option 3: One-Liner Fix**

```bash
sudo sed -i 's/proxy_set_header Host \$host;/proxy_set_header Host localhost;/g' /etc/nginx/sites-available/premium-calculator && \
sudo nginx -t && \
sudo systemctl reload nginx && \
curl http://localhost/comparison.html
```

---

## 🔍 **Why This Works**

When you access directly:
- `curl http://localhost:8080/comparison.html`
- Host header: `Host: localhost`
- ✅ Works

When you access via Nginx:
- `curl http://localhost/comparison.html`
- Nginx sends: `Host: localhost` (if fixed) or `Host: 43.224.137.27` (if not fixed)
- Spring Boot might reject requests with IP address as Host header

**Solution:** Force Nginx to always send `Host: localhost` to Spring Boot.

---

## ✅ **Verify Fix**

After applying the fix:

```bash
# Should return HTML, not JSON error
curl http://localhost/comparison.html

# Should also work from external IP
curl http://43.224.137.27/comparison.html
```

---

## 🛠️ **If Still Not Working**

### Check 1: Verify Config Was Updated

```bash
grep "proxy_set_header Host" /etc/nginx/sites-available/premium-calculator
```

Should show:
```
proxy_set_header Host localhost;
```

### Check 2: Verify Nginx Reloaded

```bash
sudo systemctl status nginx
```

### Check 3: Check Nginx Error Logs

```bash
sudo tail -20 /var/log/nginx/premium-calculator-error.log
```

### Check 4: Test with Explicit Host Header

```bash
# Test if Host header is the issue
curl -H "Host: localhost" http://localhost/comparison.html
curl -H "Host: 43.224.137.27" http://localhost/comparison.html
```

### Check 5: Verify Spring Boot is Still Running

```bash
ps aux | grep java | grep premium
curl http://localhost:8080/comparison.html
```

---

## 📋 **Complete Config Check**

After fix, your config should have:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host localhost;  # ← Must be 'localhost', not '$host'
    # ... other headers ...
}
```

---

## 🚀 **Expected Result**

After fix:
- ✅ `curl http://localhost/comparison.html` → Returns HTML
- ✅ `curl http://43.224.137.27/comparison.html` → Returns HTML
- ✅ Browser access works


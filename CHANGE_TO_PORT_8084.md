# Change Application to Port 8084

## ✅ **Changes Made**

I've updated all configurations to use port **8084** instead of 8080 to avoid conflicts with the forex application.

---

## 📝 **Files Updated**

### 1. **application-uat.yml**
Changed port from 8080 to 8084:
```yaml
server:
  port: 8084
  address: 0.0.0.0
```

### 2. **nginx-config.conf**
Updated all `proxy_pass` references from `8080` to `8084`:
```nginx
proxy_pass http://127.0.0.1:8084;
```

### 3. **deploy-uat.sh**
Updated start script to use port 8084:
```bash
-Dserver.port=8084
```

### 4. **nginx-config-8084.conf** (New)
Created a simplified Nginx config matching your exact requirements.

---

## 🚀 **Deployment Steps**

### **Step 1: Update Nginx Config on Server**

```bash
# On your server, update the Nginx config
sudo nano /etc/nginx/sites-available/premium-calculator

# Replace the content with:
```

Copy the content from `nginx-config-8084.conf` or update the existing file to change `8080` to `8084`:

```nginx
server {
    listen 80;
    server_name 43.224.137.27;

    client_max_body_size 10M;

    access_log /var/log/nginx/premium-calculator-access.log;
    error_log /var/log/nginx/premium-calculator-error.log;

    location / {
        proxy_pass http://127.0.0.1:8084;  # ← Changed to 8084
        proxy_set_header Host localhost;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_buffering off;
    }
}
```

### **Step 2: Test and Reload Nginx**

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **Step 3: Stop Current Application (if running on 8080)**

```bash
# Find and stop the application on port 8080
sudo lsof -i :8080
# Kill the process if needed
sudo kill <PID>

# Or if you have a stop script
cd /opt/premium-calculator
./stop.sh
```

### **Step 4: Start Application on Port 8084**

**Option A: Using the updated start script (after redeploying):**
```bash
cd /opt/premium-calculator
./start.sh
```

**Option B: Manual start:**
```bash
cd /opt/premium-calculator
java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.port=8084 \
    -Dserver.address=0.0.0.0 \
    premium.jar
```

### **Step 5: Verify**

```bash
# Test Spring Boot directly
curl http://localhost:8084/comparison.html

# Test via Nginx
curl http://localhost/comparison.html

# Test from external IP
curl http://43.224.137.27/comparison.html
```

---

## 🔧 **Quick Update on Server**

If you want to update the existing deployment without rebuilding:

### **1. Update application-uat.yml on server:**
```bash
sudo nano /opt/premium-calculator/config/application-uat.yml
# Change port: 8080 to port: 8084
```

### **2. Update Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/premium-calculator
# Change all 8080 to 8084
```

### **3. Restart services:**
```bash
# Restart application
cd /opt/premium-calculator
./stop.sh
./start.sh

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ **Benefits of Port 8084**

1. ✅ **No conflict with forex** (which might be using 8080)
2. ✅ **Clear separation** of services
3. ✅ **Easier troubleshooting** - each service on its own port
4. ✅ **No Nginx server_name conflict** - both can run on port 80 with different routing

---

## 📋 **Summary**

- **Spring Boot**: Now runs on port **8084**
- **Nginx**: Proxies to port **8084**
- **No conflicts**: Forex can keep using its port
- **Access**: Still via `http://43.224.137.27/comparison.html` (port 80)

After updating the configs and restarting, everything should work! 🎉


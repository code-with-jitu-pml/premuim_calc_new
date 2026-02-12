# How to Allow Ports on the Server (Nginx Reverse Proxy Setup)

## ⚠️ **Important: You're Using Nginx!**

Since you're using **Nginx as a reverse proxy**:
- **Open Port 80** (HTTP) - This is what users access
- **Port 8080 should NOT be exposed** - It's only for Nginx to connect locally
- Nginx listens on port 80 and proxies to `http://127.0.0.1:8080`

---

## 🔍 **First: Check if Application is Running**

Before opening the firewall, verify the application is running:

```bash
# Check if Java process is running
ps aux | grep java | grep premium

# Check if port 8080 is listening
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080

# Test locally on server
curl http://localhost:8080/comparison.html
```

---

## 🔥 **Option 1: Ubuntu/Debian (UFW Firewall)**

### Check UFW Status:
```bash
sudo ufw status
```

### Allow Port 80 (HTTP) - For Nginx:
```bash
# Allow port 80 for HTTP (Nginx)
sudo ufw allow 80/tcp

# Or use the HTTP service name
sudo ufw allow 'Nginx HTTP'

# Verify the rule was added
sudo ufw status numbered
```

### Port 8080 (Optional - Only if you want direct access):
```bash
# Only allow port 8080 if you want direct access (not recommended with Nginx)
# sudo ufw allow 8080/tcp

# For security, you can block external access to 8080:
# sudo ufw deny 8080/tcp
```

### If UFW is Inactive, Enable It:
```bash
# Enable UFW
sudo ufw enable

# Then allow port 8080
sudo ufw allow 8080/tcp
```

### Reload UFW (if needed):
```bash
sudo ufw reload
```

---

## 🔥 **Option 2: CentOS/RHEL/Fedora (firewalld)**

### Check firewalld Status:
```bash
sudo systemctl status firewalld
```

### Allow Port 80 (HTTP) - For Nginx:
```bash
# Add HTTP service (port 80) to firewall
sudo firewall-cmd --permanent --add-service=http

# Or add port 80 directly
sudo firewall-cmd --permanent --add-port=80/tcp

# Reload firewall to apply changes
sudo firewall-cmd --reload

# Verify port is open
sudo firewall-cmd --list-services
sudo firewall-cmd --list-ports
```

### Port 8080 (Optional - Only if you want direct access):
```bash
# Only if you want direct access (not recommended with Nginx)
# sudo firewall-cmd --permanent --add-port=8080/tcp
# sudo firewall-cmd --reload
```

### If firewalld is not running:
```bash
# Start firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Then add port
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

---

## 🔥 **Option 3: iptables (Direct Rules)**

### Check Current Rules:
```bash
sudo iptables -L -n | grep 8080
```

### Add Rule to Allow Port 8080:
```bash
# Allow incoming connections on port 8080
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# Save rules (Ubuntu/Debian)
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Save rules (CentOS/RHEL)
sudo service iptables save
```

---

## 🔥 **Option 4: Cloud Provider Firewall (AWS, Azure, GCP)**

### AWS (Security Groups):
1. Go to **EC2 Dashboard** → **Security Groups**
2. Select your instance's security group
3. Click **Edit Inbound Rules**
4. Add rule:
   - **Type**: Custom TCP
   - **Port**: 8080
   - **Source**: 0.0.0.0/0 (or specific IP for security)
5. Click **Save Rules**

### Azure (Network Security Group):
1. Go to **Virtual Machines** → Your VM → **Networking**
2. Click **Add inbound port rule**
3. Set:
   - **Port**: 8080
   - **Protocol**: TCP
   - **Source**: Any (or specific IP)
4. Click **Add**

### Google Cloud (Firewall Rules):
```bash
gcloud compute firewall-rules create allow-8080 \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow port 8080 for Premium Calculator"
```

---

## ✅ **Verify Ports are Open**

### From Server:
```bash
# Check if Nginx is listening on port 80
sudo netstat -tlnp | grep :80
# Should show: tcp 0 0 0.0.0.0:80 LISTEN nginx

# Check if Spring Boot is listening on port 8080 (localhost only)
sudo netstat -tlnp | grep 8080
# Should show: tcp 0 0 127.0.0.1:8080 LISTEN java
# OR: tcp 0 0 0.0.0.0:8080 LISTEN java

# Test Nginx (port 80)
curl -I http://localhost/comparison.html

# Test Spring Boot directly (port 8080)
curl -I http://localhost:8080/comparison.html
```

### From Your Local Machine:
```bash
# Test Nginx (port 80) - This is what users should access
curl -I http://43.224.137.27/comparison.html

# Test direct access (port 8080) - Should be blocked or not accessible
curl -I http://43.224.137.27:8080/comparison.html
```

---

## 🛠️ **Quick Diagnostic Script**

Run this on the server to check everything:

```bash
#!/bin/bash
echo "=== Checking Application Status ==="
ps aux | grep java | grep premium || echo "❌ Application not running"

echo ""
echo "=== Checking Port 8080 ==="
sudo netstat -tlnp | grep 8080 || echo "❌ Port 8080 not listening"

echo ""
echo "=== Checking Firewall (UFW) ==="
sudo ufw status | grep 8080 || echo "⚠️  Port 8080 not in UFW rules"

echo ""
echo "=== Testing Local Connection ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/comparison.html || echo "❌ Cannot connect locally"
```

---

## 🔧 **Common Issues & Solutions**

### Issue 1: Application Not Running
```bash
# Start the application
cd /opt/premium-calculator
./start.sh
# or
java -jar -Dserver.address=0.0.0.0 premium.jar
```

### Issue 2: Application Binding to localhost Only
Check `application-uat.yml`:
```yaml
server:
  address: 0.0.0.0  # Must be 0.0.0.0, not 127.0.0.1
  port: 8080
```

### Issue 3: Multiple Firewalls
Some servers have both UFW and iptables. Check both:
```bash
# Check UFW
sudo ufw status

# Check iptables
sudo iptables -L -n | grep 8080
```

### Issue 4: Cloud Provider Firewall
Even if server firewall is open, cloud provider firewall might block it.
- Check AWS Security Groups
- Check Azure NSG
- Check GCP Firewall Rules

---

## 📋 **Step-by-Step Checklist (Nginx Setup)**

- [ ] Nginx is running (`sudo systemctl status nginx`)
- [ ] Nginx is listening on port 80 (`sudo netstat -tlnp | grep :80`)
- [ ] Application is running (`ps aux | grep java | grep premium`)
- [ ] Application is listening on port 8080 (`sudo netstat -tlnp | grep 8080`)
- [ ] Nginx config is correct (`sudo nginx -t`)
- [ ] Nginx config is enabled (`ls -la /etc/nginx/sites-enabled/premium-calculator`)
- [ ] UFW allows port 80 (`sudo ufw allow 80/tcp`)
- [ ] OR firewalld allows HTTP (`sudo firewall-cmd --add-service=http`)
- [ ] Cloud provider firewall allows port 80 (if applicable)
- [ ] Test Nginx from server: `curl http://localhost/comparison.html`
- [ ] Test Spring Boot from server: `curl http://localhost:8080/comparison.html`
- [ ] Test from local via Nginx: `curl http://43.224.137.27/comparison.html`

---

## 🚀 **Quick Commands (Copy & Paste)**

### For Ubuntu/Debian (Nginx on Port 80):
```bash
# Allow HTTP (port 80) for Nginx
sudo ufw allow 80/tcp
sudo ufw reload

# Verify
sudo netstat -tlnp | grep :80
sudo systemctl status nginx
```

### For CentOS/RHEL (Nginx on Port 80):
```bash
# Allow HTTP service for Nginx
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Verify
sudo netstat -tlnp | grep :80
sudo systemctl status nginx
```

---

## ⚠️ **Security Note**

For production, consider restricting access:
```bash
# Allow only from specific IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 8080

# Or use Nginx reverse proxy (port 80/443) instead of exposing 8080
```



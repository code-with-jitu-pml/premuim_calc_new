# Troubleshooting Guide - Connection Issues

## Problem: ERR_CONNECTION_REFUSED when accessing via IP address

**Symptom**: Application works with `localhost:8080` but not with `http://43.224.137.27:8080`

## Quick Diagnosis Steps

### Step 1: Verify Application is Running
```bash
# SSH into the server
ssh user@43.224.137.27

# Check if application is running
ps aux | grep premium
# Should show the Java process

# Check if port 8080 is listening
netstat -tlnp | grep 8080
# or
ss -tlnp | grep 8080
```

**Expected Output**:
```
tcp6  0  0  :::8080  :::*  LISTEN  12345/java
```
or
```
tcp  0  0  0.0.0.0:8080  0.0.0.0:*  LISTEN  12345/java
```

**If you see `127.0.0.1:8080` instead**, the application is only binding to localhost.

### Step 2: Check Application Binding

The application must bind to `0.0.0.0` (all interfaces), not `127.0.0.1` (localhost only).

**Check startup logs**:
```bash
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log
```

Look for:
```
Tomcat started on port(s): 8080 (http) with context path ''
```

### Step 3: Fix Binding Issue

#### Option A: Use UAT Profile (Recommended)
```bash
cd /opt/premium-calculator
./stop.sh
./start.sh
```

The start script should include `-Dserver.address=0.0.0.0`

#### Option B: Manual Start with Explicit Binding
```bash
cd /opt/premium-calculator
java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.port=8080 \
    -Dserver.address=0.0.0.0 \
    premium.jar
```

### Step 4: Check Firewall

#### Ubuntu/Debian (UFW)
```bash
# Check firewall status
sudo ufw status

# Allow port 8080
sudo ufw allow 8080/tcp
sudo ufw reload

# Verify
sudo ufw status | grep 8080
```

#### CentOS/RHEL (firewalld)
```bash
# Check firewall status
sudo firewall-cmd --list-all

# Allow port 8080
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

#### iptables
```bash
# Check rules
sudo iptables -L -n | grep 8080

# Add rule if missing
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# Save rules (Ubuntu/Debian)
sudo iptables-save > /etc/iptables/rules.v4

# Save rules (CentOS/RHEL)
sudo service iptables save
```

### Step 5: Test Connectivity

#### From the Server Itself
```bash
# Test localhost
curl http://localhost:8080/

# Test with IP
curl http://43.224.137.27:8080/

# Both should work
```

#### From External Machine
```bash
# Test port connectivity
telnet 43.224.137.27 8080
# or
nc -zv 43.224.137.27 8080

# Test HTTP
curl http://43.224.137.27:8080/
```

### Step 6: Check Network Interface

```bash
# List all network interfaces
ip addr show
# or
ifconfig

# Verify the IP 43.224.137.27 is assigned to an interface
ip addr show | grep 43.224.137.27
```

## Common Solutions

### Solution 1: Restart with Correct Configuration

1. Stop the application:
```bash
cd /opt/premium-calculator
./stop.sh
```

2. Verify the start script includes `-Dserver.address=0.0.0.0`:
```bash
cat start.sh | grep server.address
```

3. If missing, update start.sh:
```bash
# Edit start.sh and ensure it has:
-Dserver.address=0.0.0.0
```

4. Start the application:
```bash
./start.sh
```

5. Verify binding:
```bash
netstat -tlnp | grep 8080
# Should show 0.0.0.0:8080 or :::8080
```

### Solution 2: Update Configuration File

Edit `/opt/premium-calculator/config/application-uat.yml` (if using external config):
```yaml
server:
  port: 8080
  address: 0.0.0.0  # This is the key setting
  servlet:
    context-path: /
```

### Solution 3: Use Systemd Service

If using systemd, update `/etc/systemd/system/premium-calculator.service`:
```ini
[Service]
ExecStart=/usr/bin/java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.address=0.0.0.0 \
    -Dserver.port=8080 \
    /opt/premium-calculator/premium.jar
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart premium-calculator
sudo systemctl status premium-calculator
```

## Verification Checklist

- [ ] Application process is running (`ps aux | grep premium`)
- [ ] Port 8080 is listening on `0.0.0.0:8080` (not `127.0.0.1:8080`)
- [ ] Firewall allows port 8080
- [ ] Can access from server: `curl http://localhost:8080/`
- [ ] Can access from server with IP: `curl http://43.224.137.27:8080/`
- [ ] Can access from external machine: `curl http://43.224.137.27:8080/`
- [ ] Application logs show no binding errors

## Still Not Working?

1. **Check SELinux** (if enabled):
```bash
sudo getenforce
# If Enforcing, temporarily disable to test:
sudo setenforce 0
# If this fixes it, configure SELinux properly
```

2. **Check for other firewalls**:
   - Cloud provider security groups (AWS, Azure, GCP)
   - Network-level firewalls
   - Load balancers

3. **Check application logs**:
```bash
tail -100 /opt/premium-calculator/logs/premium-calculator-uat.log
grep -i error /opt/premium-calculator/logs/premium-calculator-uat.log
```

4. **Test with different port**:
```bash
# Try port 9090
java -jar -Dserver.port=9090 -Dserver.address=0.0.0.0 premium.jar
# Then test: http://43.224.137.27:9090/
```

## Quick Fix Script

Run this on the server to diagnose and fix:

```bash
#!/bin/bash
echo "=== Premium Calculator Connection Diagnostic ==="
echo ""
echo "1. Checking if application is running..."
ps aux | grep premium | grep -v grep || echo "❌ Application not running"
echo ""
echo "2. Checking port binding..."
netstat -tlnp | grep 8080 || ss -tlnp | grep 8080 || echo "❌ Port 8080 not listening"
echo ""
echo "3. Checking firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw status | grep 8080 || echo "⚠️  Port 8080 not in UFW rules"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --list-ports | grep 8080 || echo "⚠️  Port 8080 not in firewalld rules"
fi
echo ""
echo "4. Testing localhost access..."
curl -s http://localhost:8080/ > /dev/null && echo "✅ Localhost works" || echo "❌ Localhost failed"
echo ""
echo "5. Testing IP access..."
curl -s http://43.224.137.27:8080/ > /dev/null && echo "✅ IP access works" || echo "❌ IP access failed"
```

Save as `diagnose.sh`, make executable, and run:
```bash
chmod +x diagnose.sh
./diagnose.sh
```


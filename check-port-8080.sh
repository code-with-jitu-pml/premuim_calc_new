#!/bin/bash

echo "=========================================="
echo "Nginx & Spring Boot Diagnostic Script"
echo "=========================================="
echo ""
echo "Note: You're using Nginx reverse proxy"
echo "      - Port 80 (Nginx) should be open"
echo "      - Port 8080 (Spring Boot) is internal only"
echo ""

# Check if application is running
echo "1. Checking if application is running..."
if ps aux | grep -v grep | grep -q "premium.jar\|premium-calculator"; then
    echo "   ✅ Application is running"
    ps aux | grep -v grep | grep "premium.jar\|premium-calculator" | head -1
else
    echo "   ❌ Application is NOT running"
    echo "   → Start with: cd /opt/premium-calculator && ./start.sh"
fi
echo ""

# Check if port 8080 is listening
echo "2. Checking if port 8080 is listening..."
if sudo netstat -tlnp 2>/dev/null | grep -q ":8080"; then
    echo "   ✅ Port 8080 is listening"
    sudo netstat -tlnp | grep ":8080"
else
    echo "   ❌ Port 8080 is NOT listening"
    echo "   → Application may not be running or not bound to 0.0.0.0"
fi
echo ""

# Check Nginx
echo "3. Checking Nginx status..."
if command -v nginx &> /dev/null; then
    if sudo systemctl is-active --quiet nginx 2>/dev/null; then
        echo "   ✅ Nginx is running"
        if sudo netstat -tlnp 2>/dev/null | grep -q ":80"; then
            echo "   ✅ Nginx is listening on port 80"
            sudo netstat -tlnp | grep ":80"
        else
            echo "   ⚠️  Nginx is running but not listening on port 80"
        fi
    else
        echo "   ❌ Nginx is NOT running"
        echo "   → Start with: sudo systemctl start nginx"
    fi
else
    echo "   ℹ️  Nginx not installed"
fi
echo ""

# Check UFW firewall
echo "4. Checking UFW firewall status..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    echo "   UFW Status: $UFW_STATUS"
    if sudo ufw status 2>/dev/null | grep -q "80/tcp\|Nginx HTTP"; then
        echo "   ✅ Port 80 (HTTP) is allowed in UFW"
        sudo ufw status | grep -E "80|HTTP"
    else
        echo "   ⚠️  Port 80 is NOT in UFW rules"
        echo "   → Run: sudo ufw allow 80/tcp"
    fi
    if sudo ufw status 2>/dev/null | grep -q "8080"; then
        echo "   ⚠️  Port 8080 is in UFW rules (not needed with Nginx)"
    fi
else
    echo "   ℹ️  UFW not installed"
fi
echo ""

# Check firewalld
echo "5. Checking firewalld status..."
if command -v firewall-cmd &> /dev/null; then
    if sudo firewall-cmd --list-services 2>/dev/null | grep -q "http"; then
        echo "   ✅ HTTP service (port 80) is allowed in firewalld"
        sudo firewall-cmd --list-services | grep http
    elif sudo firewall-cmd --list-ports 2>/dev/null | grep -q "80/tcp"; then
        echo "   ✅ Port 80 is allowed in firewalld"
        sudo firewall-cmd --list-ports | grep 80
    else
        echo "   ⚠️  Port 80 is NOT in firewalld rules"
        echo "   → Run: sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload"
    fi
else
    echo "   ℹ️  firewalld not installed"
fi
echo ""

# Check iptables
echo "6. Checking iptables rules..."
if sudo iptables -L -n 2>/dev/null | grep -q "80"; then
    echo "   ℹ️  Port 80 found in iptables rules"
    sudo iptables -L -n | grep 80 | head -3
else
    echo "   ℹ️  Port 80 not explicitly in iptables (may be allowed by default policy)"
fi
echo ""

# Test local connections
echo "7. Testing local connections..."
echo "   Testing Nginx (port 80)..."
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost/comparison.html 2>/dev/null)
if [ "$NGINX_CODE" = "200" ] || [ "$NGINX_CODE" = "404" ]; then
    echo "   ✅ Nginx connection successful (HTTP $NGINX_CODE)"
else
    echo "   ❌ Nginx connection failed (HTTP $NGINX_CODE or timeout)"
fi

echo "   Testing Spring Boot (port 8080)..."
SPRING_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:8080/comparison.html 2>/dev/null)
if [ "$SPRING_CODE" = "200" ] || [ "$SPRING_CODE" = "404" ]; then
    echo "   ✅ Spring Boot connection successful (HTTP $SPRING_CODE)"
else
    echo "   ❌ Spring Boot connection failed (HTTP $SPRING_CODE or timeout)"
    echo "   → Application may not be running"
fi
echo ""

# Check Nginx configuration
echo "8. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/premium-calculator" ]; then
    echo "   ✅ Nginx config file exists"
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Nginx configuration is valid"
    else
        echo "   ❌ Nginx configuration has errors"
        echo "   → Run: sudo nginx -t"
    fi
    if [ -L "/etc/nginx/sites-enabled/premium-calculator" ]; then
        echo "   ✅ Nginx site is enabled"
    else
        echo "   ⚠️  Nginx site is NOT enabled"
        echo "   → Run: sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/"
    fi
else
    echo "   ⚠️  Nginx config file not found"
    echo "   → Create: /etc/nginx/sites-available/premium-calculator"
fi
echo ""

# Check server binding
echo "9. Checking server binding configuration..."
if [ -f "/opt/premium-calculator/application-uat.yml" ]; then
    if grep -q "address: 0.0.0.0" /opt/premium-calculator/application-uat.yml 2>/dev/null; then
        echo "   ✅ Server configured to bind to 0.0.0.0"
    else
        echo "   ⚠️  Server may be binding to localhost only"
        echo "   → Check application-uat.yml for: server.address: 0.0.0.0"
    fi
else
    echo "   ℹ️  application-uat.yml not found in /opt/premium-calculator/"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary & Next Steps:"
echo "=========================================="
echo ""
echo "If Nginx is NOT running:"
echo "  sudo systemctl start nginx"
echo "  sudo systemctl enable nginx"
echo ""
echo "If port 80 is NOT open in firewall:"
echo "  Ubuntu/Debian: sudo ufw allow 80/tcp"
echo "  CentOS/RHEL:   sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload"
echo ""
echo "If application is NOT running:"
echo "  cd /opt/premium-calculator && ./start.sh"
echo ""
echo "If Nginx config is missing or invalid:"
echo "  sudo cp nginx-config.conf /etc/nginx/sites-available/premium-calculator"
echo "  sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""
echo "If using cloud provider (AWS/Azure/GCP):"
echo "  Check Security Groups / Network Security Groups / Firewall Rules for port 80"
echo ""
echo "Test from your local machine:"
echo "  curl http://43.224.137.27/comparison.html  (via Nginx on port 80)"
echo ""



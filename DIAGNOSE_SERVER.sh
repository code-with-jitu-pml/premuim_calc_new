#!/bin/bash

echo "=========================================="
echo "Premium Calculator Server Diagnostic"
echo "=========================================="
echo ""

echo "1. Checking if Spring Boot application is running..."
ps aux | grep premium | grep -v grep
if [ $? -eq 0 ]; then
    echo "✅ Application is running"
else
    echo "❌ Application is NOT running"
fi
echo ""

echo "2. Checking what's listening on port 8080..."
sudo netstat -tlnp | grep 8080 || sudo ss -tlnp | grep 8080
echo ""

echo "3. Testing localhost:8080..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080/ || echo "❌ Failed to connect"
echo ""

echo "4. Testing localhost:8080/comparison.html..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080/comparison.html || echo "❌ Failed to connect"
echo ""

echo "5. Checking Nginx status..."
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "6. Checking Nginx configuration..."
sudo nginx -t 2>&1
echo ""

echo "7. Testing Nginx (port 80)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ || echo "❌ Failed to connect"
echo ""

echo "8. Checking Nginx error logs (last 10 lines)..."
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"
echo ""

echo "9. Checking application logs (last 10 lines)..."
tail -10 /opt/premium-calculator/logs/premium-calculator-uat.log 2>/dev/null || echo "No log file found"
echo ""

echo "10. Checking firewall rules..."
if command -v ufw &> /dev/null; then
    sudo ufw status | grep -E '(80|8080)'
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --list-ports | grep -E '(80|8080)'
fi
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="


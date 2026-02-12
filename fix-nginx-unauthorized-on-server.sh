#!/bin/bash

echo "=========================================="
echo "Fixing Nginx Unauthorized Error"
echo "=========================================="
echo ""

echo "1. Checking current Nginx configuration..."
if [ -f "/etc/nginx/sites-available/premium-calculator" ]; then
    echo "✅ Config file exists"
    echo ""
    echo "Current proxy_pass settings:"
    grep "proxy_pass" /etc/nginx/sites-available/premium-calculator | head -2
    echo ""
    echo "Current Host header settings:"
    grep "proxy_set_header Host" /etc/nginx/sites-available/premium-calculator
else
    echo "❌ Config file not found at /etc/nginx/sites-available/premium-calculator"
    exit 1
fi
echo ""

echo "2. Checking what's running on port 8080..."
sudo lsof -i :8080 | head -3
echo ""

echo "3. Testing Spring Boot directly..."
SPRING_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/comparison.html)
echo "Spring Boot response: HTTP $SPRING_CODE"
echo ""

echo "4. Testing via Nginx..."
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/comparison.html)
NGINX_BODY=$(curl -s http://localhost/comparison.html | head -1)
echo "Nginx response: HTTP $NGINX_CODE"
if [ "$NGINX_CODE" = "401" ]; then
    echo "Response body: $NGINX_BODY"
fi
echo ""

echo "5. Applying fix..."
echo "Backing up current config..."
sudo cp /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-available/premium-calculator.backup.$(date +%Y%m%d_%H%M%S)

echo "Updating Host header to 'localhost'..."
sudo sed -i 's/proxy_set_header Host \$host;/proxy_set_header Host localhost;/g' /etc/nginx/sites-available/premium-calculator

echo "✅ Config updated"
echo ""
echo "New Host header settings:"
grep "proxy_set_header Host" /etc/nginx/sites-available/premium-calculator
echo ""

echo "6. Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx config is valid"
    echo ""
    echo "7. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
    echo ""
    echo "8. Testing again..."
    sleep 2
    NEW_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/comparison.html)
    if [ "$NEW_CODE" = "200" ]; then
        echo "✅ SUCCESS! Nginx now returns HTTP 200"
        echo ""
        echo "Test from external IP:"
        echo "curl http://43.224.137.27/comparison.html"
    else
        echo "⚠️  Still getting HTTP $NEW_CODE"
        echo "Response:"
        curl -s http://localhost/comparison.html | head -3
        echo ""
        echo "Check Nginx error logs:"
        echo "sudo tail -20 /var/log/nginx/premium-calculator-error.log"
    fi
else
    echo "❌ Nginx config test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/premium-calculator.backup.* /etc/nginx/sites-available/premium-calculator
    exit 1
fi


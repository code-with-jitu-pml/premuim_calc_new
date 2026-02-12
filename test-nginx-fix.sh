#!/bin/bash

echo "=========================================="
echo "Testing Nginx Configuration"
echo "=========================================="
echo ""

echo "1. Testing Spring Boot directly (should work)..."
curl -s -o /dev/null -w "HTTP Code: %{http_code}\n" http://localhost:8080/comparison.html
echo ""

echo "2. Testing via Nginx (port 80)..."
NGINX_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost/comparison.html 2>/dev/null)
NGINX_CODE=$(echo "$NGINX_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
NGINX_BODY=$(echo "$NGINX_RESPONSE" | grep -v "HTTP_CODE" | head -20)

echo "HTTP Code: $NGINX_CODE"
if [ "$NGINX_CODE" = "401" ]; then
    echo "❌ Getting 401 Unauthorized via Nginx"
    echo "Response body:"
    echo "$NGINX_BODY"
elif [ "$NGINX_CODE" = "200" ]; then
    echo "✅ Nginx is working correctly!"
else
    echo "⚠️  Nginx returned HTTP $NGINX_CODE"
    echo "Response body:"
    echo "$NGINX_BODY"
fi
echo ""

echo "3. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/premium-calculator" ]; then
    echo "✅ Config file exists"
    echo "Proxy pass settings:"
    grep "proxy_pass" /etc/nginx/sites-available/premium-calculator | head -2
else
    echo "❌ Config file not found"
fi
echo ""

echo "4. Checking Nginx error logs..."
if [ -f "/var/log/nginx/premium-calculator-error.log" ]; then
    echo "Last 5 error log entries:"
    sudo tail -5 /var/log/nginx/premium-calculator-error.log
else
    echo "ℹ️  Error log file not found"
fi
echo ""

echo "5. Testing with verbose curl to see headers..."
echo "Request headers sent by Nginx:"
curl -v http://localhost/comparison.html 2>&1 | grep -E "< HTTP|< Host|< X-"
echo ""


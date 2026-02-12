#!/bin/bash

echo "=========================================="
echo "Diagnosing Nginx Configuration Conflict"
echo "=========================================="
echo ""

echo "1. Checking for multiple Nginx configs..."
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "2. Checking for conflicting server_name..."
echo "All server_name entries:"
grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null
echo ""

echo "3. Checking what Nginx is actually using..."
echo "Active server blocks:"
sudo nginx -T 2>/dev/null | grep -A 5 "server {" | grep -E "server_name|listen|location /"
echo ""

echo "4. Testing with verbose curl to see headers..."
echo "Request to Nginx:"
curl -v http://localhost/comparison.html 2>&1 | grep -E "< HTTP|< Host|< X-|> GET"
echo ""

echo "5. Testing Spring Boot with same headers Nginx sends..."
echo "Simulating Nginx request:"
curl -v -H "Host: localhost" \
     -H "X-Real-IP: 127.0.0.1" \
     -H "X-Forwarded-For: 127.0.0.1" \
     -H "X-Forwarded-Proto: http" \
     http://localhost:8080/comparison.html 2>&1 | grep -E "< HTTP|< Host"
echo ""

echo "6. Checking Nginx error logs..."
if [ -f "/var/log/nginx/premium-calculator-error.log" ]; then
    echo "Last 10 error log entries:"
    sudo tail -10 /var/log/nginx/premium-calculator-error.log
else
    echo "Error log not found"
fi
echo ""

echo "7. Checking Nginx access logs..."
if [ -f "/var/log/nginx/premium-calculator-access.log" ]; then
    echo "Last 5 access log entries:"
    sudo tail -5 /var/log/nginx/premium-calculator-access.log
else
    echo "Access log not found"
fi
echo ""

echo "8. Checking if default site is interfering..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Default site is enabled - this might be the conflict!"
    echo "Default site config:"
    grep -A 3 "server_name" /etc/nginx/sites-enabled/default 2>/dev/null | head -5
else
    echo "✅ Default site is not enabled"
fi
echo ""

echo "=========================================="
echo "Recommendations:"
echo "=========================================="
echo ""
echo "If you see multiple server_name '43.224.137.27', disable the conflicting config:"
echo "  sudo rm /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""


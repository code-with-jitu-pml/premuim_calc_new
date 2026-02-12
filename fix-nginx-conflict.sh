#!/bin/bash

echo "=========================================="
echo "Fixing Nginx Server Name Conflict"
echo "=========================================="
echo ""

echo "1. Checking for conflicting Nginx configs..."
echo ""
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "2. Checking server_name in all configs..."
echo "All server_name entries:"
grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null
echo ""

echo "3. Checking if default site is enabled..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Default site is enabled - this is likely the conflict!"
    echo ""
    echo "Default site server_name:"
    grep "server_name" /etc/nginx/sites-enabled/default
    echo ""
    echo "Disabling default site..."
    sudo rm /etc/nginx/sites-enabled/default
    echo "✅ Default site disabled"
else
    echo "✅ Default site is not enabled"
fi
echo ""

echo "4. Checking for other configs with same server_name..."
CONFLICTING=$(grep -r "server_name.*43.224.137.27" /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)
if [ "$CONFLICTING" -gt 1 ]; then
    echo "⚠️  Found $CONFLICTING configs with same server_name!"
    echo "Configs with server_name 43.224.137.27:"
    grep -r "server_name.*43.224.137.27" /etc/nginx/sites-enabled/ -l
    echo ""
    echo "Please review and disable conflicting configs manually"
else
    echo "✅ No conflicting server_name found"
fi
echo ""

echo "5. Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "conflicting server name"; then
    echo "⚠️  Still has conflicting server name warning"
    echo "Full nginx -t output:"
    sudo nginx -t
else
    echo "✅ No conflicts detected"
fi
echo ""

echo "6. Checking what Nginx is actually proxying to..."
echo "Testing with verbose curl..."
curl -v http://localhost/comparison.html 2>&1 | grep -E "< HTTP|> Host|> X-|GET /" | head -10
echo ""

echo "7. Checking if request reaches Spring Boot..."
echo "Spring Boot logs (if available):"
if [ -f "/opt/premium-calculator/logs/premium-calculator-uat.log" ]; then
    echo "Last 5 log entries:"
    tail -5 /opt/premium-calculator/logs/premium-calculator-uat.log | grep -i "unauthorized\|error\|GET" || echo "No relevant entries"
else
    echo "Log file not found"
fi
echo ""

echo "8. Testing direct connection from Nginx to Spring Boot..."
echo "Simulating exact Nginx request:"
curl -v \
    -H "Host: localhost" \
    -H "X-Real-IP: 127.0.0.1" \
    -H "X-Forwarded-For: 127.0.0.1" \
    -H "X-Forwarded-Proto: http" \
    -H "X-Forwarded-Host: localhost" \
    http://127.0.0.1:8080/comparison.html 2>&1 | grep -E "< HTTP|error|Unauthorized" | head -5
echo ""

echo "9. Reloading Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"
echo ""

echo "10. Final test..."
sleep 2
FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/comparison.html)
if [ "$FINAL_CODE" = "200" ]; then
    echo "✅ SUCCESS! HTTP $FINAL_CODE"
else
    echo "⚠️  Still getting HTTP $FINAL_CODE"
    echo ""
    echo "Response body:"
    curl -s http://localhost/comparison.html | head -3
    echo ""
    echo "Next steps:"
    echo "1. Check Nginx error logs: sudo tail -20 /var/log/nginx/premium-calculator-error.log"
    echo "2. Check Spring Boot logs: tail -50 /opt/premium-calculator/logs/premium-calculator-uat.log"
    echo "3. Verify only one config is enabled: ls -la /etc/nginx/sites-enabled/"
fi
echo ""


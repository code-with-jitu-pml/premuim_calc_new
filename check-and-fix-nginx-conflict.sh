#!/bin/bash

echo "=========================================="
echo "Checking Nginx Config Conflict"
echo "=========================================="
echo ""

echo "1. Checking server_name in both configs..."
echo ""
echo "Forex config server_name:"
grep "server_name" /etc/nginx/sites-available/forex 2>/dev/null || echo "Not found"
echo ""

echo "Premium Calculator config server_name:"
grep "server_name" /etc/nginx/sites-available/premium-calculator 2>/dev/null || echo "Not found"
echo ""

echo "2. Checking which config handles port 80..."
echo ""
echo "Forex config listen:"
grep "listen" /etc/nginx/sites-available/forex 2>/dev/null | head -2
echo ""

echo "Premium Calculator config listen:"
grep "listen" /etc/nginx/sites-available/premium-calculator 2>/dev/null | head -2
echo ""

echo "3. Checking proxy_pass in both configs..."
echo ""
echo "Forex proxy_pass:"
grep "proxy_pass" /etc/nginx/sites-available/forex 2>/dev/null || echo "No proxy_pass found"
echo ""

echo "Premium Calculator proxy_pass:"
grep "proxy_pass" /etc/nginx/sites-available/premium-calculator 2>/dev/null || echo "No proxy_pass found"
echo ""

echo "4. Testing Nginx configuration..."
sudo nginx -t 2>&1 | grep -E "conflicting|error|successful"
echo ""

echo "5. Checking which config Nginx is actually using..."
echo "Testing request to see which server block handles it:"
curl -v http://localhost/comparison.html 2>&1 | grep -E "< HTTP|Server:" | head -3
echo ""

echo "=========================================="
echo "Recommendation:"
echo "=========================================="
echo ""
echo "If both configs have server_name '43.224.137.27' and listen on port 80,"
echo "you need to either:"
echo ""
echo "Option 1: Change forex to use a different server_name (like forex.43.224.137.27)"
echo "Option 2: Change forex to use a different port (like 8081)"
echo "Option 3: Temporarily disable forex to test premium-calculator"
echo ""
echo "To temporarily disable forex:"
echo "  sudo rm /etc/nginx/sites-enabled/forex"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo "  curl http://localhost/comparison.html"
echo ""


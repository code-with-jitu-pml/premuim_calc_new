#!/bin/bash

echo "=========================================="
echo "Diagnosing 'Unauthorized' Error"
echo "=========================================="
echo ""

echo "1. Checking port 8080..."
if sudo lsof -i :8080 &> /dev/null; then
    echo "   ✅ Port 8080 is in use:"
    sudo lsof -i :8080
else
    echo "   ❌ Port 8080 is NOT in use - Spring Boot is not running!"
fi
echo ""

echo "2. Checking Spring Boot process..."
if ps aux | grep -v grep | grep -q "premium.jar"; then
    echo "   ✅ Spring Boot is running:"
    ps aux | grep -v grep | grep "premium.jar" | head -1
else
    echo "   ❌ Spring Boot is NOT running!"
    echo "   → Start with: cd /opt/premium-calculator && ./start.sh"
fi
echo ""

echo "3. Testing Spring Boot directly (localhost:8080)..."
SPRING_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8080/comparison.html 2>/dev/null)
SPRING_CODE=$(echo "$SPRING_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
SPRING_BODY=$(echo "$SPRING_RESPONSE" | grep -v "HTTP_CODE")

if [ "$SPRING_CODE" = "200" ]; then
    echo "   ✅ Spring Boot responds with HTTP 200"
elif [ "$SPRING_CODE" = "401" ]; then
    echo "   ❌ Spring Boot returns HTTP 401 Unauthorized"
    echo "   Response body:"
    echo "$SPRING_BODY" | head -5
    echo "   → Check application logs for security configuration"
elif [ -z "$SPRING_CODE" ]; then
    echo "   ❌ Cannot connect to Spring Boot (connection refused)"
    echo "   → Spring Boot is not running or not listening on port 8080"
else
    echo "   ⚠️  Spring Boot returns HTTP $SPRING_CODE"
    echo "   Response body:"
    echo "$SPRING_BODY" | head -5
fi
echo ""

echo "4. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/premium-calculator" ]; then
    PROXY_PASS=$(grep "proxy_pass" /etc/nginx/sites-available/premium-calculator | head -1 | tr -d ' ' | tr -d ';')
    echo "   Proxy pass: $PROXY_PASS"
    if echo "$PROXY_PASS" | grep -q "127.0.0.1:8080\|localhost:8080"; then
        echo "   ✅ Nginx points to port 8080"
    else
        echo "   ⚠️  Nginx may point to wrong address"
    fi
    
    if [ -L "/etc/nginx/sites-enabled/premium-calculator" ]; then
        echo "   ✅ Nginx site is enabled"
    else
        echo "   ❌ Nginx site is NOT enabled"
        echo "   → Run: sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/"
    fi
else
    echo "   ❌ Nginx config file not found!"
fi
echo ""

echo "5. Testing via Nginx (localhost:80)..."
NGINX_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost/comparison.html 2>/dev/null)
NGINX_CODE=$(echo "$NGINX_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
NGINX_BODY=$(echo "$NGINX_RESPONSE" | grep -v "HTTP_CODE")

if [ "$NGINX_CODE" = "200" ]; then
    echo "   ✅ Nginx proxy works (HTTP 200)"
elif [ "$NGINX_CODE" = "401" ]; then
    echo "   ❌ Nginx returns HTTP 401 - Spring Boot is returning Unauthorized"
    echo "   Response body:"
    echo "$NGINX_BODY" | head -5
elif [ "$NGINX_CODE" = "502" ]; then
    echo "   ❌ Nginx returns HTTP 502 Bad Gateway"
    echo "   → Nginx cannot connect to Spring Boot"
elif [ -z "$NGINX_CODE" ]; then
    echo "   ❌ Cannot connect to Nginx"
    echo "   → Check if Nginx is running: sudo systemctl status nginx"
else
    echo "   ⚠️  Nginx returns HTTP $NGINX_CODE"
    echo "   Response body:"
    echo "$NGINX_BODY" | head -5
fi
echo ""

echo "6. Checking Nginx status..."
if sudo systemctl is-active --quiet nginx 2>/dev/null; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is NOT running"
    echo "   → Start with: sudo systemctl start nginx"
fi
echo ""

echo "7. Checking Nginx error logs..."
if [ -f "/var/log/nginx/premium-calculator-error.log" ]; then
    ERROR_COUNT=$(sudo tail -20 /var/log/nginx/premium-calculator-error.log | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "   ⚠️  Found errors in log (last 3 lines):"
        sudo tail -3 /var/log/nginx/premium-calculator-error.log
    else
        echo "   ✅ No recent errors in log"
    fi
else
    echo "   ℹ️  Error log file not found"
fi
echo ""

echo "8. Checking all Java processes..."
JAVA_COUNT=$(ps aux | grep -v grep | grep java | wc -l)
if [ "$JAVA_COUNT" -gt 0 ]; then
    echo "   Found $JAVA_COUNT Java process(es):"
    ps aux | grep -v grep | grep java | head -3
else
    echo "   ❌ No Java processes running"
fi
echo ""

echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

if ! ps aux | grep -v grep | grep -q "premium.jar"; then
    echo "❌ ISSUE: Spring Boot is not running"
    echo "   → Fix: cd /opt/premium-calculator && ./start.sh"
    echo ""
fi

if [ "$SPRING_CODE" = "401" ]; then
    echo "❌ ISSUE: Spring Boot returns 401 Unauthorized"
    echo "   → Check if another service is on port 8080"
    echo "   → Check application logs for security errors"
    echo ""
fi

if [ "$NGINX_CODE" = "502" ]; then
    echo "❌ ISSUE: Nginx cannot connect to Spring Boot"
    echo "   → Verify Spring Boot is running"
    echo "   → Check proxy_pass address in Nginx config"
    echo ""
fi

if [ "$NGINX_CODE" = "401" ] && [ "$SPRING_CODE" != "401" ]; then
    echo "⚠️  ISSUE: Nginx returns 401 but Spring Boot doesn't"
    echo "   → Check Nginx configuration"
    echo "   → Verify proxy headers are correct"
    echo ""
fi

if [ "$SPRING_CODE" = "200" ] && [ "$NGINX_CODE" = "200" ]; then
    echo "✅ Everything looks good! Both Spring Boot and Nginx work."
    echo "   → If you still get errors from external IP, check firewall"
    echo ""
fi

echo "Next steps:"
echo "1. If Spring Boot is not running, start it"
echo "2. If port 8080 has wrong service, stop it and restart Spring Boot"
echo "3. If still getting 401, check application logs"
echo "4. Test from external IP: curl http://43.224.137.27/comparison.html"
echo ""


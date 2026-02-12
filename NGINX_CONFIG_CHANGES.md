# Nginx Configuration Changes

## Changes Made to nginx-config.conf

### 1. **Reordered Location Blocks**
   - Static files location block now comes **before** the root location block
   - This ensures more specific patterns are matched first

### 2. **Added Error Handling**
   - `proxy_intercept_errors off;` - Passes through Spring Boot error responses (401, 403, etc.)
   - This prevents nginx from intercepting and modifying error responses

### 3. **Added Header Passing**
   - `proxy_pass_header Server;` - Passes Server header from Spring Boot
   - `proxy_pass_header Set-Cookie;` - Passes Set-Cookie header if any
   - `proxy_redirect off;` - Prevents nginx from modifying redirects

### 4. **Complete Headers in Static Files Block**
   - Added all proxy headers to the static files location block for consistency

## How to Apply Changes

1. **Copy the updated config to the server:**
   ```bash
   sudo cp nginx-config.conf /etc/nginx/sites-available/premium-calculator
   ```

2. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

3. **If test passes, reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

4. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/premium-calculator-error.log
   ```

5. **Check Spring Boot logs:**
   ```bash
   tail -f /opt/premium-calculator/logs/startup.log
   ```

## Troubleshooting "Unauthorized" Error

If you still see "Unauthorized" after applying these changes:

1. **Verify Spring Boot is running:**
   ```bash
   ps aux | grep java
   curl http://127.0.0.1:8080/comparison.html
   ```

2. **Check if Spring Boot is accessible locally:**
   ```bash
   curl -v http://localhost:8080/comparison.html
   ```

3. **Check nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/premium-calculator-access.log
   ```

4. **Verify the Host header:**
   - The config now sets `proxy_set_header Host $host;`
   - This should match what Spring Boot expects

5. **Check for Spring Security:**
   ```bash
   grep -r "spring-boot-starter-security" pom.xml
   ```
   - If found, you may need to configure security to allow static resources

6. **Verify WebConfig is working:**
   - Check Spring Boot startup logs for WebConfig initialization
   - Ensure static files are being served from `classpath:/static/`

## Expected Behavior

After these changes:
- Static files (HTML, CSS, JS) should be served correctly
- API endpoints should work properly
- Error responses from Spring Boot should pass through nginx unchanged
- All headers should be properly forwarded


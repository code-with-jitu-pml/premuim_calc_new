# Quick Fix for Port 8080 Already in Use

## Step 1: Find What's Using Port 8080

```bash
# Find the process using port 8080
sudo lsof -i :8080
# or
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080
```

## Step 2: Options

### Option A: Stop the Existing Process

If it's an old instance of your application:
```bash
# Find the process ID
PID=$(sudo lsof -t -i:8080)
# Kill it
sudo kill $PID
# Or force kill
sudo kill -9 $PID
```

### Option B: Use a Different Port

If you want to keep the existing service, run your app on a different port:
```bash
java -jar -Dserver.port=8081 -Dserver.address=0.0.0.0 premium.jar
```

Then update nginx to proxy to port 8081.

## Step 3: Create Nginx Configuration

You're already in `/etc/nginx/sites-available/`. Create the config file:

```bash
sudo nano premium-calculator
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name 43.224.137.27;
    
    client_max_body_size 10M;
    
    access_log /var/log/nginx/premium-calculator-access.log;
    error_log /var/log/nginx/premium-calculator-error.log;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 4: Enable the Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 5: Start Your Application

After freeing port 8080:

```bash
cd /opt/premium-calculator
./start.sh
```

Or manually:
```bash
java -jar -Dspring.profiles.active=uat -Dserver.port=8080 -Dserver.address=0.0.0.0 premium.jar
```

## Step 6: Verify Everything

```bash
# Check nginx
sudo systemctl status nginx

# Check your app
ps aux | grep premium

# Check ports
sudo netstat -tlnp | grep -E ':(80|8080)'

# Test
curl http://localhost/
curl http://localhost:8080/
```


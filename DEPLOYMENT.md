# Deployment Guide for UAT Environment

> **Note**: If you're using Nginx as a reverse proxy, see [NGINX_SETUP.md](NGINX_SETUP.md) for detailed configuration instructions.

## 📋 Prerequisites

### Server Requirements
- **Java 17** or higher installed
- **Maven 3.6+** (for building)
- **Minimum 2GB RAM** available
- **Port 8080** (or configured port) available
- **Linux/Unix** server (recommended) or Windows Server

### Verify Prerequisites
```bash
# Check Java version
java -version
# Should show: openjdk version "17" or higher

# Check Maven version
mvn -version
# Should show: Apache Maven 3.6.x or higher

# Check available memory
free -h  # Linux
# or
systeminfo | findstr "Total Physical Memory"  # Windows
```

## 🚀 Deployment Steps

### Step 1: Prepare the Application

#### Option A: Build on Local Machine and Transfer

1. **Build the JAR file:**
```bash
cd "/home/hp/Desktop/Premium Calculator/calc"
mvn clean package -DskipTests
```

2. **Verify the JAR was created:**
```bash
ls -lh target/premium.jar
```

3. **Transfer files to UAT server:**
```bash
# Using SCP (Linux/Mac)
scp target/premium.jar user@uat-server:/opt/premium-calculator/

# Using SFTP or WinSCP (Windows)
# Upload: target/premium.jar
# To: /opt/premium-calculator/ on UAT server
```

#### Option B: Build Directly on UAT Server

1. **Transfer source code to server:**
```bash
# Create deployment directory
ssh user@uat-server
mkdir -p /opt/premium-calculator
cd /opt/premium-calculator

# Transfer project files (using git, scp, or deployment tool)
```

2. **Build on server:**
```bash
cd /opt/premium-calculator
mvn clean package -DskipTests
```

### Step 2: Create Deployment Directory Structure

On the UAT server, create the following structure:

```bash
/opt/premium-calculator/
├── premium.jar  # Application JAR
├── logs/                         # Log directory
├── config/                       # Configuration files (optional)
├── start.sh                      # Start script
├── stop.sh                       # Stop script
└── application-uat.yml           # UAT configuration (optional override)
```

Create directories:
```bash
mkdir -p /opt/premium-calculator/logs
mkdir -p /opt/premium-calculator/config
```

### Step 3: Create Start Script

Create `/opt/premium-calculator/start.sh`:

```bash
#!/bin/bash

APP_NAME="premium-calculator"
APP_JAR="premium.jar"
APP_DIR="/opt/premium-calculator"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/$APP_NAME.pid"

# Change to application directory
cd $APP_DIR

# Check if application is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        echo "$APP_NAME is already running with PID $PID"
        exit 1
    else
        rm -f $PID_FILE
    fi
fi

# Start the application
echo "Starting $APP_NAME..."
nohup java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.port=8080 \
    -Dserver.address=0.0.0.0 \
    -Xms512m \
    -Xmx1024m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    $APP_JAR > $LOG_DIR/startup.log 2>&1 &

# Save PID
echo $! > $PID_FILE

echo "$APP_NAME started with PID $(cat $PID_FILE)"
echo "Logs are available at: $LOG_DIR/"
echo "Application will be available at: http://$(hostname -I | awk '{print $1}'):8080"
```

Make it executable:
```bash
chmod +x /opt/premium-calculator/start.sh
```

### Step 4: Create Stop Script

Create `/opt/premium-calculator/stop.sh`:

```bash
#!/bin/bash

APP_NAME="premium-calculator"
APP_DIR="/opt/premium-calculator"
PID_FILE="$APP_DIR/$APP_NAME.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "$APP_NAME is not running"
    exit 1
fi

PID=$(cat $PID_FILE)

if ! ps -p $PID > /dev/null 2>&1; then
    echo "$APP_NAME is not running (stale PID file)"
    rm -f $PID_FILE
    exit 1
fi

echo "Stopping $APP_NAME (PID: $PID)..."
kill $PID

# Wait for process to stop
for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
        echo "$APP_NAME stopped successfully"
        rm -f $PID_FILE
        exit 0
    fi
    sleep 1
done

# Force kill if still running
echo "Force stopping $APP_NAME..."
kill -9 $PID
rm -f $PID_FILE
echo "$APP_NAME force stopped"
```

Make it executable:
```bash
chmod +x /opt/premium-calculator/stop.sh
```

### Step 5: Deploy and Start Application

1. **Copy JAR file to deployment directory:**
```bash
cp target/premium.jar /opt/premium-calculator/
```

2. **Start the application:**
```bash
cd /opt/premium-calculator
./start.sh
```

3. **Verify application is running:**
```bash
# Check process
ps aux | grep premium-calculator

# Check logs
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log

# Check if port is listening
netstat -tlnp | grep 8080
# or
ss -tlnp | grep 8080
```

4. **Test the application:**
```bash
# Health check
curl http://localhost:8080/

# Test API endpoint
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"age": 35, "loanAmount": 2000000, "loanTenure": 5, "products": ["GCI"]}'
```

### Step 6: Configure Firewall (if needed)

```bash
# For Ubuntu/Debian
sudo ufw allow 8080/tcp

# For CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## 🔧 Configuration Options

### Change Port

Edit `start.sh` and change:
```bash
-Dserver.port=9090  # Change to desired port
```

### Change Memory Settings

Edit `start.sh` and modify:
```bash
-Xms512m    # Initial heap size
-Xmx2048m   # Maximum heap size (increase for higher load)
```

### Use Custom Configuration

1. Copy `application-uat.yml` to server:
```bash
scp src/main/resources/application-uat.yml user@uat-server:/opt/premium-calculator/config/
```

2. Update start script to use external config:
```bash
--spring.config.location=file:./config/application-uat.yml
```

## 🔄 Update/Re-deployment Process

1. **Stop the application:**
```bash
cd /opt/premium-calculator
./stop.sh
```

2. **Backup current version:**
```bash
cp premium.jar premium.jar.backup.$(date +%Y%m%d_%H%M%S)
```

3. **Deploy new JAR:**
```bash
# Copy new JAR file
cp /path/to/new/premium.jar ./
```

4. **Start the application:**
```bash
./start.sh
```

5. **Verify deployment:**
```bash
tail -f logs/premium-calculator-uat.log
```

## 📊 Monitoring

### Check Application Status
```bash
# Check if running
ps aux | grep premium-calculator

# Check logs
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log

# Check port
netstat -tlnp | grep 8080
```

### View Logs
```bash
# Real-time logs
tail -f /opt/premium-calculator/logs/premium-calculator-uat.log

# Last 100 lines
tail -n 100 /opt/premium-calculator/logs/premium-calculator-uat.log

# Search for errors
grep -i error /opt/premium-calculator/logs/premium-calculator-uat.log
```

## 🛡️ Running as a Service (Systemd - Linux)

Create `/etc/systemd/system/premium-calculator.service`:

```ini
[Unit]
Description=Premium Calculator UAT Application
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/premium-calculator
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=uat -Dserver.address=0.0.0.0 -Xms512m -Xmx1024m /opt/premium-calculator/premium.jar
ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
StandardOutput=append:/opt/premium-calculator/logs/startup.log
StandardError=append:/opt/premium-calculator/logs/error.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable premium-calculator
sudo systemctl start premium-calculator
sudo systemctl status premium-calculator
```

## 🌐 Access URLs

After deployment, access the application at:

- **Main Application**: `http://uat-server-ip:8080/comparison.html`
- **Aditya Birla Calculator**: `http://uat-server-ip:8080/adityabirla.html`
- **Bajaj Life**: `http://uat-server-ip:8080/bajajlife.html`
- **Go Digit**: `http://uat-server-ip:8080/godigit.html`
- **Go Digit Life**: `http://uat-server-ip:8080/godigitlife.html`
- **Comparison Page**: `http://uat-server-ip:8080/comparison.html`

## 🔍 Troubleshooting

### Application Won't Start
```bash
# Check Java version
java -version

# Check if port is in use
netstat -tlnp | grep 8080
lsof -i :8080

# Check logs for errors
tail -f logs/premium-calculator-uat.log
```

### Out of Memory
```bash
# Increase heap size in start.sh
-Xmx2048m  # Increase from 1024m to 2048m
```

### Permission Denied
```bash
# Make scripts executable
chmod +x start.sh stop.sh

# Check file ownership
ls -la /opt/premium-calculator/
```

## 📝 Environment Variables

You can also use environment variables for configuration:

```bash
export SPRING_PROFILES_ACTIVE=uat
export SERVER_PORT=8080
export JAVA_OPTS="-Xms512m -Xmx1024m"

java -jar $JAVA_OPTS premium.jar
```

## ✅ Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Logs are being written
- [ ] Port 8080 is accessible
- [ ] All HTML pages load correctly
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] Firewall rules allow access
- [ ] Monitoring is set up
- [ ] Backup process is in place

## 📞 Support

For issues during deployment:
1. Check application logs: `/opt/premium-calculator/logs/premium-calculator-uat.log`
2. Verify Java version: `java -version`
3. Check system resources: `free -h`, `df -h`
4. Verify network connectivity: `curl http://localhost:8080/`


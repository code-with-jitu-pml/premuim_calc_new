#!/bin/bash

# Premium Calculator UAT Deployment Script
# This script builds and prepares the application for UAT deployment

set -e  # Exit on error

echo "=========================================="
echo "Premium Calculator - UAT Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_NAME="premium.jar"
TARGET_DIR="$PROJECT_DIR/target"
BUILD_DIR="$PROJECT_DIR/build-uat"
DEPLOYMENT_PACKAGE="$PROJECT_DIR/premium-calculator-uat-$(date +%Y%m%d-%H%M%S).tar.gz"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed or not in PATH"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_error "Java 17 or higher is required. Found: $JAVA_VERSION"
        exit 1
    fi
    print_success "Java version: $(java -version 2>&1 | head -n 1)"
    
    if ! command -v mvn &> /dev/null; then
        print_error "Maven is not installed or not in PATH"
        exit 1
    fi
    print_success "Maven version: $(mvn -version | head -n 1)"
}

# Clean previous builds
clean_build() {
    print_info "Cleaning previous builds..."
    mvn clean
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    print_success "Clean completed"
}

# Build application
build_application() {
    print_info "Building application..."
    mvn clean package -DskipTests
    
    if [ ! -f "$TARGET_DIR/$JAR_NAME" ]; then
        print_error "Build failed - JAR file not found"
        exit 1
    fi
    
    print_success "Build completed successfully"
    print_info "JAR size: $(du -h "$TARGET_DIR/$JAR_NAME" | cut -f1)"
}

# Create deployment package
create_deployment_package() {
    print_info "Creating deployment package..."
    
    # Copy JAR
    cp "$TARGET_DIR/$JAR_NAME" "$BUILD_DIR/"
    
    # Copy configuration
    if [ -f "$PROJECT_DIR/src/main/resources/application-uat.yml" ]; then
        mkdir -p "$BUILD_DIR/config"
        cp "$PROJECT_DIR/src/main/resources/application-uat.yml" "$BUILD_DIR/config/"
    fi
    
    # Create deployment scripts
    cat > "$BUILD_DIR/start.sh" << 'EOF'
#!/bin/bash
APP_NAME="premium-calculator"
APP_JAR="premium.jar"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/$APP_NAME.pid"

cd $APP_DIR
mkdir -p $LOG_DIR

if [ -f "$PID_FILE" ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        echo "$APP_NAME is already running with PID $PID"
        exit 1
    else
        rm -f $PID_FILE
    fi
fi

echo "Starting $APP_NAME..."
nohup java -jar \
    -Dspring.profiles.active=uat \
    -Dserver.port=8084 \
    -Dserver.address=0.0.0.0 \
    -Xms512m \
    -Xmx1024m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    $APP_JAR > $LOG_DIR/startup.log 2>&1 &

echo $! > $PID_FILE
echo "$APP_NAME started with PID $(cat $PID_FILE)"
echo "Logs: $LOG_DIR/"
EOF

    cat > "$BUILD_DIR/stop.sh" << 'EOF'
#!/bin/bash
APP_NAME="premium-calculator"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
        echo "$APP_NAME stopped successfully"
        rm -f $PID_FILE
        exit 0
    fi
    sleep 1
done

echo "Force stopping $APP_NAME..."
kill -9 $PID
rm -f $PID_FILE
echo "$APP_NAME force stopped"
EOF

    chmod +x "$BUILD_DIR/start.sh"
    chmod +x "$BUILD_DIR/stop.sh"
    
    # Create README
    cat > "$BUILD_DIR/README-DEPLOYMENT.txt" << 'EOF'
Premium Calculator - UAT Deployment Package

Contents:
- premium.jar: Application JAR file
- start.sh: Start script
- stop.sh: Stop script
- config/application-uat.yml: UAT configuration (if included)

Deployment Steps:
1. Extract this package on UAT server: tar -xzf premium-calculator-uat-*.tar.gz
2. Move to deployment directory: mv premium-calculator-uat-* /opt/premium-calculator
3. Create logs directory: mkdir -p /opt/premium-calculator/logs
4. Start application: ./start.sh
5. Check logs: tail -f logs/premium-calculator-uat.log

For detailed instructions, see DEPLOYMENT.md
EOF

    # Create tarball
    cd "$PROJECT_DIR"
    tar -czf "$DEPLOYMENT_PACKAGE" -C "$BUILD_DIR" .
    
    print_success "Deployment package created: $DEPLOYMENT_PACKAGE"
    print_info "Package size: $(du -h "$DEPLOYMENT_PACKAGE" | cut -f1)"
}

# Main execution
main() {
    echo ""
    check_prerequisites
    echo ""
    clean_build
    echo ""
    build_application
    echo ""
    create_deployment_package
    echo ""
    echo "=========================================="
    print_success "UAT Deployment Package Ready!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Transfer package to UAT server:"
    echo "   scp $DEPLOYMENT_PACKAGE user@uat-server:/tmp/"
    echo ""
    echo "2. On UAT server, extract and deploy:"
    echo "   cd /opt"
    echo "   tar -xzf /tmp/premium-calculator-uat-*.tar.gz"
    echo "   mv premium-calculator-uat-* premium-calculator"
    echo "   cd premium-calculator"
    echo "   mkdir -p logs"
    echo "   ./start.sh"
    echo ""
    echo "3. Verify deployment:"
    echo "   tail -f logs/premium-calculator-uat.log"
    echo "   curl http://localhost:8084/"
    echo ""
}

# Run main
main


#!/bin/bash

echo "========================================="
echo "Restarting Premium Calculator on Port 8084"
echo "========================================="
echo ""

# Stop any running instance on port 8080
echo "🛑 Stopping any application on port 8080..."
PID_8080=$(lsof -ti :8080)
if [ ! -z "$PID_8080" ]; then
    echo "Found process $PID_8080 on port 8080, stopping it..."
    kill -9 $PID_8080
    sleep 2
    echo "✅ Stopped"
else
    echo "No process found on port 8080"
fi

# Stop any running instance on port 8084
echo "🛑 Stopping any application on port 8084..."
PID_8084=$(lsof -ti :8084)
if [ ! -z "$PID_8084" ]; then
    echo "Found process $PID_8084 on port 8084, stopping it..."
    kill -9 $PID_8084
    sleep 2
    echo "✅ Stopped"
else
    echo "No process found on port 8084"
fi

echo ""
echo "📦 Rebuilding the application..."
cd "$(dirname "$0")"
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🚀 Starting the application on port 8084..."
echo "📍 Server will be available at: http://localhost:8084"
echo "📍 Comparison page: http://localhost:8084/comparison.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the application
java -jar target/premium.jar


#!/bin/bash

# Premium Calculator - Run Script
echo "========================================="
echo "Premium Calculator - Starting Application"
echo "========================================="
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Error: Java is not installed or not in PATH"
    echo "Please install Java 17 or higher"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Error: Maven is not installed or not in PATH"
    echo "Please install Maven 3.6 or higher"
    exit 1
fi

echo "✅ Java and Maven found"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "📦 Building the application..."
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🚀 Starting the application..."
echo "📍 Server will be available at: http://localhost:8080"
echo "📍 Comparison page: http://localhost:8080/comparison.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the application
java -jar target/premium.jar


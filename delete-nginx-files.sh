#!/bin/bash

# Script to delete unwanted Nginx configuration files
# Run this on the server

echo "Deleting unwanted Nginx configuration files..."

# Delete premium-calculatorh
if [ -f "/etc/nginx/sites-available/premium-calculatorh" ]; then
    sudo rm /etc/nginx/sites-available/premium-calculatorh
    echo "✅ Deleted: premium-calculatorh"
else
    echo "ℹ️  File not found: premium-calculatorh"
fi

# Delete premium-calculator.save
if [ -f "/etc/nginx/sites-available/premium-calculator.save" ]; then
    sudo rm /etc/nginx/sites-available/premium-calculator.save
    echo "✅ Deleted: premium-calculator.save"
else
    echo "ℹ️  File not found: premium-calculator.save"
fi

# Also check and remove from sites-enabled if symlinks exist
if [ -L "/etc/nginx/sites-enabled/premium-calculatorh" ]; then
    sudo rm /etc/nginx/sites-enabled/premium-calculatorh
    echo "✅ Removed symlink: /etc/nginx/sites-enabled/premium-calculatorh"
fi

if [ -L "/etc/nginx/sites-enabled/premium-calculator.save" ]; then
    sudo rm /etc/nginx/sites-enabled/premium-calculator.save
    echo "✅ Removed symlink: /etc/nginx/sites-enabled/premium-calculator.save"
fi

echo ""
echo "Verifying deletion..."
ls -la /etc/nginx/sites-available/ | grep premium

echo ""
echo "✅ Done! Test Nginx configuration:"
echo "   sudo nginx -t"


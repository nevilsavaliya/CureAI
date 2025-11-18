#!/bin/bash

echo "Fixing Angular compilation issues..."
echo "======================================"
echo ""

# Stop any running Angular server
echo "1. Stopping any running Angular processes..."
pkill -f "ng serve" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
sleep 3

# Clear Angular cache
echo "2. Clearing Angular cache..."
rm -rf .angular 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true

# Clear TypeScript build info
echo "3. Clearing TypeScript build info..."
rm -rf dist 2>/dev/null || true
rm -f tsconfig.tsbuildinfo 2>/dev/null || true
rm -f tsconfig.app.tsbuildinfo 2>/dev/null || true
rm -f tsconfig.spec.tsbuildinfo 2>/dev/null || true

# Touch all TypeScript files to force recompilation
echo "4. Forcing recompilation of TypeScript files..."
find src -name "*.ts" -exec touch {} \;

# Clear npm cache
echo "5. Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✓ Cleanup complete!"
echo ""
echo "Now run: npm start"
echo ""
echo "If error persists, run: npm install && npm start"
echo ""

#!/bin/bash

# Hotjar-like Analytics Tracker - Setup Script
# This script sets up and runs the complete tracking system

set -e

echo "🎯 Hotjar-like Analytics Tracker - Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Build the SDK
echo "🔨 Building SDK and loader..."
npm run build
echo "✅ Build complete"
echo ""

# Show build output
if [ -f "dist/loader.min.js" ] && [ -f "dist/sdk.min.js" ]; then
    echo "📊 Build Output:"
    echo "  - Loader: $(wc -c < dist/loader.min.js) bytes"
    echo "  - SDK: $(wc -c < dist/sdk.min.js) bytes"
    echo ""
fi

# Create data directory
mkdir -p data/events
echo "✅ Created data directory"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start backend:  npm run dev:backend"
echo "  2. Start demo:     npm run dev:demo"
echo "  3. Open browser:   http://localhost:3000"
echo ""
echo "Or run both with:    npm run dev"
echo ""
echo "📚 Documentation:"
echo "  - Quick start:     QUICKSTART.md"
echo "  - Full docs:       README.md"
echo "  - Examples:        EXAMPLES.md"
echo "  - Architecture:    ARCHITECTURE.md"
echo ""
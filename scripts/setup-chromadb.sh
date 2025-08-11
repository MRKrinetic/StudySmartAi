#!/bin/bash

# ChromaDB Setup Script for Unix/Linux/macOS
# This script sets up ChromaDB for the StudySmart Pro application

echo "🚀 Setting up ChromaDB for StudySmart Pro..."

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed or not in PATH"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
else
    PYTHON_CMD="python"
    PIP_CMD="pip"
fi

echo "✅ Python found: $($PYTHON_CMD --version)"

# Check if pip is available
if ! command -v $PIP_CMD &> /dev/null; then
    echo "❌ pip is not available"
    echo "Please ensure pip is installed with Python"
    exit 1
fi

echo "✅ pip found: $($PIP_CMD --version)"

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# Check if ChromaDB is already installed
if command -v chroma &> /dev/null; then
    echo "✅ ChromaDB already installed: $(chroma --version)"
else
    echo "📦 Installing ChromaDB..."
    if $PIP_CMD install chromadb; then
        echo "✅ ChromaDB installed successfully"
    else
        echo "❌ Failed to install ChromaDB"
        echo "Try running: $PIP_CMD install --upgrade pip && $PIP_CMD install chromadb"
        exit 1
    fi
fi

# Start ChromaDB server
echo "🚀 Starting ChromaDB server on localhost:8000..."
# Start ChromaDB in background
echo "Starting ChromaDB server..."
nohup chroma run --host localhost --port 8000 > chromadb.log 2>&1 &
CHROMA_PID=$!

# Wait for ChromaDB to be ready
echo "⏳ Waiting for ChromaDB to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    sleep 2
    attempt=$((attempt + 1))

    if curl -s -f "http://localhost:8000/api/v1/heartbeat" > /dev/null 2>&1; then
        echo "✅ ChromaDB is ready!"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ ChromaDB failed to start after $max_attempts attempts"
        echo "Check logs: cat chromadb.log"
        echo "Try starting manually: chroma run --host localhost --port 8000"
        exit 1
    fi

    echo "⏳ Attempt $attempt/$max_attempts - ChromaDB not ready yet..."
done
    
    # Test ChromaDB connection
    echo "🔍 Testing ChromaDB connection..."
    if version_response=$(curl -s "http://localhost:8000/api/v1/version" 2>/dev/null); then
        version=$(echo "$version_response" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        echo "✅ ChromaDB version: $version"
    else
        echo "⚠️ ChromaDB is running but API test failed"
    fi
    
echo ""
echo "🎉 ChromaDB setup complete!"
echo "📍 ChromaDB is running at: http://localhost:8000"
echo "🔧 To stop ChromaDB: kill $CHROMA_PID"
echo "📊 To view logs: cat chromadb.log"
echo "📋 Process ID: $CHROMA_PID"
echo ""
echo "Next steps:"
echo "1. Keep ChromaDB running in the background"
echo "2. Start your application: npm run dev"
echo "3. The app will automatically connect to ChromaDB"
echo ""
echo "⚠️  Important: ChromaDB is running in background (PID: $CHROMA_PID)"
echo "To stop it later, run: kill $CHROMA_PID"

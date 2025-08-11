# ChromaDB Setup Script for Windows
# This script sets up ChromaDB for the StudySmart Pro application

Write-Host "🚀 Setting up ChromaDB for StudySmart Pro..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if pip is available
try {
    $pipVersion = pip --version
    Write-Host "✅ pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pip is not available" -ForegroundColor Red
    Write-Host "Please ensure pip is installed with Python" -ForegroundColor Yellow
    exit 1
}

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "📁 Project root: $projectRoot" -ForegroundColor Cyan

# Check if ChromaDB is already installed
try {
    $chromaVersion = chroma --version 2>$null
    Write-Host "✅ ChromaDB already installed: $chromaVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing ChromaDB..." -ForegroundColor Yellow
    try {
        pip install chromadb
        Write-Host "✅ ChromaDB installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install ChromaDB" -ForegroundColor Red
        Write-Host "Try running: pip install --upgrade pip && pip install chromadb" -ForegroundColor Yellow
        exit 1
    }
}

# Start ChromaDB server
Write-Host "🚀 Starting ChromaDB server on localhost:8000..." -ForegroundColor Cyan
try {
    
    # Start ChromaDB in background
    Write-Host "Starting ChromaDB server..." -ForegroundColor Yellow
    $chromaProcess = Start-Process -NoNewWindow -PassThru -FilePath "chroma" -ArgumentList "run", "--host", "localhost", "--port", "8000"

    # Wait for ChromaDB to be ready
    Write-Host "⏳ Waiting for ChromaDB to be ready..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0

    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/heartbeat" -Method GET -TimeoutSec 5
            if ($response) {
                Write-Host "✅ ChromaDB is ready!" -ForegroundColor Green
                break
            }
        } catch {
            if ($attempt -eq $maxAttempts) {
                Write-Host "❌ ChromaDB failed to start after $maxAttempts attempts" -ForegroundColor Red
                Write-Host "Try starting manually: chroma run --host localhost --port 8000" -ForegroundColor Yellow
                exit 1
            }
            Write-Host "⏳ Attempt $attempt/$maxAttempts - ChromaDB not ready yet..." -ForegroundColor Yellow
        }
    } while ($attempt -lt $maxAttempts)
    
    # Test ChromaDB connection
    Write-Host "🔍 Testing ChromaDB connection..." -ForegroundColor Cyan
    try {
        $version = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/version" -Method GET
        Write-Host "✅ ChromaDB version: $($version.version)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ ChromaDB is running but API test failed" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 ChromaDB setup complete!" -ForegroundColor Green
    Write-Host "📍 ChromaDB is running at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "🔧 To stop ChromaDB: Press Ctrl+C in the ChromaDB terminal" -ForegroundColor Yellow
    Write-Host "📊 Process ID: $($chromaProcess.Id)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Keep this terminal open (ChromaDB is running)" -ForegroundColor White
    Write-Host "2. Open a new terminal and start your application: npm run dev" -ForegroundColor White
    Write-Host "3. The app will automatically connect to ChromaDB" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Important: Keep ChromaDB running while using the application" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Failed to start ChromaDB: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running manually: chroma run --host localhost --port 8000" -ForegroundColor Yellow
    exit 1
}

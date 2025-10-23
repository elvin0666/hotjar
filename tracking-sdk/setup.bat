@echo off
REM Hotjar-like Analytics Tracker - Setup Script (Windows)

echo.
echo ============================================
echo 🎯 Hotjar-like Analytics Tracker - Setup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

REM Install dependencies
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
) else (
    echo ✅ Dependencies already installed
    echo.
)

REM Build the SDK
echo 🔨 Building SDK and loader...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build complete
echo.

REM Create data directory
if not exist "data\events\" mkdir data\events
echo ✅ Created data directory
echo.

echo 🎉 Setup complete!
echo.
echo Next steps:
echo   1. Start backend:  npm run dev:backend
echo   2. Start demo:     npm run dev:demo
echo   3. Open browser:   http://localhost:3000
echo.
echo Or run both with:    npm run dev
echo.
echo 📚 Documentation:
echo   - Quick start:     QUICKSTART.md
echo   - Full docs:       README.md
echo   - Examples:        EXAMPLES.md
echo   - Architecture:    ARCHITECTURE.md
echo.

pause
@echo off
echo ===================================================================
echo Starting Adaptive Sorting Algorithm Benchmarking Tool
echo ===================================================================

:: Ensure C++ engine is built
if not exist "%~dp0cpp\sorter.exe" (
    echo [1/3] Compiling C++ sorting engine with g++...
    call "%~dp0cpp\build.bat"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to compile C++ engine.
        pause
        exit /b %ERRORLEVEL%
    )
) else (
    echo [1/3] C++ engine binary already exists at cpp\sorter.exe
)

echo [2/3] Starting Node.js backend server on port 5050...
start "Sorting Benchmarker Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

echo [3/3] Starting Vite React frontend on port 5173...
start "Sorting Benchmarker Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================================
echo Application successfully launched!
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:5050/api/status
echo ===================================================================
pause

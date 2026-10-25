@echo off
echo =======================================================
echo Building Adaptive Sorting C++ Engine with MinGW g++...
echo =======================================================

where g++ >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] g++ compiler not found in PATH!
    exit /b 1
)

g++ -std=c++11 -O2 "%~dp0sorter.cpp" -o "%~dp0sorter.exe" -lpsapi

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] sorter.exe successfully compiled!
) else (
    echo [ERROR] Compilation failed!
    exit /b %ERRORLEVEL%
)

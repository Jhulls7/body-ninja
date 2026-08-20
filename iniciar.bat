@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Body Ninja

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js no esta instalado. Ejecuta instalar.bat primero.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo No se encontraron las dependencias. Ejecutando instalar.bat...
    call "%~dp0instalar.bat"
    if errorlevel 1 exit /b 1
)

echo.
echo Body Ninja se iniciara en http://localhost:5173
echo Mantén esta ventana abierta mientras juegas.
echo.
call npm run dev -- --host 127.0.0.1

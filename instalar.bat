@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Body Ninja - Instalacion

echo.
echo ========================================
echo           BODY NINJA - INSTALACION
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 goto install_node

for /f "tokens=1 delims=." %%A in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%A"
if not defined NODE_MAJOR goto install_node
if %NODE_MAJOR% LSS 20 goto install_node

where npm >nul 2>&1
if errorlevel 1 goto install_node
goto install_dependencies

:install_node
echo Node.js 20 o superior no esta disponible.
echo.
where winget >nul 2>&1
if errorlevel 1 goto node_manual

echo Se instalara Node.js LTS mediante Windows Package Manager.
echo Si Windows solicita permisos, aceptalos para continuar.
echo.
winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements
if errorlevel 1 goto installation_error

set "PATH=%ProgramFiles%\nodejs;%LocalAppData%\Programs\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 goto restart_terminal
goto install_dependencies

:install_dependencies
echo Instalando las dependencias del proyecto...
call npm ci
if errorlevel 1 goto installation_error

echo.
echo Instalacion completada correctamente.
echo Ahora puedes ejecutar iniciar.bat o usar: npm run dev
echo.
pause
exit /b 0

:node_manual
echo No se encontro Windows Package Manager (winget).
echo Instala Node.js 20 o superior desde:
echo https://nodejs.org/en/download
start "" "https://nodejs.org/en/download"
echo Despues de instalarlo, vuelve a ejecutar este archivo.
echo.
pause
exit /b 1

:restart_terminal
echo Node.js se instalo, pero Windows necesita actualizar la terminal.
echo Cierra esta ventana, abre una nueva y ejecuta instalar.bat otra vez.
echo.
pause
exit /b 1

:installation_error
echo.
echo La instalacion no pudo completarse. Revisa el mensaje anterior.
echo.
pause
exit /b 1

@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Publish-GitHub.ps1" -Visibility public %*
set "code=%errorlevel%"
echo.
if not "%code%"=="0" echo GitHub publication did not finish. Read the error above.
pause
exit /b %code%

@echo off
title Catalisa41 - Auto Sync GitHub
cd /d "%~dp0"
echo ====================================================
echo  Iniciando Auto-Sync Catalisa41 -> GitHub
echo ====================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1"
pause

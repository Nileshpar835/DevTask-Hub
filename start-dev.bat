@echo off
start "DevTaskHub - Backend" cmd /k "cd /d %~dp0backend\DevTaskHub.Api && dotnet clean && dotnet build && dotnet run"
start "DevTaskHub - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

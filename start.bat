@echo off
REM Windows 启动脚本：运行本地服务器并打开浏览器
set DIR=%~dp0
"%DIR%dependency\plan-server.exe"

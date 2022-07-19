@echo off
goto :RETRY

:RETRY
ECHO Waiting a while for a network connection...
timeout /t 3
ping -n 1 -w 25 google.com | find "Packets: Sent = 1, Received = 1" > nul
if errorlevel 1 goto :RETRY

ECHO Starting script
start "" "C:\Program Files\Git\git-bash.exe" -c "node scheduler.js"
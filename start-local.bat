@echo off
rem MARCO.OS lokal starten: statischer Server auf Port 8000 + Browser oeffnen.
rem Beenden: Server-Fenster schliessen (oder dort Strg+C).
cd /d "%~dp0"
where py >nul 2>nul && (start "MARCO.OS Server" py -m http.server 8000) || (start "MARCO.OS Server" python -m http.server 8000)
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/"

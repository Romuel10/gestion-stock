@echo off
setlocal
cd /d "%~dp0"
title OrpheNutri Local

echo ==============================================
echo        ORPHENUTRI - EDITION LOCALE
echo ==============================================
echo.

rem Si OrpheNutri tourne deja, on ouvre simplement l'application.
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  start "" "http://127.0.0.1:4173"
  exit /b 0
)

where node >nul 2>&1
if errorlevel 1 (
  echo ERREUR : Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo Installe Node.js 22 ou superieur, puis relance ce fichier.
  echo Le logiciel lui-meme restera ensuite local sur ce PC.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Premiere installation des composants locaux...
  echo Une connexion Internet est necessaire uniquement pour cette premiere installation.
  call npm ci
  if errorlevel 1 (
    echo.
    echo ERREUR : installation des composants impossible.
    pause
    exit /b 1
  )
)

echo Preparation de l'application...
call npm run build
if errorlevel 1 (
  echo.
  echo ERREUR : la construction de l'application a echoue.
  pause
  exit /b 1
)

echo Demarrage du serveur local...
start "OrpheNutri - Serveur local" /min cmd /c "node local-server.mjs"

echo Verification du demarrage...
set /a attempts=0
:wait_server
set /a attempts+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto server_ready
if %attempts% GEQ 15 goto server_failed
timeout /t 1 /nobreak >nul
goto wait_server

:server_ready
echo OrpheNutri est pret.
start "" "http://127.0.0.1:4173"
exit /b 0

:server_failed
echo.
echo ERREUR : OrpheNutri n'a pas pu demarrer sur http://127.0.0.1:4173
echo Verifie qu'aucun autre programme n'utilise le port 4173.
pause
exit /b 1

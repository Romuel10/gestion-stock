@echo off
setlocal
cd /d "%~dp0"
title OrpheNutri Local

echo ==============================================
echo        ORPHENUTRI - EDITION LOCALE
echo ==============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERREUR : Node.js n'est pas installe sur cet ordinateur.
  echo Installe Node.js 22 ou superieur puis relance ce fichier.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Premiere installation des composants locaux...
  echo Une connexion Internet peut etre necessaire uniquement pour cette premiere installation.
  call npm ci
  if errorlevel 1 (
    echo Installation impossible.
    pause
    exit /b 1
  )
)

echo Construction de l'application locale...
call npm run build
if errorlevel 1 (
  echo La construction a echoue.
  pause
  exit /b 1
)

echo.
echo OrpheNutri va s'ouvrir uniquement sur cet ordinateur.
start "" "http://127.0.0.1:4173"
node local-server.mjs

endlocal

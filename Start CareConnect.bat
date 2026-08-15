@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py server.py
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    python server.py
  ) else if exist "C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
    "C:\Users\hp\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" server.py
  ) else (
    goto no_python
  )
)

goto :eof

:no_python
  echo.
  echo Python 3 is needed to start CareConnect.
  echo Install it from https://www.python.org/downloads/
  pause

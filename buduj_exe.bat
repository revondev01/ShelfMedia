@echo off
chcp 65001 >nul
echo ========================================================
echo    KOMPILATOR MEDIA & GAME TRACKER DO PLIKU .EXE
echo ========================================================
echo.

:: 1. Sprawdzenie czy Python jest zainstalowany
python --version >nul 2>&1
if errorlevel 1 (
    echo [BLAD] Python nie zostal wykryty w systemie!
    echo Zainstaluj Pythona ze strony https://www.python.org/downloads/
    echo Pamietaj, aby podczas instalacji zaznaczyc: "Add Python to PATH"!
    echo.
    pause
    exit /b 1
)

echo [1/3] Sprawdzanie i instalowanie wymaganych bibliotek...
:: Usuniecie przestarzalego pakietu enum34, ktory jest niekompatybilny z PyInstallerem w Pythonie 3.10+
python -m pip uninstall -y enum34 >nul 2>&1

pip install --upgrade customtkinter matplotlib pyinstaller
if errorlevel 1 (
    echo [BLAD] Wystapil blad podczas instalowania pakietow pip.
    pause
    exit /b 1
)

echo.
echo [2/3] Budowanie samodzielnego pliku MediaTracker.exe...
echo To moze potrwac okolo 1-2 minut...
echo.

:: Flaga --collect-all customtkinter jest kluczowa, poniewaz customtkinter wymaga plikow JSON motywow i czcionek
pyinstaller --noconsole --onefile --collect-all customtkinter --name "MediaTracker" media_tracker.py

if errorlevel 1 (
    echo.
    echo [BLAD] Wystapil blad podczas kompilacji PyInstaller!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [3/3] SUKCES! Aplikacja zostala skompilowana.
echo.
echo Twoj plik EXE znajduje sie w folderze:
echo    .\dist\MediaTracker.exe
echo.
echo Mozesz skopiowac plik "MediaTracker.exe" w dowolne miejsce
echo (na pulpit, pendrive) i uruchamiac go bez konsoli!
echo ========================================================
echo.
pause

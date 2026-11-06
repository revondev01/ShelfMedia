import JSZip from 'jszip';
import { MediaItem, DEFAULT_ITEM_TYPES, DEFAULT_PLATFORMS, DEFAULT_PLATFORM_COLORS, DEFAULT_GENRES, DEFAULT_TYPE_CONFIGS } from '../types';
import README_MD from '../../README.md?raw';

const SERVER_PY = `"""
ShelfMedia Turbo Localhost Server (Port 8765)
Obsluguje aplikacje lokalnie (100% offline, RAM-cache + wielowatkowosc).
"""
import http.server
import socketserver
import socket
import os
import sys
import json
import subprocess

PORT = 8765

DIR = os.path.dirname(os.path.abspath(__file__))
if DIR:
    os.chdir(DIR)

DB_FILE = os.path.join(DIR, "shelfmedia_db.json")

MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".csv": "text/csv; charset=utf-8",
}

# Pre-load static assets into RAM at startup for sub-millisecond serving
STATIC_CACHE = {}

def preload_static_files():
    preload_paths = [
        ("index.html", "index.html"),
        ("assets/style.css", os.path.join("assets", "style.css")),
        ("assets/app.js", os.path.join("assets", "app.js")),
    ]
    for url_key, rel_path in preload_paths:
        full_p = os.path.join(DIR, rel_path)
        if os.path.isfile(full_p):
            try:
                with open(full_p, "rb") as f:
                    ext = os.path.splitext(full_p)[1].lower()
                    mime = MIME_MAP.get(ext, "application/octet-stream")
                    STATIC_CACHE[url_key] = (f.read(), mime)
            except Exception:
                pass

class TurboThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 64

class FastSyncHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def setup(self):
        super().setup()
        try:
            self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            self.connection.settimeout(5.0)
        except Exception:
            pass

    def log_message(self, format, *args):
        # Wyłączamy wolne logowanie każdego zapytania do konsoli Windows
        pass

    def send_cors_headers(self, cache_header="no-cache"):
        origin = self.headers.get("Origin", "")
        allowed_origin = origin if origin and origin != "null" else "*"
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, Cache-Control")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", cache_header)
        self.send_header("Connection", "close")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0].lstrip("/")

        if clean_path == "api/sync":
            data = {"updatedAt": 0}
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, "r", encoding="utf-8-sig") as f:
                        loaded = json.load(f)
                        if isinstance(loaded, dict):
                            data = loaded
                except Exception:
                    pass
            payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_cors_headers("no-cache, no-store, must-revalidate")
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if clean_path == "api/sync/stream":
            self.send_response(204)
            self.send_cors_headers()
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        if not clean_path:
            clean_path = "index.html"

        # 1. Natychmiastowa odpowiedź z pamięci RAM (0 ms odczytu z dysku)
        if clean_path in STATIC_CACHE:
            body, mime = STATIC_CACHE[clean_path]
            cache_hdr = "public, max-age=31536000, immutable" if clean_path.startswith("assets/") else "no-cache"
            self.send_response(200)
            self.send_cors_headers(cache_hdr)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 2. Fallback dla dodatkowych plików na dysku
        candidate = os.path.abspath(os.path.join(DIR, clean_path.replace("/", os.sep)))
        if not candidate.startswith(os.path.abspath(DIR)) or not os.path.isfile(candidate):
            if "index.html" in STATIC_CACHE:
                body, mime = STATIC_CACHE["index.html"]
                self.send_response(200)
                self.send_cors_headers("no-cache")
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            candidate = os.path.join(DIR, "index.html")

        if os.path.isfile(candidate):
            with open(candidate, "rb") as f:
                body = f.read()
            ext = os.path.splitext(candidate)[1].lower()
            mime = MIME_MAP.get(ext, "application/octet-stream")
            self.send_response(200)
            self.send_cors_headers("no-cache")
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.send_header("Content-Length", "0")
            self.end_headers()

    def do_POST(self):
        clean_path = self.path.split("?")[0].lstrip("/")
        if clean_path == "api/sync":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 15 * 1024 * 1024:
                    self.send_response(413 if length > 0 else 400)
                    self.send_cors_headers("no-cache")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                raw_body = self.rfile.read(length).decode("utf-8-sig")
                incoming = json.loads(raw_body)
                current_ts = 0
                if os.path.exists(DB_FILE):
                    try:
                        with open(DB_FILE, "r", encoding="utf-8-sig") as f:
                            existing = json.load(f)
                            if isinstance(existing, dict):
                                current_ts = existing.get("updatedAt", 0) or 0
                    except Exception:
                        pass
                incoming_ts = incoming.get("updatedAt", 0) if isinstance(incoming, dict) else 0
                if isinstance(incoming_ts, (int, float)) and incoming_ts >= current_ts:
                    tmp_file = DB_FILE + ".tmp"
                    with open(tmp_file, "w", encoding="utf-8") as f:
                        json.dump(incoming, f, ensure_ascii=False)
                    os.replace(tmp_file, DB_FILE)
                    current_ts = incoming_ts
                resp = json.dumps({"ok": True, "updatedAt": current_ts}).encode("utf-8")
                self.send_response(200)
                self.send_cors_headers("no-cache")
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                err_resp = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(500)
                self.send_cors_headers("no-cache")
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(err_resp)))
                self.end_headers()
                self.wfile.write(err_resp)
            return
        self.send_response(404)
        self.send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

def open_browser_fast(url):
    try:
        if hasattr(os, "startfile"):
            os.startfile(url)
        else:
            import webbrowser
            webbrowser.open(url)
    except Exception:
        pass

def free_port_if_needed(port):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.15)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                subprocess.run(
                    f'for /f "tokens=5" %a in (\\'netstat -ano -p tcp ^| findstr ":{port} "\\') do taskkill /F /PID %a >nul 2>&1',
                    shell=True
                )
    except Exception:
        pass

def run():
    preload_static_files()
    url = f"http://127.0.0.1:{PORT}"
    print("=" * 60)
    print(f"   SHELFMEDIA v2.8 - TURBO SERWER LOCALHOST (Port {PORT})")
    print("=" * 60)
    print(f"\\n[OK] Zasoby zaladowane do RAM ({len(STATIC_CACHE)} pliki).")
    print(f"[OK] Serwer dziala pod adresem: {url}")
    print("Aplikacja dziala lokalnie. Nie zamykaj tego okna podczas pracy.")
    print("Aby zakonczyc prace, nacisnij Ctrl+C lub zamknij to okno.\\n")
    try:
        free_port_if_needed(PORT)
        try:
            httpd = TurboThreadingTCPServer(("127.0.0.1", PORT), FastSyncHandler)
        except OSError:
            free_port_if_needed(PORT)
            httpd = TurboThreadingTCPServer(("127.0.0.1", PORT), FastSyncHandler)
        with httpd:
            open_browser_fast(url)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nZatrzymano serwer.")
    except Exception as e:
        print(f"\\n[Blad serwera]: {e}")
        input("\\nNacisnij ENTER, aby zakonczyc...")

if __name__ == "__main__":
    run()
`;

const SERVER_PS1 = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'
$port = 8765
$dir = $PSScriptRoot
if ([string]::IsNullOrEmpty($dir)) { $dir = Split-Path -Parent $MyInvocation.MyCommand.Path }
if ([string]::IsNullOrEmpty($dir)) { $dir = (Get-Location).Path }
$dbFile = Join-Path $dir 'shelfmedia_db.json'
$dbTmpFile = Join-Path $dir 'shelfmedia_db.json.tmp'
Set-Location -LiteralPath $dir

Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '   SHELFMEDIA v2.8 - TURBO SERWER POWERSHELL LOCALHOST' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan

$crlf = [char]13 + [char]10
$cors = 'Access-Control-Allow-Origin: *' + $crlf + 'Access-Control-Allow-Methods: GET, POST, OPTIONS' + $crlf + 'Access-Control-Allow-Headers: Content-Type, Accept, Cache-Control' + $crlf + 'Access-Control-Allow-Private-Network: true' + $crlf

function Build-HttpPacket([byte[]]$bodyBytes, [string]$mime, [string]$cacheCtrl) {
    $hdr = 'HTTP/1.1 200 OK' + $crlf + $cors + 'Content-Type: ' + $mime + $crlf + 'Content-Length: ' + $bodyBytes.Length + $crlf + 'Cache-Control: ' + $cacheCtrl + $crlf + 'X-Content-Type-Options: nosniff' + $crlf + 'Connection: close' + $crlf + $crlf
    $hdrBytes = [System.Text.Encoding]::ASCII.GetBytes($hdr)
    $packet = New-Object byte[] ($hdrBytes.Length + $bodyBytes.Length)
    [System.Buffer]::BlockCopy($hdrBytes, 0, $packet, 0, $hdrBytes.Length)
    [System.Buffer]::BlockCopy($bodyBytes, 0, $packet, $hdrBytes.Length, $bodyBytes.Length)
    return ,$packet
}

# Pre-build HTTP response packets in RAM at startup for instant (<2ms) serving
$ramPackets = @{}
$indexFile = Join-Path $dir 'index.html'
if (Test-Path -LiteralPath $indexFile -PathType Leaf) {
    $b = [System.IO.File]::ReadAllBytes($indexFile)
    $ramPackets['index.html'] = Build-HttpPacket $b 'text/html; charset=utf-8' 'no-cache'
}
$cssFile = Join-Path $dir (Join-Path 'assets' 'style.css')
if (Test-Path -LiteralPath $cssFile -PathType Leaf) {
    $b = [System.IO.File]::ReadAllBytes($cssFile)
    $ramPackets['assets/style.css'] = Build-HttpPacket $b 'text/css; charset=utf-8' 'public, max-age=31536000, immutable'
}
$jsFile = Join-Path $dir (Join-Path 'assets' 'app.js')
if (Test-Path -LiteralPath $jsFile -PathType Leaf) {
    $b = [System.IO.File]::ReadAllBytes($jsFile)
    $ramPackets['assets/app.js'] = Build-HttpPacket $b 'application/javascript; charset=utf-8' 'public, max-age=31536000, immutable'
}

$optHdr = 'HTTP/1.1 204 No Content' + $crlf + $cors + 'Content-Length: 0' + $crlf + 'Connection: close' + $crlf + $crlf
$optPacket = [System.Text.Encoding]::ASCII.GetBytes($optHdr)

$notFoundHdr = 'HTTP/1.1 404 Not Found' + $crlf + $cors + 'Content-Length: 0' + $crlf + 'Connection: close' + $crlf + $crlf
$notFoundPacket = [System.Text.Encoding]::ASCII.GetBytes($notFoundHdr)

# Free port 8765 if an old background instance is still holding it
try {
    $existingConns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($existingConns) {
        foreach ($c in $existingConns) {
            if ($c.OwningProcess -and $c.OwningProcess -ne $PID) {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
        [System.Threading.Thread]::Sleep(150)
    }
} catch {}

try {
    $tcp = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
    $tcp.Start()

    Write-Host ('[OK] Zasoby wczytane do pamieci RAM (' + $ramPackets.Count + ' pliki).') -ForegroundColor Green
    Write-Host ('[OK] Serwer ShelfMedia aktywny pod adresem: http://127.0.0.1:' + $port + '/') -ForegroundColor Green
    Write-Host '(Nie zamykaj tego okna konsoli podczas korzystania z ShelfMedia)' -ForegroundColor Gray
    Write-Host ''
    Start-Process ('http://127.0.0.1:' + $port + '/')

    while ($true) {
        $client = $null
        $stream = $null
        try {
            $client = $tcp.AcceptTcpClient()
            $client.NoDelay = $true
            $client.ReceiveTimeout = 3000
            $client.SendTimeout = 5000
            $stream = $client.GetStream()

            # Wait briefly for browser request bytes (ignore empty preconnect sockets)
            $waited = 0
            while (-not $stream.DataAvailable -and $waited -lt 150) {
                [System.Threading.Thread]::Sleep(3)
                $waited += 3
            }
            if (-not $stream.DataAvailable) { continue }

            $mem = New-Object System.IO.MemoryStream
            $buf = New-Object byte[] 8192
            $headerEnd = -1
            while ($headerEnd -lt 0) {
                $r = $stream.Read($buf, 0, $buf.Length)
                if ($r -le 0) { break }
                $mem.Write($buf, 0, $r)
                $arr = $mem.ToArray()
                for ($i = 0; $i -le $arr.Length - 4; $i++) {
                    if ($arr[$i] -eq 13 -and $arr[$i+1] -eq 10 -and $arr[$i+2] -eq 13 -and $arr[$i+3] -eq 10) {
                        $headerEnd = $i + 4
                        break
                    }
                }
                if ($mem.Length -gt 65536) { break }
            }

            if ($headerEnd -lt 0) { continue }
            $allBytes = $mem.ToArray()
            $headerStr = [System.Text.Encoding]::ASCII.GetString($allBytes, 0, $headerEnd)
            $lines = $headerStr.Split([string[]]@($crlf), [System.StringSplitOptions]::None)
            $reqLine = $lines[0]
            if ([string]::IsNullOrEmpty($reqLine)) { continue }

            $parts = $reqLine.Split(' ')
            $method = if ($parts.Length -ge 1) { $parts[0] } else { 'GET' }
            $p = if ($parts.Length -ge 2) { $parts[1].TrimStart('/') } else { 'index.html' }
            $cleanP = [System.Uri]::UnescapeDataString($p.Split('?')[0])

            $contentLen = 0
            foreach ($hLine in $lines) {
                if ($hLine.StartsWith('Content-Length:', [System.StringComparison]::OrdinalIgnoreCase)) {
                    $valStr = $hLine.Substring(15).Trim()
                    [void][int]::TryParse($valStr, [ref]$contentLen)
                }
            }

            if ($method -eq 'OPTIONS' -or $cleanP -eq 'api/sync/stream') {
                $stream.Write($optPacket, 0, $optPacket.Length)
                continue
            }

            if ($cleanP -eq 'api/sync') {
                if ($method -eq 'POST' -and $contentLen -gt 0 -and $contentLen -le 15728640) {
                    $bodyRead = $allBytes.Length - $headerEnd
                    while ($bodyRead -lt $contentLen) {
                        $r = $stream.Read($buf, 0, [Math]::Min($buf.Length, $contentLen - $bodyRead))
                        if ($r -le 0) { break }
                        $mem.Write($buf, 0, $r)
                        $bodyRead += $r
                    }
                    $finalBytes = $mem.ToArray()
                    if ($finalBytes.Length -ge ($headerEnd + $contentLen)) {
                        $bodyBytes = New-Object byte[] $contentLen
                        [System.Buffer]::BlockCopy($finalBytes, $headerEnd, $bodyBytes, 0, $contentLen)
                        [System.IO.File]::WriteAllBytes($dbTmpFile, $bodyBytes)
                        Move-Item -LiteralPath $dbTmpFile -Destination $dbFile -Force
                    }
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes('{"ok":true}')
                } else {
                    if (Test-Path -LiteralPath $dbFile -PathType Leaf) {
                        $respBytes = [System.IO.File]::ReadAllBytes($dbFile)
                    } else {
                        $respBytes = [System.Text.Encoding]::UTF8.GetBytes('{"updatedAt":0}')
                    }
                }
                $pkt = Build-HttpPacket $respBytes 'application/json; charset=utf-8' 'no-cache'
                $stream.Write($pkt, 0, $pkt.Length)
                continue
            }

            if ([string]::IsNullOrEmpty($cleanP)) { $cleanP = 'index.html' }
            if ($ramPackets.ContainsKey($cleanP)) {
                $pkt = $ramPackets[$cleanP]
                $stream.Write($pkt, 0, $pkt.Length)
            } elseif ($ramPackets.ContainsKey('index.html')) {
                $pkt = $ramPackets['index.html']
                $stream.Write($pkt, 0, $pkt.Length)
            } else {
                $stream.Write($notFoundPacket, 0, $notFoundPacket.Length)
            }
        } catch {
            # Ignore per-connection socket errors so server continues running
        } finally {
            if ($null -ne $stream) { try { $stream.Close() } catch {} }
            if ($null -ne $client) { try { $client.Close() } catch {} }
        }
    }
} catch {
    Write-Host ('[Blad uruchomienia serwera]: ' + $_) -ForegroundColor Red
    Write-Host 'Otwieranie aplikacji w trybie bezposrednim (index.html)...' -ForegroundColor Yellow
    if (Test-Path -LiteralPath $indexFile -PathType Leaf) { Start-Process $indexFile }
    Read-Host 'Nacisnij ENTER, aby zakonczyc'
}
`;

const LAUNCH_LOCALHOST_BAT = `@echo off
chcp 65001 >nul 2>&1
title ShelfMedia - Turbo Serwer Localhost (v2.8)
set "PORT=8765"
cd /d "%~dp0"

echo ========================================================
echo    SHELFMEDIA v2.8 (TURBO LOCALHOST PORTABLE EDITION)
echo ========================================================
echo.
echo Startowanie serwera na http://127.0.0.1:%PORT% ...
echo.

:: 1. Szybki start przez Python 3 (wyszukuje prawdziwy Python z pominieciem atrapy Microsoft Store WindowsApps)
if not exist "server.py" goto :run_ps1
set "REAL_PY="
for /f "delims=" %%I in ('where python 2^>nul') do (
    echo "%%I" | findstr /i "WindowsApps" >nul
    if errorlevel 1 if not defined REAL_PY set "REAL_PY=%%I"
)
if defined REAL_PY (
    "%REAL_PY%" -B "server.py"
    if not errorlevel 1 goto :eof
)

:run_ps1
:: 2. Natychmiastowy start przez wbudowany w system Windows PowerShell (odblokowuje plik i laduje do RAM)
if exist "server.ps1" (
    powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath '.\\server.ps1' -ErrorAction SilentlyContinue; & '.\\server.ps1'"
    goto :check_err
)

:: 3. Fallback: bezposrednie uruchomienie pliku index.html
if exist "index.html" (
    start "" "index.html"
    goto :eof
)

:check_err
if %errorlevel% neq 0 (
    echo.
    echo [Uwaga] Serwer zakonczyl dzialanie z kodem: %errorlevel%
    if exist "index.html" start "" "index.html"
    pause
)
`;

const INSTRUCTIONS_TXT = `=============================================================================
             SHELFMEDIA v2.8 — PACZKA LOCALHOST (PORTABLE EDITION)
=============================================================================

Aplikacja działa w 100% lokalnie na Twoim komputerze bez żadnej instalacji!
Nie musisz instalować żadnych pakietów, Node.js ani zewnętrznych baz danych.

Twoja osobista kolekcja gier, książek, filmów i seriali. Zapis lokalny,
podział rocznikowy i statystyki i generowanie grafik na sociale.

JAK URUCHOMIĆ APLIKACJĘ (PL):
-----------------------------------------------------------------------------
Wypakuj archiwum ZIP do dowolnego folderu i kliknij dwukrotnie plik:

  -> URUCHOM_NA_LOCALHOST.bat
     Uruchamia lekki lokalny serwer w tle (port 8765) i automatycznie otwiera
     aplikację w Twojej domyślnej przeglądarce internetowej pod adresem:
     http://127.0.0.1:8765

Skrypt automatycznie wykrywa dostępny w systemie Python lub wbudowany
w system Windows PowerShell, zwalnia port 8765 i uruchamia ShelfMedia.
Wszystkie dane zapisują się automatycznie (Autosave) w pamięci przeglądarki
oraz w pliku lokalnym "shelfmedia_db.json" w folderze aplikacji.

ZAWARTOŚĆ PACZKI:
-----------------------------------------------------------------------------
- URUCHOM_NA_LOCALHOST.bat       — skrypt startowy (localhost w przeglądarce)
- index.html                     — plik startowy aplikacji z czystą bazą
- assets/ (app.js, style.css)    — skompilowany silnik i style aplikacji
- server.ps1 / server.py         — lokalne mikro-serwery HTTP (PowerShell/Python)
- INSTRUKCJA_URUCHOMIENIA.txt    — niniejsza instrukcja (PL / EN)
- README.md                      — pełna dokumentacja projektu (PL / EN)

GŁÓWNE FUNKCJE SHELFMEDIA v2.8 (PL):
-----------------------------------------------------------------------------
1. Biblioteka, Kolumna "Twórca / Twórcy" i Czysty Start:
   - Pusta baza na start: podczas dodawania nowych dzieł, typów mediów oraz
     platform/formatów aplikacja automatycznie przypisuje im losowe kolory.
   - Kolumna "Twórca / Twórcy" (autor, reżyser, studio itp.) zaraz po kolumnie
     Gatunek — uwzględniona w tabeli, formularzach, szczegółach, kolekcjach,
     statystykach oraz imporcie/eksporcie CSV i JSON.
   - Zakładki roczników: przełączanie pomiędzy "Rok ukończenia" a "Rok wyjścia
     dzieła" oraz czytelne filtrowanie po typie medium.
2. Wirtualna Półka (w Bibliotece i Kolekcjach) oraz Eksport .PNG:
   - Jednolite zakładki widoku "Tabela" / "Wirtualna Półka" w Bibliotece oraz
     w Kolekcjach.
   - Kolorowanie grzbietów wg typu mediów lub wg platformy/formatu.
   - Dynamiczna legenda ("Typ mediów:" z wektorowymi ikonami aplikacji lub
     "Platformy i Formaty:" z kolorami) dostosowująca się dokładnie do
     aktualnie wyświetlanych pozycji na półce.
   - Personalizacja półki (1–20 pozycji, kolory deski, tła, podpórki Bookend)
     oraz podświetlenie LED (status Włączone / Wyłączone + wybór koloru).
   - Eksport widoku półek do plików .png z nagłówkiem "Shelf • [Użytkownik]",
     dynamiczną legendą dopasowaną do zawartości grafiki i automatycznym
     podziałem co 5 półek na kolejne pliki (_1.png, _2.png...).
3. Twoje Kolekcje & Serie:
   - Twórz tematyczne zestawy z własną ikoną i kolorem, oglądaj je na
     wirtualnej półce i generuj grafiki na sociale (16:9, 9:16, 1:1).
4. Statystyki & Roczniki + Generator Podsumowań na Social Media:
   - Zakładki statystyk wg roku ("Cała baza", "Rok wyjścia dzieła",
     "Rok ukończenia") z podziałem na miesiące i obsługą miejsc Ex aequo.
   - Generator grafik podsumowań ("Roczne (Ukończone)" oraz "Miesięczne")
     wykorzystujący wektorowe ikony aplikacji.
5. Zarządzanie Listami Wyboru oraz Kolorami i Ikonami Grzbietów:
   - "Listy wyboru" (pasek górny): "Zarządzaj listami wyboru, kolorami i
     ikonami" (Typy mediów, Platformy i Formaty oraz Gatunki).
   - "Zmień kolory i ikony" (na Wirtualnej Półce): "Zarządzaj kolorami i
     ikonami grzbietów" (Typy mediów oraz Platformy i Formaty).
6. Ustawienia, Kolory UI, Skala Ocen i Kopie Zapasowe:
   - Wybór języka (PL / EN), nazwa użytkownika, personalizacja Ikony Głównej
     Aplikacji, skala ocen (0.5–5.0 lub 0.5–10.0), Kolory UI (8 motywów +
     własne kolory z prawidłową obsługą czerni #000000 i bieli #ffffff),
     pełna kopia zapasowa (.json) oraz poprawny import/eksport CSV.

WYMAGANIA DLA UŻYTKOWNIKA (PL):
-----------------------------------------------------------------------------
1. Przeglądarka internetowa i pamięć lokalna:
   - Aktualna przeglądarka: Google Chrome / Chromium (90+), Microsoft Edge
     (90+), Mozilla Firefox (90+), Opera, Brave, Vivaldi lub Safari (15+).
   - Włączona obsługa JavaScript oraz pamięci localStorage (Autosave).
     Uwaga: Nie zaleca się pracy w trybie prywatnym / Incognito bez pobrania
     kopii zapasowej (.json) przed zamknięciem okna.
   - Połączenie z internetem: NIEWYMAGANE (działa w 100% offline).
2. Wymagania systemowe dla wersji Portable Localhost:
   - Windows 10 / 11 (URUCHOM_NA_LOCALHOST.bat): Brak dodatkowych wymagań —
     skrypt automatycznie korzysta z zainstalowanego Pythona lub wbudowanego
     w system Windows PowerShell (server.ps1).
   - Bezpośrednie otwarcie (index.html): Działa na każdym systemie (Windows,
     macOS, Linux, ChromeOS) po dwukrotnym kliknięciu index.html.
   - Opcjonalnie na macOS / Linux: Python 3 do uruchomienia server.py.
3. Wymagania sprzętowe:
   - Min. 2 GB RAM (zalecane 4 GB+ RAM podczas generowania grafik .PNG 2x).
   - Miejsce na dysku: poniżej 5 MB na aplikację + kilka MB na bazę danych.
   - Ekran: pełna responsywność od 360px (smartfony) po Full HD / 4K (do
     pełnego widoku tabeli i Wirtualnej Półki zalecana szerokość min. 1024px).

=============================================================================
             ENGLISH QUICK START & OVERVIEW — SHELFMEDIA v2.8
=============================================================================

HOW TO LAUNCH (EN):
-----------------------------------------------------------------------------
Extract the ZIP archive to any folder and double-click:

  -> URUCHOM_NA_LOCALHOST.bat
     Starts a lightweight local background server (port 8765) and opens
     ShelfMedia in your default browser at: http://127.0.0.1:8765

All changes are saved automatically (Autosave) in browser localStorage and
synced to "shelfmedia_db.json" in the application folder.

KEY FEATURES (EN):
-----------------------------------------------------------------------------
- Library & "Creator(s)" Column: Starts with a clean empty database that
  auto-assigns random colors to new media types and platforms. Includes the
  "Creator(s)" column (author, director, studio) after Genre everywhere, plus
  "Completion Year" and "Release Year" tabs.
- Virtual Shelf & .PNG Export (in Library & Collections): Unified "Table" and
  "Virtual Shelf" views, spine coloring by Media Type or Platform/Format,
  dynamic legend ("Media Type:" with vector icons or "Platforms & Formats:")
  adapting strictly to displayed items, LED underglow (Enabled / Disabled),
  and .PNG shelf export ("Shelf • [Username]", up to 5 shelves per file).
- Collections & Series: Create themed sets with custom icons and colors, view
  them on the virtual shelf, and generate social graphics.
- Stats & Years + Social Summary Generator: Analyze by Entire DB, Release
  Year, or Completion Year, and generate Annual (Completed) or Monthly social
  cards with vector app icons.
- Settings & Backups: Switch between Polish (PL) and English (EN), toggle
  rating scale (0.5–5.0 / 0.5–10.0), customize the main app icon and UI Theme
  colors, and export/import full .JSON backups or .CSV spreadsheets.

SYSTEM & USER REQUIREMENTS (EN):
-----------------------------------------------------------------------------
1. Browser & Storage:
   - Modern Web Browser: Google Chrome / Chromium (90+), Microsoft Edge (90+),
     Mozilla Firefox (90+), Opera, Brave, Vivaldi, or Apple Safari (15+).
   - JavaScript & localStorage enabled for automatic local saving (Autosave).
      Avoid Private / Incognito mode unless exporting a .json backup before exit.
   - Internet Connection: NOT required (works 100% offline).
2. Operating System (Portable Localhost):
   - Windows 10 / 11 (URUCHOM_NA_LOCALHOST.bat): Zero extra dependencies —
     uses Python if available or built-in Windows PowerShell (server.ps1).
   - Direct Launch (index.html): Works on any OS (Windows, macOS, Linux,
     ChromeOS) by double-clicking index.html.
   - Optional on macOS / Linux: Python 3 to run server.py.
3. Hardware:
   - Min. 2 GB RAM (4 GB+ RAM recommended for high-res 2x Retina .PNG export).
   - Disk Space: Under 5 MB for the app + a few MB for thousands of items.
   - Display: Responsive from 360px mobile screens to Full HD / 4K monitors
     (1024px+ width recommended for full Table and Virtual Shelf views).
=============================================================================
`;

function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function buildStandaloneHtml(
  typesToSeed: string[],
  platformsToSeed: string[],
  genresToSeed: string[],
  typeConfigsToSeed?: Record<string, any>
): string {
  const buildVersion = `${Date.now()}`;

  const seedScript = `
    <script>
      (function() {
        try {
          var itemsKey = 'shelfmedia_items_v2';
          var cleanInitKey = 'shelfmedia_clean_db_v28';
          var typesKey = 'shelfmedia_types_v2';
          var typeConfigsKey = 'shelfmedia_type_configs_v3';
          var platformsKey = 'shelfmedia_platforms_v2';
          var platformColorsKey = 'shelfmedia_platform_colors_v2';
          var genresKey = 'shelfmedia_genres_v2';
          var collectionsKey = 'shelfmedia_collections_v1';
          var appLogoKey = 'shelfmedia_app_logo_v1';

          if (!localStorage.getItem(cleanInitKey)) {
            localStorage.removeItem('steam_media_tracker_items_v2');
            localStorage.setItem(itemsKey, '[]');
            localStorage.setItem(typesKey, '[]');
            localStorage.setItem(typeConfigsKey, '{}');
            localStorage.setItem(platformsKey, '[]');
            localStorage.setItem(platformColorsKey, '{}');
            localStorage.setItem(genresKey, '[]');
            localStorage.setItem(cleanInitKey, 'true');
          } else if (!localStorage.getItem(itemsKey)) {
            localStorage.setItem(itemsKey, '[]');
          }

          if (!localStorage.getItem(collectionsKey)) {
            localStorage.setItem(collectionsKey, '[]');
          }

          if (!localStorage.getItem(appLogoKey)) {
            localStorage.setItem(appLogoKey, ${safeJsonForScript(JSON.stringify({ icon: 'Library', iconColor: '#ffffff', bgColor: '#1999e3' }))});
          }

          if (!localStorage.getItem(typesKey)) {
            localStorage.setItem(typesKey, ${safeJsonForScript(JSON.stringify(typesToSeed))});
          }

          if (${Boolean(typeConfigsToSeed)}) {
            if (!localStorage.getItem(typeConfigsKey)) {
              localStorage.setItem(typeConfigsKey, ${safeJsonForScript(JSON.stringify(typeConfigsToSeed || {}))});
            }
          }

          if (!localStorage.getItem(platformsKey)) {
            localStorage.setItem(platformsKey, ${safeJsonForScript(JSON.stringify(platformsToSeed))});
          }
          if (!localStorage.getItem(platformColorsKey)) {
            localStorage.setItem(platformColorsKey, ${safeJsonForScript(JSON.stringify(DEFAULT_PLATFORM_COLORS))});
          }
          if (!localStorage.getItem(genresKey)) {
            localStorage.setItem(genresKey, ${safeJsonForScript(JSON.stringify(genresToSeed))});
          }
        } catch (e) {
          console.error('Błąd inicjalizacji pustej bazy lokalnej:', e);
        }
      })();
    </script>
  `;

  return `<!doctype html>
<html lang="pl" style="color-scheme: dark;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <title>ShelfMedia - Twoja półka na media</title>
    <meta name="description" content="ShelfMedia - Twoja półka na media: lokalny tracker dzieł kultury, gier, książek, filmów i seriali (100% offline localhost)." />
    <link rel="stylesheet" href="./assets/style.css?v=${buildVersion}" />
    ${seedScript}
  </head>
  <body class="bg-[#0f1722] text-[#c7d5e0]" style="color-scheme: dark; forced-color-adjust: none;">
    <div id="root"></div>
    <script src="./assets/app.js?v=${buildVersion}"></script>
  </body>
</html>`;
}

export async function downloadPortableZip(
  _currentItems?: MediaItem[],
  _customPlatforms?: string[],
  _customGenres?: string[],
  _customTypes?: string[],
  _customTypeConfigs?: Record<string, any>
): Promise<void> {
  const zip = new JSZip();

  const typesToUse = DEFAULT_ITEM_TYPES;
  const platformsToUse = DEFAULT_PLATFORMS;
  const genresToUse = DEFAULT_GENRES;

  let jsContent = "";
  let cssContent = "";

  // 1. Pobieramy najświeższy skompilowany kod z /portable/app.js i /portable/style.css z wymuszeniem odświeżenia pamięci podręcznej (cache: no-store)
  try {
    const ts = Date.now();
    const [jsRes, cssRes] = await Promise.all([
      fetch(`/portable/app.js?t=${ts}`, { cache: 'no-store' }),
      fetch(`/portable/style.css?t=${ts}`, { cache: 'no-store' })
    ]);
    if (jsRes.ok) jsContent = await jsRes.text();
    if (cssRes.ok) cssContent = await cssRes.text();
  } catch (err) {
    console.warn("Could not fetch /portable/ assets:", err);
  }

  // 2. Fallback: wyszukanie w skryptach i stylach aktualnej strony
  if (!jsContent) {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'));
    for (const s of scripts) {
      if (s.src && (s.src.includes('index-') || s.src.includes('main') || s.src.includes('portable') || s.src.includes('app'))) {
        try {
          const res = await fetch(s.src, { cache: 'no-store' });
          if (res.ok) {
            const t = await res.text();
            if (t.length > jsContent.length) jsContent = t;
          }
        } catch {}
      }
    }
  }

  if (!cssContent) {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
    for (const l of links) {
      if (l.href) {
        try {
          const res = await fetch(l.href, { cache: 'no-store' });
          if (res.ok) {
            const t = await res.text();
            cssContent += t + "\n";
          }
        } catch {}
      }
    }
  }

  const standaloneHtml = buildStandaloneHtml(typesToUse, platformsToUse, genresToUse, DEFAULT_TYPE_CONFIGS);

  // Wstawiamy index.html oraz pliki do katalogu assets
  zip.file("index.html", standaloneHtml);

  const assetsFolder = zip.folder("assets");
  if (assetsFolder) {
    assetsFolder.file("app.js", jsContent || "// ShelfMedia Application Engine");
    assetsFolder.file("style.css", cssContent || "/* ShelfMedia Stylesheet */");
  }

  const toCrLf = (str: string) => str.replace(/\r?\n/g, "\r\n");

  zip.file("URUCHOM_NA_LOCALHOST.bat", toCrLf(LAUNCH_LOCALHOST_BAT));
  zip.file("server.py", SERVER_PY);
  zip.file("server.ps1", toCrLf(SERVER_PS1));
  zip.file("INSTRUKCJA_URUCHOMIENIA.txt", toCrLf(INSTRUCTIONS_TXT));
  zip.file("README.md", README_MD);

  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });

  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "ShelfMedia_Localhost.zip");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

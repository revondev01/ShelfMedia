import React, { useState } from 'react';
import { Download, Copy, Check, Terminal, ExternalLink, Sparkles, Database, Layout, BarChart, CheckCircle2, Box, Cpu, AlertTriangle, Monitor, Package, Play, Zap, Globe, FolderArchive } from 'lucide-react';
import { downloadPortableZip } from '../utils/zipGenerator';

import { MediaItem, MediaTypeConfig } from '../types';

interface PythonCodeTabProps {
  pythonCode: string;
  items?: MediaItem[];
  platforms?: string[];
  genres?: string[];
  types?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
}

export const PythonCodeTab: React.FC<PythonCodeTabProps> = ({ 
  pythonCode,
  items,
  platforms,
  genres,
  types,
  typeConfigs,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedExeCmd, setCopiedExeCmd] = useState(false);
  const [copiedFixCmd, setCopiedFixCmd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadPortableZip(items, platforms, genres, types, typeConfigs);
    } catch (err) {
      console.error('Błąd podczas generowania paczki ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyFixCmd = async () => {
    try {
      await navigator.clipboard.writeText("python -m pip uninstall -y enum34");
      setCopiedFixCmd(true);
      setTimeout(() => setCopiedFixCmd(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyReq = async () => {
    try {
      await navigator.clipboard.writeText("pip install customtkinter matplotlib pyinstaller");
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyExeCmd = async () => {
    try {
      await navigator.clipboard.writeText('pyinstaller --noconsole --onefile --collect-all customtkinter --name "MediaTracker" media_tracker.py');
      setCopiedExeCmd(true);
      setTimeout(() => setCopiedExeCmd(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadPy = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'media_tracker.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBat = () => {
    const batContent = `@echo off
chcp 65001 >nul
echo ========================================================
echo    KOMPILATOR MEDIA & GAME TRACKER DO PLIKU .EXE
echo ========================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [BLAD] Python nie zostal wykryty w systemie!
    echo Zainstaluj Pythona ze strony https://www.python.org/downloads/
    echo Pamietaj, aby zaznaczyc opcje: "Add Python to PATH"!
    echo.
    pause
    exit /b 1
)

echo [1/3] Sprawdzanie i instalowanie wymaganych bibliotek...
:: Usuniecie przestarzalego pakietu enum34, ktory blokuje PyInstallera w Pythonie 3.10+
python -m pip uninstall -y enum34 >nul 2>&1

pip install --upgrade customtkinter matplotlib pyinstaller
if errorlevel 1 (
    echo [BLAD] Wystapil blad podczas instalacji pip.
    pause
    exit /b 1
)

echo.
echo [2/3] Budowanie samodzielnego pliku MediaTracker.exe...
echo To moze potrwac okolo 1-2 minut...
echo.

pyinstaller --noconsole --onefile --collect-all customtkinter --name "MediaTracker" media_tracker.py

if errorlevel 1 (
    echo.
    echo [BLAD] Wystapil blad podczas kompilacji PyInstaller!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [3/3] SUKCES! Plik EXE zostal utworzony!
echo.
echo Znajdziesz go w podfolderze:
echo    .\\dist\\MediaTracker.exe
echo ========================================================
echo.
pause
`;
    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'buduj_exe.bat');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. TOP HERO SECTION: PORTABLE LOCALHOST ZIP (ZERO INSTALL)    */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-br from-[#16293d] via-[#1b344e] to-[#122232] p-6 sm:p-8 rounded-2xl border-2 border-[#66c0f4] shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#66c0f4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#2a4d6f]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#5c7e10] to-[#79a313] text-white shadow">
                ⭐ Rekomendowane dla każdego
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40">
                100% Płynność (60 FPS jak w Preview)
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Działa na czystym komputerze
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2.5 flex items-center gap-3">
              <Globe className="w-8 h-8 text-[#66c0f4] shrink-0" />
              <span>Paczka Localhost (v2.4): Wirtualna Półka i Tabela bez instalacji</span>
            </h2>

            <p className="text-sm text-[#c7d5e0] max-w-3xl mt-2 leading-relaxed">
              Nie musisz instalować <strong className="text-white">Pythona</strong>, bibliotek <strong className="text-white">pip</strong>, ani żadnych baz danych <strong className="text-white">SQLite</strong>.
              Wypakuj archiwum ZIP na pulpit i kliknij dwukrotnie w plik <code className="text-[#66c0f4] bg-[#0d1622] px-2 py-0.5 rounded border border-[#2a4d6f]">URUCHOM_NA_LOCALHOST.bat</code>.
              Aplikacja uruchamia się w ułamku sekundy na Twoim komputerze z pełną płynnością i zapamiętywaniem wszystkich danych!
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="w-full lg:w-auto shrink-0 flex items-center justify-center gap-2.5 px-7 py-4 bg-gradient-to-r from-[#5c7e10] via-[#6fa013] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white font-black rounded-xl text-base shadow-2xl hover:shadow-[#5c7e10]/40 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isZipping ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Pakowanie archiwum ZIP...</span>
              </>
            ) : (
              <>
                <Package className="w-6 h-6" />
                <span>Pobierz paczkę ZIP (Localhost)</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Proste Kroki Uruchomienia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0f1d2c]/80 p-4 rounded-xl border border-[#2a4d6f] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#21496b] text-[#66c0f4] font-black flex items-center justify-center shrink-0 text-sm">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Wypakuj archiwum ZIP</h4>
              <p className="text-xs text-[#8f98a0] mt-1">
                Pobierz <code className="text-[#66c0f4]">ShelfMedia_Localhost.zip</code> i rozpakuj w dowolne miejsce (np. na Pulpit lub Pendrive).
              </p>
            </div>
          </div>

          <div className="bg-[#0f1d2c]/80 p-4 rounded-xl border border-[#2a4d6f] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#21496b] text-[#66c0f4] font-black flex items-center justify-center shrink-0 text-sm">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Kliknij plik .bat</h4>
              <p className="text-xs text-[#8f98a0] mt-1">
                Uruchom <strong className="text-emerald-400">URUCHOM_NA_LOCALHOST.bat</strong> lub <strong className="text-[#66c0f4]">URUCHOM_W_OKNIE_APLIKACJI.bat</strong>.
              </p>
            </div>
          </div>

          <div className="bg-[#0f1d2c]/80 p-4 rounded-xl border border-[#2a4d6f] flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#21496b] text-[#66c0f4] font-black flex items-center justify-center shrink-0 text-sm">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Gotowe! 100% Płynność</h4>
              <p className="text-xs text-[#8f98a0] mt-1">
                Aplikacja działa na <code className="text-emerald-400">http://localhost:8765</code>. Wszystkie dodane pozycje i oceny zapisują się na stałe!
              </p>
            </div>
          </div>
        </div>

        {/* Informacja o braku konieczności instalacji bibliotek */}
        <div className="mt-4 pt-3 border-t border-[#243d57] flex flex-wrap items-center justify-between text-xs text-[#8f98a0]">
          <span className="flex items-center gap-1.5 text-[#a4d007]">
            <CheckCircle2 className="w-4 h-4" />
            Zawiera wbudowany skrypt serwera dla Windows (PowerShell / Python standard library)
          </span>
          <span className="text-[#66c0f4]">
            Zero konfliktów z bibliotekami • Działa na świeżym Windows 10 & 11
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ALTERNATYWA: APLIKACJA W CZYSTYM PYTHONIE (SQLITE)         */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#1b2838] via-[#212f42] to-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-[#2a475e] text-[#66c0f4]">
                Dla programistów Pythona
              </span>
              <span className="text-xs text-[#8f98a0]">SQLite3 • CustomTkinter • Matplotlib</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2.5">
              <span>Wersja desktopowa w Pythonie:</span>
              <span className="font-mono text-[#66c0f4]">media_tracker.py</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#c7d5e0] max-w-2xl mt-1 leading-relaxed">
              Dla osób, które chcą uruchamiać aplikację bezpośrednio przez interpretera Pythona z lokalnym plikiem bazy <code className="text-[#66c0f4]">media_tracker.db</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleDownloadPy}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2a475e] hover:bg-[#385e80] text-white font-bold rounded-lg shadow transition-all text-xs"
            >
              <Download className="w-4 h-4 text-[#66c0f4]" />
              <span>Pobierz media_tracker.py</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1b2533] hover:bg-[#253346] text-[#c7d5e0] hover:text-white font-medium rounded-lg text-xs transition-all border border-[#2a475e]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Skopiowano!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#66c0f4]" />
                  <span>Kopiuj kod</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. KOMPILACJA DO .EXE (OPCJONALNA DLA CHĘTNYCH)               */}
      {/* ============================================================ */}
      <div className="bg-[#141b24] p-6 rounded-xl border border-[#2a475e] shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#243547]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#1b2838] border border-[#2a475e] text-[#66c0f4]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Opcjonalna kompilacja do pliku <code className="text-[#66c0f4]">MediaTracker.exe</code>
              </h4>
              <p className="text-xs text-[#8f98a0]">
                Jeśli wolisz skompilować plik Pythona do samodzielnego .exe za pomocą PyInstallera.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadBat}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-white text-xs font-semibold rounded-lg border border-[#2a475e] transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
            <span>Pobierz buduj_exe.bat</span>
          </button>
        </div>

        {/* Troubleshooting box for enum34 error */}
        <div className="p-3.5 bg-[#2d1b1b] border border-[#a83232]/60 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#ff6b6b] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#ff8e8e]">Błąd "The 'enum34' package is an obsolete backport"?</span>
              <p className="text-[#d8b4b4] text-[11px] mt-0.5 leading-snug">
                Paczka ZIP powyżej całkowicie omija ten problem, ale jeśli budujesz .exe w Pythonie, wykonaj poniższe polecenie:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <code className="bg-[#1a0f0f] text-[#ffb4b4] px-2.5 py-1.5 rounded font-mono text-[11px] border border-[#a83232]/40 select-all">
              python -m pip uninstall -y enum34
            </code>
            <button
              onClick={handleCopyFixCmd}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#a83232] hover:bg-[#c23b3b] text-white font-semibold text-[11px] rounded transition-all shrink-0 active:scale-95"
            >
              {copiedFixCmd ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFixCmd ? 'Skopiowano!' : 'Kopiuj'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-[#141b24] rounded-xl border border-[#2a475e] shadow-2xl overflow-hidden">
        <div className="bg-[#171a21] px-4 py-3 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e74c3c]" />
            <span className="w-3 h-3 rounded-full bg-[#f39c12]" />
            <span className="w-3 h-3 rounded-full bg-[#27ae60]" />
            <span className="ml-2 text-xs font-mono text-[#c7d5e0]">media_tracker.py (Python 3.8+)</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs text-[#66c0f4] hover:text-white px-2.5 py-1 rounded hover:bg-[#2a475e] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Skopiowano kod!' : 'Kopiuj całość'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs text-[#c7d5e0] leading-relaxed selection:bg-[#2a475e]">
          <pre>{pythonCode}</pre>
        </div>
      </div>
    </div>
  );
};

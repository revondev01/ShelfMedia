import React, { useRef, useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportFullBackup: () => void;
  onImportFullBackup: (file: File) => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  itemsCount: number;
  typesCount: number;
  platformsCount: number;
  genresCount: number;
  gradientsCount: number;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onExportFullBackup,
  onImportFullBackup,
  onExportCsv,
  onImportCsv,
  itemsCount,
  typesCount,
  platformsCount,
  genresCount,
  gradientsCount,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [recentlyExported, setRecentlyExported] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDropError(null);
      onImportFullBackup(file);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDropError(null);
      onImportCsv(file);
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.json')) {
      setDropError(null);
      onImportFullBackup(file);
    } else if (lowerName.endsWith('.csv')) {
      setDropError(null);
      onImportCsv(file);
    } else {
      setDropError(
        t(
          'Proszę wybrać plik .json (pełna kopia zapasowa) lub .csv (arkusz).',
          'Please select a .json (full backup) or .csv (spreadsheet) file.'
        )
      );
    }
  };

  const handleTriggerExport = () => {
    onExportFullBackup();
    setRecentlyExported(true);
    setTimeout(() => setRecentlyExported(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#1b2838] border border-[#2a475e] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600/30 to-[#a4d007]/20 border border-[#a4d007]/50 text-[#a4d007]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                {t('Kopia Zapasowa & Bezpieczeństwo Danych', 'Database Backup & Data Security')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Zapisz bazę w pliku, aby odtworzyć ją w dowolnej przeglądarce lub po awarii sprzętu',
                  'Save your database to a file to restore it in any browser or after hardware failure'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8f98a0] hover:text-white p-1.5 rounded-lg hover:bg-[#2a475e]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary */}
        <div className="bg-[#131b26] px-6 py-2.5 border-b border-[#243547] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#8f98a0] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#66c0f4]" />
            {t('Aktualny stan biblioteki:', 'Current library state:')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#1b2838] px-2 py-0.5 rounded border border-[#2a475e] text-white font-medium">
              {t('Pozycji:', 'Items:')} <strong className="text-[#66c0f4]">{itemsCount}</strong>
            </span>
            <span className="bg-[#1b2838] px-2 py-0.5 rounded border border-[#2a475e] text-white font-medium">
              {t('Typów:', 'Types:')} <strong className="text-amber-400">{typesCount}</strong>
            </span>
            <span className="bg-[#1b2838] px-2 py-0.5 rounded border border-[#2a475e] text-white font-medium">
              {t('Formatów:', 'Platforms:')} <strong className="text-[#a4d007]">{platformsCount}</strong>
            </span>
            <span className="bg-[#1b2838] px-2 py-0.5 rounded border border-[#2a475e] text-white font-medium">
              {t('Gatunków:', 'Genres:')} <strong className="text-purple-400">{genresCount}</strong>
            </span>
            {gradientsCount > 0 && (
              <span className="bg-[#1b2838] px-2 py-0.5 rounded border border-[#2a475e] text-white font-medium">
                {t('Własnych gradientów:', 'Custom gradients:')} <strong className="text-pink-400">{gradientsCount}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={jsonFileInputRef}
          onChange={handleJsonChange}
          accept=".json,application/json"
          className="hidden"
        />
        <input
          type="file"
          ref={csvFileInputRef}
          onChange={handleCsvChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Card 1: Pełny Backup JSON (Zalecany) */}
          <div className="bg-[#141d28] border-2 border-[#a4d007]/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#a4d007] text-[#171a21] text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
              {t('Zalecane 100%', 'Recommended 100%')}
            </div>

            <div className="flex items-start gap-3.5 mb-3">
              <div className="p-2.5 rounded-xl bg-[#a4d007]/10 text-[#a4d007] border border-[#a4d007]/30 shrink-0">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {t('Pełna Kopia Zapasowa (Format JSON)', 'Full System & Database Backup (JSON Format)')}
                </h3>
                <p className="text-xs text-[#8f98a0] mt-1 leading-relaxed">
                  {t(
                    'Zapisuje w jednym pliku wszystko: całą bazę dzieł, recenzje, oceny, strony, godziny, własne typy mediów (z przypisanymi kolorami i ikonami), formaty, gatunki oraz zapisane własne gradienty grafik.',
                    'Saves everything in a single file: your entire media collection, reviews, ratings, pages, hours, custom media types (with their colors and icons), platforms, genres, and saved custom gradients.'
                  )}
                </p>
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mt-4 p-4 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center ${
                dragOver 
                  ? 'border-[#a4d007] bg-[#a4d007]/10' 
                  : 'border-[#2a475e] bg-[#171a21]/60 hover:border-[#66c0f4]/50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleTriggerExport}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
                >
                  {recentlyExported ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>{t('Pobrano kopię!', 'Backup downloaded!')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t('Pobierz pełną kopię (.json)', 'Download Full Backup (.json)')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2a475e] hover:bg-[#385e80] text-white text-xs font-bold rounded-xl border border-[#66c0f4]/50 shadow transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#66c0f4]" />
                  <span>{t('Wczytaj kopię (.json)', 'Restore Backup (.json)')}</span>
                </button>
              </div>
              <span className="text-[11px] text-[#8f98a0] mt-2 block">
                {t(
                  'Możesz też upuścić plik kopii zapasowej bezpośrednio w to pole.',
                  'You can also drag and drop your backup file directly into this box.'
                )}
              </span>
              {dropError && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-semibold">
                  {dropError}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Eksport / Import CSV + Wymagany Układ Kolumn */}
          <div className="bg-[#16202d] border border-[#2a475e] rounded-xl p-4 shadow space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#66c0f4]/10 text-[#66c0f4] shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {t('Arkusz kalkulacyjny (CSV) • Eksport, Import & Wymagany Układ', 'Spreadsheet (CSV) • Export, Import & Required Layout')}
                  </h4>
                  <p className="text-xs text-[#8f98a0]">
                    {t(
                      'Dla programów Microsoft Excel, LibreOffice Calc lub Google Sheets (obsługuje przecinek "," oraz średnik ";" w UTF-8).',
                      'For Microsoft Excel, LibreOffice Calc, or Google Sheets (supports comma "," and semicolon ";" in UTF-8).'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Required CSV Layout Information Box */}
            <div className="p-3 rounded-xl bg-[#131b26] border border-[#243547] text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#66c0f4]" />
                  {t('Wymagany układ kolumn przy imporcie CSV (1. wiersz nagłówki):', 'Required column layout for CSV import (Row 1 headers):')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  {t('Obowiązkowa tylko kolumna: title / tytuł', 'Only required column: title / tytuł')}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#171a21] border border-[#2a475e]/60 font-mono text-[11px] text-[#66c0f4] overflow-x-auto whitespace-nowrap">
                title,item_type,year,platform,genre,creator,rating,status,hours_spent,pages,date_logged,comment
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#c7d5e0] pt-0.5">
                <div>• <strong className="text-amber-300">title</strong> ({t('lub', 'or')} <code>tytuł</code>) — {t('Tytuł dzieła [WYMAGANE]', 'Item title [REQUIRED]')}</div>
                <div>• <strong className="text-white">item_type</strong> (<code>typ</code>) — {t('Gra, Książka, Film, Serial...', 'Gra, Książka, Film, Serial...')}</div>
                <div>• <strong className="text-white">year</strong> (<code>rok</code>) — {t('Rok wydania (np. 2024)', 'Release year (e.g. 2024)')}</div>
                <div>• <strong className="text-white">platform</strong> (<code>platforma</code>) — {t('np. PC (Cyfrowa), Netflix', 'e.g. PC (Cyfrowa), Netflix')}</div>
                <div>• <strong className="text-white">genre</strong> (<code>gatunek</code>) — {t('np. RPG, Sci-Fi, Kryminał', 'e.g. RPG, Sci-Fi, Thriller')}</div>
                <div>• <strong className="text-white">creator</strong> (<code>twórca</code>) — {t('Autor, reżyser, studio', 'Author, director, studio')}</div>
                <div>• <strong className="text-white">rating</strong> (<code>ocena</code>) — {t('Ocena 0.5–10.0 (np. 9.5)', 'Rating 0.5–10.0 (e.g. 9.5)')}</div>
                <div>• <strong className="text-white">status</strong> (<code>stan</code>) — {t('Ukończone / W trakcie / Planowane', 'Ukończone / W trakcie / Planowane')}</div>
                <div>• <strong className="text-white">hours_spent</strong> (<code>godziny</code>) — {t('Czas w godz. (np. 45.5)', 'Time in hours (e.g. 45.5)')}</div>
                <div>• <strong className="text-white">pages</strong> (<code>strony</code>) — {t('Liczba stron (np. 420)', 'Page count (e.g. 420)')}</div>
                <div>• <strong className="text-white">date_logged</strong> (<code>data</code>) — {t('Data RRRR-MM-DD (np. 2026-10-15)', 'Date YYYY-MM-DD (e.g. 2026-10-15)')}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#243547]">
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold border border-[#2a475e] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
                <span>{t('Eksportuj CSV (Excel)', 'Export CSV (Excel)')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const sampleCsv = `title,item_type,year,platform,genre,creator,rating,status,hours_spent,pages,date_logged,comment\r\n"Wiedźmin 3: Dziki Gon","Gra",2015,"PC (Cyfrowa)","RPG","CD Projekt RED",10.0,"Ukończone",145.5,,"2026-10-15","Arcydzieło fabularne"\r\n"Problem trzech ciał","Książka",2008,"Książka papierowa","Sci-Fi","Cixin Liu",9.0,"Ukończone",14.0,450,"2026-10-20","Świetne sci-fi"`;
                  const blob = new Blob(['\uFEFF' + sampleCsv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'shelfmedia_szablon_importu.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#66c0f4] hover:text-white rounded-lg text-xs font-semibold border border-[#66c0f4]/40 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
                <span>{t('Pobierz wzór CSV do wypełnienia', 'Download Sample CSV Template')}</span>
              </button>

              <button
                type="button"
                onClick={() => csvFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                <span>{t('Wybierz plik i Importuj z CSV', 'Select File & Import CSV')}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Informacja o przenoszeniu na inny komputer */}
          <div className="bg-[#121922] p-3.5 rounded-xl border border-[#243547] flex items-start gap-2.5 text-xs text-[#8f98a0]">
            <Info className="w-4 h-4 text-[#66c0f4] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block">
                {t(
                  'Jak przenieść bazę na nowy komputer lub inną przeglądarkę?',
                  'How to transfer your database to a new computer or another browser?'
                )}
              </strong>
              <p>
                {t(
                  '1. Kliknij „Pobierz pełną kopię (.json)” i zachowaj plik (np. na pendrive, dysku Google czy e-mailu).',
                  '1. Click "Download Full Backup (.json)" and save the file (e.g. on a USB drive, Google Drive, or email).'
                )}
                <br />
                {t(
                  '2. Na nowym komputerze otwórz ShelfMedia i kliknij „Wczytaj kopię (.json)”.',
                  '2. On your new computer, open ShelfMedia and click "Restore Backup (.json)".'
                )}
                <br />
                {t(
                  'Wszystkie Twoje pozycje, typy, kolory, formaty i własne gradienty zostaną natychmiast odtworzone 1:1!',
                  'All your items, types, colors, platforms, and custom gradients will be restored 1:1 immediately!'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

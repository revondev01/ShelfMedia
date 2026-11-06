import React, { useRef, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  Copy,
  Check,
  Info,
  CheckCircle2,
  Table,
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCsv: (file: File) => void;
}

export const SAMPLE_CSV_TEMPLATE = `title,item_type,year,platform,genre,creator,rating,status,hours_spent,pages,date_logged,comment
"Wiedźmin 3: Dziki Gon","Gra",2015,"PC (Cyfrowa)","RPG","CD Projekt RED",10.0,"Ukończone",145.5,,"2026-10-15","Arcydzieło fabularne z dodatkami"
"Problem trzech ciał","Książka",2008,"Książka papierowa","Sci-Fi","Cixin Liu",9.0,"Ukończone",14.0,450,"2026-10-20","Świetne twarde sci-fi"
"Diuna: Część druga","Film",2024,"Kino / IMAX","Sci-Fi","Denis Villeneuve",9.5,"Ukończone",2.8,,"2026-09-12","Niesamowite widowisko audiowizualne"`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportCsv,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const { lang, t } = useLanguage();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCsv(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') || file.type.includes('text'))) {
      onImportCsv(file);
      onClose();
    }
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(SAMPLE_CSV_TEMPLATE);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2500);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shelfmedia_szablon_importu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columnsSpec = [
    {
      header: 'title',
      aliases: 'tytuł, tytul, nazwa, name',
      required: true,
      descPl: 'Tytuł dzieła (gry, książki, filmu, serialu itp.)',
      descEn: 'Title of the item (game, book, movie, series, etc.)',
      example: '"Wiedźmin 3: Dziki Gon"',
    },
    {
      header: 'item_type',
      aliases: 'typ, rodzaj, kategoria, type',
      required: false,
      descPl: 'Typ medium (np. Gra, Książka, Film, Serial, Komiks, Anime). Domyślnie: Gra',
      descEn: 'Media type (e.g. Gra, Książka, Film, Serial, Komiks, Anime). Default: Gra',
      example: '"Gra" / "Książka"',
    },
    {
      header: 'year',
      aliases: 'rok, premiera, wydanie, rocznik',
      required: false,
      descPl: 'Rok premiery lub wydania (4 cyfry)',
      descEn: 'Release or publication year (4 digits)',
      example: '2015',
    },
    {
      header: 'platform',
      aliases: 'platforma, format, konsola, czytnik',
      required: false,
      descPl: 'Platforma lub format (np. PC (Cyfrowa), PlayStation 5, Książka papierowa, Netflix)',
      descEn: 'Platform or format (e.g. PC (Cyfrowa), PlayStation 5, Książka papierowa, Netflix)',
      example: '"PC (Cyfrowa)"',
    },
    {
      header: 'genre',
      aliases: 'gatunek',
      required: false,
      descPl: 'Gatunek dzieła (np. RPG, Sci-Fi, Fantasy, Kryminał, Thriller)',
      descEn: 'Genre of the work (e.g. RPG, Sci-Fi, Fantasy, Kryminał, Thriller)',
      example: '"RPG"',
    },
    {
      header: 'creator',
      aliases: 'twórca, tworca, twórcy, tworcy, autor, author, reżyser, director, studio, developer',
      required: false,
      descPl: 'Twórca / Twórcy dzieła: autor, reżyser, studio deweloperskie itp.',
      descEn: 'Creator(s) of the work: author, director, studio, developer, etc.',
      example: '"CD Projekt RED" / "Cixin Liu"',
    },
    {
      header: 'rating',
      aliases: 'ocena, score, punkty',
      required: false,
      descPl: 'Ocena w skali od 1.0 do 10.0 (kropka lub przecinek). Domyślnie: 8.0',
      descEn: 'Rating from 1.0 to 10.0 (dot or comma). Default: 8.0',
      example: '9.5',
    },
    {
      header: 'status',
      aliases: 'stan, postęp',
      required: false,
      descPl: 'Status: Ukończone, W trakcie, Planowane lub Porzucone. Domyślnie: Ukończone',
      descEn: 'Status: Ukończone (Completed), W trakcie (In Progress), Planowane, Porzucone',
      example: '"Ukończone"',
    },
    {
      header: 'hours_spent',
      aliases: 'godziny, czas, hours, time',
      required: false,
      descPl: 'Spędzony czas w godzinach (np. 42.5 lub format HH:MM np. 42:30)',
      descEn: 'Time spent in hours (e.g. 42.5 or HH:MM format like 42:30)',
      example: '145.5',
    },
    {
      header: 'pages',
      aliases: 'strony, liczba_stron, str',
      required: false,
      descPl: 'Liczba przeczytanych stron (szczególnie dla książek, komiksów i mang)',
      descEn: 'Number of pages read (for books, comics, and manga)',
      example: '450',
    },
    {
      header: 'date_logged',
      aliases: 'data, date, ukonczono',
      required: false,
      descPl: 'Data ukończenia / wpisu w formacie RRRR-MM-DD (przypisuje pozycję do Rocznika i Miesiąca)',
      descEn: 'Completion / log date in YYYY-MM-DD format (assigns item to Year and Month)',
      example: '"2026-10-15"',
    },
    {
      header: 'comment',
      aliases: 'komentarz, recenzja, opinia, opis',
      required: false,
      descPl: 'Twoja recenzja, notatka lub wrażenia',
      descEn: 'Your review, note, or thoughts',
      example: '"Świetna fabuła!"',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1b2838] border border-[#2a475e] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#a4d007]/15 border border-[#a4d007]/40 text-[#a4d007]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                {t('Import Danych z Pliku CSV • Wymagany Układ Kolumn', 'CSV Data Import • Required Column Layout')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Sprawdź dokładną strukturę nagłówków i format danych potrzebny do zaimportowania arkusza CSV',
                  'Check the exact header structure and data format needed to import your CSV spreadsheet'
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

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Top Upload & Template Action Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
              dragOver
                ? 'border-[#a4d007] bg-[#a4d007]/10'
                : 'border-[#66c0f4]/50 bg-[#141b24]'
            }`}
          >
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                <Upload className="w-4 h-4 text-[#a4d007]" />
                <span>
                  {t(
                    'Wybierz plik .CSV z komputera lub upuść go tutaj',
                    'Select a .CSV file from your computer or drop it here'
                  )}
                </span>
              </div>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Automatycznie wykrywany separator: przecinek (,), średnik (;) z polskiego Excela lub tabulator. Kodowanie: UTF-8.',
                  'Auto-detected delimiter: comma (,), semicolon (;) from Excel, or tab. Encoding: UTF-8.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] hover:text-white rounded-xl text-xs font-bold border border-[#66c0f4]/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('Pobierz wzór .CSV', 'Download .CSV Template')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>{t('Wybierz plik CSV do importu', 'Choose CSV File to Import')}</span>
              </button>
            </div>
          </div>

          {/* Key Rules Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#141b24] border border-[#2a475e] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#a4d007] shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-white block">
                  {t('1. Pierwszy wiersz to nagłówki', '1. First row must be headers')}
                </strong>
                <span className="text-[#8f98a0]">
                  {t(
                    'Kolejność kolumn może być dowolna — aplikacja rozpoznaje kolumny po nazwach nagłówków (po polsku lub angielsku).',
                    'Column order can be anything — the app matches columns by header names (in Polish or English).'
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141b24] border border-[#2a475e] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#66c0f4] shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-white block">
                  {t('2. Tylko Tytuł jest wymagany', '2. Only Title is required')}
                </strong>
                <span className="text-[#8f98a0]">
                  {t(
                    'Kolumna "title" (lub "tytuł") jest obowiązkowa. Pozostałe kolumny są opcjonalne i w razie braku przyjmą wartości domyślne.',
                    'Column "title" (or "tytuł") is required. All other columns are optional and fall back to defaults.'
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141b24] border border-[#2a475e] flex items-start gap-2.5">
              <Table className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-white block">
                  {t('3. Nowe typy, formaty i gatunki', '3. Auto-adding new categories')}
                </strong>
                <span className="text-[#8f98a0]">
                  {t(
                    'Jeśli w pliku CSV znajdą się nowe typy mediów, platformy lub gatunki, zostaną automatycznie dopisane do Twoich list.',
                    'Any new media types, platforms, or genres in the CSV are automatically added to your lists.'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Specification Table of All Columns */}
          <div className="bg-[#141b24] rounded-xl border border-[#2a475e] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#171a21] border-b border-[#2a475e] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {t('Szczegółowy wykaz kolumn pliku CSV', 'Detailed CSV Column Specification')}
              </span>
              <span className="text-[11px] text-[#8f98a0]">
                {t('Akceptowane są zarówno nagłówki angielskie jak i polskie', 'Both English and Polish headers are accepted')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#171a21]/60 text-[#8f98a0] border-b border-[#243547]">
                    <th className="py-2.5 px-3 font-bold">{t('Nagłówek główny', 'Main Header')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('Zamienniki (Aliasy PL/EN)', 'Accepted Aliases')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('Status', 'Status')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('Opis i format danych', 'Description & Format')}</th>
                    <th className="py-2.5 px-3 font-bold">{t('Przykład', 'Example')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243547]/60">
                  {columnsSpec.map((col) => (
                    <tr key={col.header} className="hover:bg-[#1b2838]/50">
                      <td className="py-2 px-3 font-mono font-bold text-[#66c0f4] whitespace-nowrap">
                        {col.header}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#c7d5e0]">
                        {col.aliases}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {col.required ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {t('Wymagane', 'Required')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1b2838] text-[#8f98a0] border border-[#2a475e]">
                            {t('Opcjonalne', 'Optional')}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#c7d5e0]">
                        {lang === 'en' ? col.descEn : col.descPl}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#a4d007] whitespace-nowrap">
                        {col.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ready-to-copy CSV Example Block */}
          <div className="bg-[#141b24] rounded-xl border border-[#2a475e] p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                {t('Przykład gotowego układu CSV (1. wiersz nagłówki + 3 wiersze danych):', 'Sample CSV Layout (Row 1 headers + 3 data rows):')}
              </span>
              <button
                type="button"
                onClick={handleCopyExample}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1b2838] hover:bg-[#2a475e] text-xs font-semibold text-[#66c0f4] border border-[#2a475e] transition-colors cursor-pointer"
              >
                {copiedExample ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#a4d007]" />
                    <span className="text-[#a4d007]">{t('Skopiowano wzór!', 'Copied!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('Kopiuj przykład CSV', 'Copy CSV Example')}</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#171a21] border border-[#243547] text-[11px] font-mono text-[#c7d5e0] overflow-x-auto leading-relaxed">
              {SAMPLE_CSV_TEMPLATE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#171a21] px-6 py-3.5 border-b border-[#2a475e] flex items-center justify-between">
          <span className="text-xs text-[#8f98a0]">
            {t(
              'Wskazówka: Możesz też kliknąć „Eksport CSV” na górnym pasku, aby zobaczyć jak wygląda Twoja obecna baza w arkuszu.',
              'Tip: You can also click "Export CSV" in the top bar to see how your current database looks in a spreadsheet.'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2a475e] hover:bg-[#385e80] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t('Zamknij', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

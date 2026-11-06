import React, { useRef } from 'react';
import { Library, BarChart3, Plus, Download, Upload, Settings2, Settings, Layers } from 'lucide-react';
import { AppLogoConfig, DEFAULT_APP_LOGO } from '../types';
import { getMediaTypeIcon, hexToRgba } from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface NavbarProps {
  currentTab: 'library' | 'collections' | 'stats' | 'settings';
  onSelectTab: (tab: 'library' | 'collections' | 'stats' | 'settings') => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  onOpenOptionsManager: () => void;
  onOpenThemeModal: () => void;
  onOpenCsvImportModal: () => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  itemsCount: number;
  collectionsCount?: number;
  appLogo?: AppLogoConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  onOpenOptionsManager,
  onOpenCsvImportModal,
  onExportCsv,
  onImportCsv,
  itemsCount,
  collectionsCount,
  appLogo = DEFAULT_APP_LOGO,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const AppLogoIcon = getMediaTypeIcon(appLogo?.icon || 'Library');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCsv(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#171a21] border-b border-[#2a475e] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 py-3">
        {/* ShelfMedia Logo & Title */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-inner border transition-colors"
              style={{
                backgroundColor: appLogo?.bgColor || '#1999e3',
                borderColor: hexToRgba(appLogo?.iconColor || '#ffffff', 0.25),
                color: appLogo?.iconColor || '#ffffff',
              }}
            >
              <AppLogoIcon className="w-5 h-5" style={{ color: appLogo?.iconColor || '#ffffff' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black tracking-wider text-base sm:text-lg">ShelfMedia</span>
              </div>
              <p className="text-xs text-[#8f98a0] flex items-center gap-1.5">
                <span className="text-[#66c0f4] font-medium">
                  {t('Twoja półka na media', 'Your media shelf')}
                </span>
                <span>•</span>
                <span className="text-[#c7d5e0]">
                  {t(`Baza: ${itemsCount} pozycji`, `Database: ${itemsCount} items`)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-[#1b2838] p-1 rounded-lg border border-[#2a475e]/60">
          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'library'
                ? 'bg-[#2a475e] text-white shadow font-semibold'
                : 'text-[#c7d5e0] hover:text-white hover:bg-[#212b3b]'
            }`}
          >
            <Library className="w-4 h-4 text-[#66c0f4]" />
            <span>{t('Biblioteka', 'Library')}</span>
          </button>

          <button
            onClick={() => onSelectTab('collections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'collections'
                ? 'bg-[#2a475e] text-white shadow font-semibold'
                : 'text-[#c7d5e0] hover:text-white hover:bg-[#212b3b]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#d946ef]" />
            <span>{t('Kolekcje', 'Collections')}</span>
            {typeof collectionsCount === 'number' && collectionsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#d946ef]/30 text-[#f0abfc] font-bold">
                {collectionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'stats'
                ? 'bg-[#2a475e] text-white shadow font-semibold'
                : 'text-[#c7d5e0] hover:text-white hover:bg-[#212b3b]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#a4d007]" />
            <span>{t('Statystyki & Roczniki', 'Stats & Years')}</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#2a475e] text-white shadow font-semibold'
                : 'text-[#c7d5e0] hover:text-white hover:bg-[#212b3b]'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>{t('Ustawienia', 'Settings')}</span>
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Hidden File Input for CSV Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv"
            className="hidden"
          />

          <button
            onClick={onOpenCsvImportModal}
            title={t('Importuj dane z pliku CSV (sprawdź wymagany układ kolumn)', 'Import data from CSV file (view required column layout)')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded text-xs font-medium border border-[#2a475e] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#a4d007]" />
            <span className="hidden sm:inline">{t('Import', 'Import')}</span> CSV
          </button>

          <button
            onClick={onExportCsv}
            title={t('Eksportuj całą bazę do CSV', 'Export entire database to CSV')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded text-xs font-medium border border-[#2a475e] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
            <span className="hidden sm:inline">{t('Eksport', 'Export')}</span> CSV
          </button>

          <button
            onClick={onOpenOptionsManager}
            title={t('Zarządzaj listami typów, platform/formatów oraz gatunków', 'Manage media types, platforms/formats, and genres')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded text-xs font-medium border border-[#2a475e] transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#66c0f4]" />
            <span className="hidden lg:inline">{t('Listy wyboru', 'Options')}</span>
            <span className="lg:hidden">{t('Listy', 'Options')}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white font-semibold rounded text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Dodaj pozycję', 'Add Item')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};


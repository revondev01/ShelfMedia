import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Globe,
  ShieldCheck,
  Palette,
  Star,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Check,
  Sparkles,
  RotateCcw,
  Sliders,
  Info,
  Layers,
  User,
  BadgeCheck,
} from 'lucide-react';
import { RatingScale, AppLogoConfig, DEFAULT_APP_LOGO } from '../types';
import { AVAILABLE_ICONS, COLOR_PRESETS, getMediaTypeIcon, hexToRgba } from '../utils/mediaTypeUtils';
import { UIThemeConfig, UI_THEME_PRESETS, ThemePreset, DEFAULT_UI_THEME } from './ThemeModal';
import { useLanguage } from '../i18n';

interface SettingsTabProps {
  ratingScale: RatingScale;
  onChangeRatingScale: (scale: RatingScale) => void;
  uiTheme?: UIThemeConfig;
  onChangeTheme: (theme: UIThemeConfig) => void;
  onResetTheme: () => void;
  onExportFullBackup: () => void;
  onImportFullBackup: (file: File) => void;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  itemsCount: number;
  typesCount: number;
  platformsCount: number;
  genresCount: number;
  gradientsCount: number;
  userName?: string;
  onChangeUserName?: (name: string) => void;
  appLogo?: AppLogoConfig;
  onChangeAppLogo?: (logo: AppLogoConfig) => void;
}

type SettingsSubTab = 'all' | 'profile' | 'language' | 'scale' | 'backup' | 'theme';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  ratingScale,
  onChangeRatingScale,
  uiTheme = DEFAULT_UI_THEME,
  onChangeTheme,
  onResetTheme,
  onExportFullBackup,
  onImportFullBackup,
  onExportCsv,
  onImportCsv,
  itemsCount,
  typesCount,
  platformsCount,
  genresCount,
  gradientsCount,
  userName = '',
  onChangeUserName,
  appLogo = DEFAULT_APP_LOGO,
  onChangeAppLogo,
}) => {
  const { lang, setLang, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('all');
  const [dragOver, setDragOver] = useState(false);
  const [localUserName, setLocalUserName] = useState(userName);

  // Sync local input with incoming prop
  React.useEffect(() => {
    setLocalUserName(userName);
  }, [userName]);
  const [recentlyExported, setRecentlyExported] = useState(false);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFullBackup(file);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCsv(file);
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.json')) {
      onImportFullBackup(file);
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      onImportCsv(file);
    }
  };

  const handleTriggerExport = () => {
    onExportFullBackup();
    setRecentlyExported(true);
    setTimeout(() => setRecentlyExported(false), 3000);
  };

  const handleSelectPreset = (preset: ThemePreset) => {
    onChangeTheme({ ...preset.config });
  };

  const handleColorChange = (key: keyof Omit<UIThemeConfig, 'presetId'>, value: string) => {
    onChangeTheme({
      ...uiTheme,
      presetId: 'custom',
      [key]: value,
    });
  };

  const colorFields: Array<{
    key: keyof Omit<UIThemeConfig, 'presetId'>;
    labelPl: string;
    labelEn: string;
    descPl: string;
    descEn: string;
  }> = [
    {
      key: 'bgPrimary',
      labelPl: 'Główne tło aplikacji i paska',
      labelEn: 'Main App & Navbar Background',
      descPl: 'Tło całej strony oraz górnego paska nawigacji',
      descEn: 'Page backdrop and top navigation bar',
    },
    {
      key: 'bgSecondary',
      labelPl: 'Karty, panele i okna',
      labelEn: 'Cards, Panels & Modals',
      descPl: 'Tło kart statystyk, filtrów i okien dialogowych',
      descEn: 'Background of stat cards, filters, and modals',
    },
    {
      key: 'bgSurface',
      labelPl: 'Tabele i sekcje wewnętrzne',
      labelEn: 'Tables & Inner Surfaces',
      descPl: 'Tło wierszy tabeli, pól formularzy i boksów',
      descEn: 'Table rows, input fields, and inner containers',
    },
    {
      key: 'border',
      labelPl: 'Obramowania i linie podziału',
      labelEn: 'Borders & Dividers',
      descPl: 'Kolor ramek kart, przycisków i separatorów',
      descEn: 'Color of card frames, buttons, and dividers',
    },
    {
      key: 'accent',
      labelPl: 'Główny kolor akcentu',
      labelEn: 'Primary Accent Color',
      descPl: 'Wyróżnienia, aktywne zakładki, ikony i wykresy',
      descEn: 'Highlights, active tabs, icons, and charts',
    },
    {
      key: 'accentSecondary',
      labelPl: 'Drugi akcent (Ukończone / Akcje)',
      labelEn: 'Secondary Accent (Completed / Actions)',
      descPl: 'Paski postępu, odznaki sukcesu i akcenty',
      descEn: 'Progress bars, completion badges, and accents',
    },
  ];

  const showProfile = activeSubTab === 'all' || activeSubTab === 'profile';
  const showLanguage = activeSubTab === 'all' || activeSubTab === 'language';
  const showScale = activeSubTab === 'all' || activeSubTab === 'scale';
  const showBackup = activeSubTab === 'all' || activeSubTab === 'backup';
  const showTheme = activeSubTab === 'all' || activeSubTab === 'theme';

  const CurrentLogoIcon = getMediaTypeIcon(appLogo?.icon || 'Library');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
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

      {/* Settings Header & Sub-Tabs Navigation */}
      <div className="bg-[#1b2838] p-4 sm:p-5 rounded-xl border border-[#2a475e] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4] shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {t('Ustawienia Aplikacji & Personalizacja', 'Application Settings & Personalization')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Zarządzaj językiem interfejsu, ikoną główną aplikacji, skalą ocen, kopiami zapasowymi oraz kolorystyką UI',
                  'Manage interface language, main app icon, database-wide rating scale, backups, and UI color theme'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8f98a0] bg-[#141b24] px-3 py-1.5 rounded-lg border border-[#243547]">
            <span>{t('Aktywna skala:', 'Active scale:')}</span>
            <strong className="text-amber-400 font-mono">0.5 – {ratingScale}</strong>
            <span>•</span>
            <span>{t('Język:', 'Language:')}</span>
            <strong className="text-[#66c0f4] uppercase">{lang}</strong>
          </div>
        </div>

        {/* Sub-tabs bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#243547]">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('Wszystkie ustawienia', 'All Settings')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('Profil & Ikona Aplikacji', 'Profile & App Icon')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('language')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'language'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('Wybór języka', 'Language')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('scale')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'scale'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>{t('Skala ocen (0.5–5 / 0.5–10)', 'Rating Scale (0.5–5 / 0.5–10)')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'backup'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('Kopia zapasowa', 'Backup')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('theme')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'theme'
                ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('Kolory UI', 'UI Theme')}</span>
          </button>
        </div>
      </div>

      {/* 0. USER NAME / PROFILE FOR ALL SUMMARIES */}
      {showProfile && (
        <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#66c0f4] to-[#2575fc] text-white shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{t('Twoja Nazwa / Pseudonim do Podsumowań', 'Your Name / Nickname for Summaries')}</span>
                  {localUserName.trim() && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>{t('Aktywna', 'Active')}</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t(
                    'Wpisz swoją nazwę lub nick. Będzie ona automatycznie dodawana do każdego rodzaju podsumowania (roczników, statystyk, kolekcji oraz generowanych grafik na sociale).',
                    'Enter your name or nickname. It will be automatically added to all summaries (annual, stats, collections, and generated social cards).'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#c7d5e0] mb-1.5">
                {t('Wpisz swoją nazwę / nick:', 'Enter your name / nickname:')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#66c0f4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={localUserName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalUserName(val);
                    if (onChangeUserName) onChangeUserName(val);
                  }}
                  placeholder={t('np. Kamil, Gamer99, Marcin...', 'e.g. Kamil, Gamer99, Martin...')}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#141b24] border border-[#2a475e] rounded-xl text-sm font-semibold text-white placeholder-[#8f98a0] focus:outline-none focus:border-[#66c0f4] transition-colors"
                />
                {localUserName && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalUserName('');
                      if (onChangeUserName) onChangeUserName('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8f98a0] hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#8f98a0] mt-1.5">
                {t(
                  'Zapisuje się automatycznie i natychmiast synchronizuje z aplikacją.',
                  'Saves automatically and syncs immediately across your devices.'
                )}
              </p>
            </div>

            {/* Live Preview Card */}
            <div className="bg-[#141b24] p-4 rounded-xl border border-[#243547] flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#8f98a0] uppercase tracking-wider block mb-2">
                {t('Podgląd podpisu na grafikach i podsumowaniach:', 'Summary watermark preview:')}
              </span>
              <div className="p-3 rounded-lg bg-[#111720] border border-[#2a475e] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#66c0f4]/20 border border-[#66c0f4]/50 flex items-center justify-center text-[#66c0f4]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {localUserName.trim() ? localUserName.trim() : t('(Brak nazwy — wpisz powyżej)', '(No name — enter above)')}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#66c0f4]">#ShelfMedia</span>
              </div>
              <span className="text-[10px] text-[#8f98a0] mt-2 block">
                {t('Pojawi się w nagłówkach i stopkach podsumowań rocznych oraz w Twoich kolekcjach.', 'Will appear in annual summary headers, footers, and collections.')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 0B. MAIN APPLICATION ICON CUSTOMIZER (Background Color + Inner Graphic + Icon Color) */}
      {(showProfile || showTheme) && (
        <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#243547] pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md border transition-colors shrink-0"
                style={{
                  backgroundColor: appLogo.bgColor || '#1999e3',
                  borderColor: hexToRgba(appLogo.iconColor || '#ffffff', 0.35),
                  color: appLogo.iconColor || '#ffffff',
                }}
              >
                <CurrentLogoIcon className="w-6 h-6" style={{ color: appLogo.iconColor || '#ffffff' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{t('Ikona Główna Aplikacji (Tło oraz Grafika w środku)', 'Main Application Icon (Background & Inner Graphic)')}</span>
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t(
                    'Zmień kolor tła oraz grafikę (symbol i jego kolor) w środku głównej ikony aplikacji ShelfMedia w pasku górnym i banerze.',
                    'Customize the background color and inner icon graphic (symbol and its color) of the main ShelfMedia app icon.'
                  )}
                </p>
              </div>
            </div>

            {onChangeAppLogo && (
              <button
                type="button"
                onClick={() => onChangeAppLogo(DEFAULT_APP_LOGO)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b24] hover:bg-[#212b3b] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold border border-[#2a475e] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('Domyślna ikona', 'Default Icon')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left column: Background Color & Inner Icon Color */}
            <div className="lg:col-span-5 space-y-4">
              {/* Background Color */}
              <div className="bg-[#141b24] p-4 rounded-xl border border-[#243547] space-y-2.5">
                <label className="block text-xs font-bold text-[#c7d5e0] uppercase tracking-wider">
                  {t('1. Kolor tła ikony głównej:', '1. Main Icon Background Color:')}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { hex: '#1999e3', label: 'Domyślny ShelfMedia' },
                    ...COLOR_PRESETS,
                    { hex: '#ffffff', label: 'Biały' },
                    { hex: '#000000', label: 'Czarny' },
                  ].map((c) => {
                    const isLightSwatch = c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#facc15';
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onChangeAppLogo && onChangeAppLogo({ ...appLogo, bgColor: c.hex })}
                        title={c.label}
                        className={`w-6 h-6 rounded-full border border-white/20 transition-all flex items-center justify-center cursor-pointer ${
                          appLogo.bgColor?.toLowerCase() === c.hex.toLowerCase()
                            ? 'ring-2 ring-white scale-110 shadow'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex, forcedColorAdjust: 'none' }}
                      >
                        {appLogo.bgColor?.toLowerCase() === c.hex.toLowerCase() && (
                          <Check className={`w-3 h-3 stroke-[3] ${isLightSwatch ? 'text-[#171a21]' : 'text-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={appLogo.bgColor?.startsWith('#') ? appLogo.bgColor : '#1999e3'}
                    onChange={(e) => onChangeAppLogo && onChangeAppLogo({ ...appLogo, bgColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                    style={{ colorScheme: 'dark', forcedColorAdjust: 'none' }}
                  />
                  <input
                    type="text"
                    value={appLogo.bgColor}
                    onChange={(e) => onChangeAppLogo && onChangeAppLogo({ ...appLogo, bgColor: e.target.value })}
                    className="flex-1 bg-[#111720] border border-[#2a475e] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    placeholder="#1999e3"
                  />
                </div>
              </div>

              {/* Inner Graphic Color */}
              <div className="bg-[#141b24] p-4 rounded-xl border border-[#243547] space-y-2.5">
                <label className="block text-xs font-bold text-[#c7d5e0] uppercase tracking-wider">
                  {t('2. Kolor grafiki / symbolu w środku:', '2. Inner Graphic / Symbol Color:')}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { hex: '#ffffff', label: 'Biały' },
                    { hex: '#000000', label: 'Czarny' },
                    { hex: '#66c0f4', label: 'Błękitny' },
                    { hex: '#a4d007', label: 'Limonkowy' },
                    { hex: '#facc15', label: 'Złoty' },
                    { hex: '#f472b6', label: 'Różowy' },
                    { hex: '#c084fc', label: 'Fioletowy' },
                    { hex: '#34d399', label: 'Szmaragdowy' },
                    { hex: '#171a21', label: 'Ciemny' },
                  ].map((c) => {
                    const isLightSwatch = c.hex.toLowerCase() === '#ffffff' || c.hex.toLowerCase() === '#facc15';
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onChangeAppLogo && onChangeAppLogo({ ...appLogo, iconColor: c.hex })}
                        title={c.label}
                        className={`w-6 h-6 rounded-full border border-white/20 transition-all flex items-center justify-center cursor-pointer ${
                          appLogo.iconColor?.toLowerCase() === c.hex.toLowerCase()
                            ? 'ring-2 ring-[#66c0f4] scale-110 shadow'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex, forcedColorAdjust: 'none' }}
                      >
                        {appLogo.iconColor?.toLowerCase() === c.hex.toLowerCase() && (
                          <Check className={`w-3 h-3 stroke-[3] ${isLightSwatch ? 'text-[#171a21]' : 'text-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={appLogo.iconColor?.startsWith('#') ? appLogo.iconColor : '#ffffff'}
                    onChange={(e) => onChangeAppLogo && onChangeAppLogo({ ...appLogo, iconColor: e.target.value })}
                    className="w-8 h-8 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={appLogo.iconColor}
                    onChange={(e) => onChangeAppLogo && onChangeAppLogo({ ...appLogo, iconColor: e.target.value })}
                    className="flex-1 bg-[#111720] border border-[#2a475e] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Right column: Inner Icon Graphic Selector */}
            <div className="lg:col-span-7 bg-[#141b24] p-4 rounded-xl border border-[#243547] flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#c7d5e0] uppercase tracking-wider mb-2">
                  {t('3. Wybierz grafikę w środku ikony głównej:', '3. Choose Inner Graphic of Main Icon:')}
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-52 overflow-y-auto p-1">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IconComp = ic.icon;
                    const isSelected = appLogo.icon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => onChangeAppLogo && onChangeAppLogo({ ...appLogo, icon: ic.id })}
                        title={ic.label}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2a475e] border-[#66c0f4] text-white shadow-md scale-105'
                            : 'bg-[#111720] border-[#243547] text-[#8f98a0] hover:text-white hover:border-[#2a475e]'
                        }`}
                      >
                        <IconComp
                          className="w-5 h-5"
                          style={{ color: isSelected ? appLogo.iconColor || '#ffffff' : undefined }}
                        />
                        <span className="text-[9px] mt-1 truncate w-full text-center">
                          {ic.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Header Preview */}
              <div className="p-3 rounded-lg bg-[#111720] border border-[#2a475e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shadow-inner border"
                    style={{
                      backgroundColor: appLogo.bgColor || '#1999e3',
                      borderColor: hexToRgba(appLogo.iconColor || '#ffffff', 0.25),
                    }}
                  >
                    <CurrentLogoIcon className="w-5 h-5" style={{ color: appLogo.iconColor || '#ffffff' }} />
                  </div>
                  <div>
                    <span className="text-white font-black tracking-wider text-sm block leading-tight">ShelfMedia</span>
                    <span className="text-[11px] text-[#66c0f4]">{t('Twoja półka na media', 'Your media shelf')}</span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ✓ {t('Podgląd na żywo', 'Live preview')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Grid when both Language and Rating Scale are visible */}
      {(showLanguage || showScale) && (
        <div className={`grid grid-cols-1 ${showLanguage && showScale ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* 1. LANGUAGE SELECTION */}
          {showLanguage && (
            <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 text-[#66c0f4]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t('Wybór Języka Interfejsu', 'Interface Language Selection')}
                    </h3>
                    <p className="text-xs text-[#8f98a0]">
                      {t(
                        'Zmień język wszystkich zakładek, statystyk, formularzy oraz generowanych grafik',
                        'Switch the language of all tabs, statistics, forms, and generated social cards'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setLang('pl')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      lang === 'pl'
                        ? 'border-2 border-[#66c0f4] bg-[#141b24] shadow-lg'
                        : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-[#66c0f4]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Polski (PL)</span>
                        {lang === 'pl' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#66c0f4] text-[#171a21] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {t('Aktywny', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8f98a0] mt-1">
                        Pełny polski interfejs, nazwy kategorii i podsumowania
                      </p>
                    </div>
                    <span className="text-xl font-black text-[#66c0f4] font-mono">PL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      lang === 'en'
                        ? 'border-2 border-[#66c0f4] bg-[#141b24] shadow-lg'
                        : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-[#66c0f4]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">English (EN)</span>
                        {lang === 'en' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#66c0f4] text-[#171a21] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {t('Aktywny', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8f98a0] mt-1">
                        Full English interface, media categories & summaries
                      </p>
                    </div>
                    <span className="text-xl font-black text-[#66c0f4] font-mono">EN</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#243547] text-xs text-[#8f98a0] flex items-center justify-between">
                <span>
                  {t(
                    'Wybrany język jest zapisywany automatycznie w pamięci przeglądarki.',
                    'Your selected language is automatically saved in browser storage.'
                  )}
                </span>
              </div>
            </div>
          )}

          {/* 2. RATING SCALE SELECTION (0.5 - 5 vs 0.5 - 10) */}
          {showScale && (
            <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400">
                    <Star className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t('Skala Ocen Dzieł', 'Media Rating Scale')}
                    </h3>
                    <p className="text-xs text-[#8f98a0]">
                      {t(
                        'Zmiana skali ocen automatycznie przelicza i dostosowuje oceny w całej bazie danych, statystykach i na wirtualnej półce',
                        'Changing the rating scale automatically converts and adapts ratings across your entire database, stats, and virtual shelf'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {/* Option 1: 0.5 to 5 */}
                  <button
                    type="button"
                    onClick={() => onChangeRatingScale(5)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      ratingScale === 5
                        ? 'border-2 border-amber-400 bg-[#141b24] shadow-lg'
                        : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-amber-400/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {t('Skala od 0.5 do 5', 'Scale 0.5 to 5')}
                        </span>
                        {ratingScale === 5 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-[#171a21] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {t('Aktywna', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8f98a0] mt-1">
                        {t(
                          'Klasyczna skala 5-gwiazdkowa z połówkami (0.5, 1.0 ... 5.0)',
                          'Classic 5-star scale with half steps (0.5, 1.0 ... 5.0)'
                        )}
                      </p>
                    </div>
                    <span className="text-lg font-black text-amber-400 font-mono shrink-0 ml-2">★ 5.0</span>
                  </button>

                  {/* Option 2: 0.5 to 10 */}
                  <button
                    type="button"
                    onClick={() => onChangeRatingScale(10)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      ratingScale === 10
                        ? 'border-2 border-amber-400 bg-[#141b24] shadow-lg'
                        : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-amber-400/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {t('Skala od 0.5 do 10', 'Scale 0.5 to 10')}
                        </span>
                        {ratingScale === 10 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-[#171a21] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {t('Aktywna', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8f98a0] mt-1">
                        {t(
                          'Rozszerzona skala dziesiętna z połówkami (0.5, 1.0 ... 10.0)',
                          'Extended 10-point scale with half steps (0.5, 1.0 ... 10.0)'
                        )}
                      </p>
                    </div>
                    <span className="text-lg font-black text-amber-400 font-mono shrink-0 ml-2">★ 10.0</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#243547] text-xs text-[#8f98a0] flex items-center justify-between">
                <span>
                  {t(
                    `Wszystkie pozycje w bazie (${itemsCount}) są automatycznie przeliczane do skali 0.5–${ratingScale}.`,
                    `All items in the database (${itemsCount}) are automatically scaled to 0.5–${ratingScale}.`
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BACKUP SECTION */}
      {showBackup && (
        <div className="bg-[#1b2838] border border-[#2a475e] rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600/30 to-[#a4d007]/20 border border-[#a4d007]/50 text-[#a4d007]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {t('Kopia Zapasowa & Bezpieczeństwo Danych', 'Database Backup & Data Security')}
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t(
                    'Eksportuj i importuj pełną bazę danych w formacie JSON lub arkuszu kalkulacyjnym CSV',
                    'Export and import your full database in JSON format or CSV spreadsheet'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-[#1b2838] px-2.5 py-1 rounded border border-[#2a475e] text-white font-medium">
                {t('Pozycji:', 'Items:')} <strong className="text-[#66c0f4]">{itemsCount}</strong>
              </span>
              <span className="bg-[#1b2838] px-2.5 py-1 rounded border border-[#2a475e] text-white font-medium">
                {t('Typów:', 'Types:')} <strong className="text-amber-400">{typesCount}</strong>
              </span>
              <span className="bg-[#1b2838] px-2.5 py-1 rounded border border-[#2a475e] text-white font-medium">
                {t('Formatów:', 'Platforms:')} <strong className="text-[#a4d007]">{platformsCount}</strong>
              </span>
              <span className="bg-[#1b2838] px-2.5 py-1 rounded border border-[#2a475e] text-white font-medium">
                {t('Gatunków:', 'Genres:')} <strong className="text-purple-400">{genresCount}</strong>
              </span>
              {gradientsCount > 0 && (
                <span className="bg-[#1b2838] px-2.5 py-1 rounded border border-[#2a475e] text-white font-medium">
                  {t('Gradientów:', 'Gradients:')} <strong className="text-pink-400">{gradientsCount}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Full JSON Backup Card */}
            <div className="bg-[#141d28] border-2 border-[#a4d007]/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#a4d007] text-[#171a21] text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg tracking-wider">
                {t('Zalecane 100%', 'Recommended 100%')}
              </div>

              <div className="flex items-start gap-3.5 mb-3">
                <div className="p-2.5 rounded-xl bg-[#a4d007]/10 text-[#a4d007] border border-[#a4d007]/30 shrink-0">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {t('Pełna Kopia Zapasowa (Format JSON)', 'Full System & Database Backup (JSON Format)')}
                  </h4>
                  <p className="text-xs text-[#8f98a0] mt-1 leading-relaxed">
                    {t(
                      'Zapisuje w jednym pliku wszystko: całą bazę dzieł, recenzje, oceny, aktywną skalę ocen, strony, godziny, własne typy mediów (z kolorami i ikonami), formaty, gatunki, kolory UI oraz własne gradienty.',
                      'Saves everything in a single file: your entire media collection, reviews, ratings, active rating scale, pages, hours, custom media types, platforms, genres, UI theme, and custom gradients.'
                    )}
                  </p>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
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
                    'Możesz też przeciągnąć i upuścić plik kopii zapasowej (.json lub .csv) bezpośrednio w to pole.',
                    'You can also drag and drop your backup file (.json or .csv) directly into this box.'
                  )}
                </span>
              </div>
            </div>

            {/* CSV Export / Import Card */}
            <div className="bg-[#16202d] border border-[#2a475e] rounded-xl p-4 shadow space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#66c0f4]/10 text-[#66c0f4] shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {t('Arkusz kalkulacyjny (CSV) • Eksport & Import', 'Spreadsheet (CSV) • Export & Import')}
                  </h4>
                  <p className="text-xs text-[#8f98a0]">
                    {t(
                      'Dla programów Microsoft Excel, LibreOffice Calc lub Google Sheets (UTF-8).',
                      'For Microsoft Excel, LibreOffice Calc, or Google Sheets (UTF-8).'
                    )}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131b26] border border-[#243547] text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#66c0f4]" />
                    {t('Nagłówki kolumn przy imporcie CSV:', 'CSV import column headers:')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {t('Obowiązkowa tylko kolumna: title / tytuł', 'Only required column: title / tytuł')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#171a21] border border-[#2a475e]/60 font-mono text-[11px] text-[#66c0f4] overflow-x-auto whitespace-nowrap">
                  title,item_type,year,platform,genre,creator,rating,status,hours_spent,pages,date_logged,comment
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#243547]">
                <button
                  type="button"
                  onClick={onExportCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold border border-[#2a475e] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
                  <span>{t('Eksportuj CSV (Excel)', 'Export CSV (Excel)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const maxSample = ratingScale === 5 ? '5.0' : '10.0';
                    const secondSample = ratingScale === 5 ? '4.5' : '9.0';
                    const sampleCsv = `title,item_type,year,platform,genre,creator,rating,status,hours_spent,pages,date_logged,comment\r\n"Wiedźmin 3: Dziki Gon","Gra",2015,"PC (Cyfrowa)","RPG","CD Projekt RED",${maxSample},"Ukończone",145.5,,"2026-10-15","Arcydzieło fabularne"\r\n"Problem trzech ciał","Książka",2008,"Książka papierowa","Sci-Fi","Cixin Liu",${secondSample},"Ukończone",14.0,450,"2026-10-20","Świetne sci-fi"`;
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
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#66c0f4] hover:text-white rounded-lg text-xs font-semibold border border-[#66c0f4]/40 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#66c0f4]" />
                  <span>{t('Pobierz wzór CSV', 'Download CSV Template')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>{t('Wybierz plik i Importuj z CSV', 'Select File & Import CSV')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. UI COLORS SECTION */}
      {showTheme && (
        <div className="bg-[#1b2838] border border-[#2a475e] rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 text-[#66c0f4]">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {t('Personalizacja Kolorów Interfejsu (Kolory UI)', 'Interface Color Personalization (UI Theme)')}
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t(
                    'Wybierz gotowy motyw kolorystyczny lub dostosuj własną paletę barw aplikacji',
                    'Choose a curated color theme or customize your own application color palette'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetTheme}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1b2838] hover:bg-[#2a475e] text-xs font-semibold text-[#c7d5e0] hover:text-white border border-[#2a475e] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#66c0f4]" />
              <span>{t('Przywróć domyślny motyw', 'Reset to Default Theme')}</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Curated Presets */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#66c0f4]" />
                {t('Gotowe Motywy Kolorystyczne', 'Curated Color Themes')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {UI_THEME_PRESETS.map((preset) => {
                  const isSelected = uiTheme.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#66c0f4] bg-[#141b24] shadow-lg'
                          : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-[#66c0f4]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {lang === 'en' ? preset.nameEn : preset.namePl}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#66c0f4] text-[#171a21] flex items-center gap-0.5 shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8f98a0] mt-1 line-clamp-2">
                          {lang === 'en' ? preset.descEn : preset.descPl}
                        </p>
                      </div>

                      <div className="flex items-center -space-x-1.5 pt-1">
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow"
                          style={{ backgroundColor: preset.config.bgPrimary }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow"
                          style={{ backgroundColor: preset.config.bgSecondary }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow"
                          style={{ backgroundColor: preset.config.border }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white/30 shadow"
                          style={{ backgroundColor: preset.config.accent }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white/30 shadow"
                          style={{ backgroundColor: preset.config.accentSecondary }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="pt-4 border-t border-[#243547]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#a4d007]" />
                  {t('Własne Kolory Elementów (Dowolna Personalizacja)', 'Custom Element Colors (Fine-Tuning)')}
                </h4>
                {uiTheme.presetId === 'custom' && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#a4d007]/20 text-[#a4d007] border border-[#a4d007]/40 font-semibold">
                    {t('Własna konfiguracja aktywna', 'Custom configuration active')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {colorFields.map((field) => (
                  <div
                    key={field.key}
                    className="p-3 rounded-xl bg-[#141b24] border border-[#2a475e] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">
                        {lang === 'en' ? field.labelEn : field.labelPl}
                      </div>
                      <div className="text-[11px] text-[#8f98a0] truncate">
                        {lang === 'en' ? field.descEn : field.descPl}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={uiTheme[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-20 text-xs font-mono text-[#c7d5e0] uppercase bg-[#171a21] px-2 py-1 rounded border border-[#2a475e] text-center focus:outline-none focus:border-[#66c0f4]"
                      />
                      <label
                        className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white/30 cursor-pointer shadow-inner shrink-0"
                        style={{ colorScheme: 'dark', forcedColorAdjust: 'none' }}
                      >
                        <input
                          type="color"
                          value={
                            /^#[0-9a-fA-F]{6}$/.test(uiTheme[field.key])
                              ? uiTheme[field.key]
                              : DEFAULT_UI_THEME[field.key]
                          }
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
                          style={{ colorScheme: 'dark', forcedColorAdjust: 'none' }}
                        />
                        <span
                          className="block w-full h-full"
                          style={{
                            backgroundColor: uiTheme[field.key],
                            forcedColorAdjust: 'none',
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

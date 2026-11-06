import React from 'react';
import { X, Palette, RotateCcw, Sparkles, Check, Sliders } from 'lucide-react';
import { useLanguage } from '../i18n';

export interface UIThemeConfig {
  presetId: string;
  bgPrimary: string;      // Default: #171a21 (Main background & navbar)
  bgSecondary: string;    // Default: #1b2838 (Cards, modals & panels)
  bgSurface: string;      // Default: #141b24 (Inner boxes, inputs & tables)
  border: string;         // Default: #2a475e (Borders & dividers)
  accent: string;         // Default: #66c0f4 (Primary accent & highlights)
  accentSecondary: string;// Default: #a4d007 (Secondary accent & badges)
}

export const DEFAULT_UI_THEME: UIThemeConfig = {
  presetId: 'steam',
  bgPrimary: '#171a21',
  bgSecondary: '#1b2838',
  bgSurface: '#141b24',
  border: '#2a475e',
  accent: '#66c0f4',
  accentSecondary: '#a4d007',
};

export interface ThemePreset {
  id: string;
  namePl: string;
  nameEn: string;
  descPl: string;
  descEn: string;
  config: UIThemeConfig;
}

export const UI_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'steam',
    namePl: 'Klasyczny Granat (Domyślny)',
    nameEn: 'Classic Navy (Default)',
    descPl: 'Klasyczny ciemnogranatowy motyw z błękitnym akcentem',
    descEn: 'Classic dark navy theme with sky-blue accents',
    config: DEFAULT_UI_THEME,
  },
  {
    id: 'oled',
    namePl: 'OLED Głęboka Czerń',
    nameEn: 'OLED Deep Black',
    descPl: 'Maksymalny kontrast z czystą czernią i błękitnym akcentem',
    descEn: 'Maximum contrast with pure black surfaces and sky-blue accents',
    config: {
      presetId: 'oled',
      bgPrimary: '#090b10',
      bgSecondary: '#11151f',
      bgSurface: '#0c0f17',
      border: '#232c3d',
      accent: '#38bdf8',
      accentSecondary: '#10b981',
    },
  },
  {
    id: 'cyberpunk',
    namePl: 'Cyberpunk Fiolet & Neon',
    nameEn: 'Cyberpunk Violet & Neon',
    descPl: 'Futurystyczny fiolet z neonową magentą i cyjanem',
    descEn: 'Futuristic deep violet with neon magenta and cyan accents',
    config: {
      presetId: 'cyberpunk',
      bgPrimary: '#110b1c',
      bgSecondary: '#1b122c',
      bgSurface: '#150e23',
      border: '#3b255e',
      accent: '#e879f9',
      accentSecondary: '#22d3ee',
    },
  },
  {
    id: 'emerald',
    namePl: 'Szmaragdowy Las',
    nameEn: 'Emerald Forest',
    descPl: 'Spokojne, głębokie odcienie zieleni i mięty dla czytelników',
    descEn: 'Calm, deep forest greens and mint tones',
    config: {
      presetId: 'emerald',
      bgPrimary: '#0a1512',
      bgSecondary: '#11231d',
      bgSurface: '#0d1b16',
      border: '#1f4437',
      accent: '#34d399',
      accentSecondary: '#a3e635',
    },
  },
  {
    id: 'crimson',
    namePl: 'Karmazynowy Zmierzch',
    nameEn: 'Crimson Dusk',
    descPl: 'Ciepłe bordowo-karmazynowe tło ze złotym akcentem',
    descEn: 'Warm burgundy-crimson surfaces with golden highlights',
    config: {
      presetId: 'crimson',
      bgPrimary: '#170b0f',
      bgSecondary: '#251218',
      bgSurface: '#1c0d12',
      border: '#4a222f',
      accent: '#fb7185',
      accentSecondary: '#fbbf24',
    },
  },
  {
    id: 'amber',
    namePl: 'Złoty Bursztyn & Espresso',
    nameEn: 'Amber Gold & Espresso',
    descPl: 'Przytulny ciemny brąz i ciepłe bursztynowe światło',
    descEn: 'Cozy dark espresso brown with warm amber glow',
    config: {
      presetId: 'amber',
      bgPrimary: '#15110c',
      bgSecondary: '#221c13',
      bgSurface: '#1a150e',
      border: '#443622',
      accent: '#fbbf24',
      accentSecondary: '#34d399',
    },
  },
  {
    id: 'ocean',
    namePl: 'Głębia Oceanu',
    nameEn: 'Abyssal Ocean',
    descPl: 'Chłodny morski granat z turkusowymi detalami',
    descEn: 'Cool oceanic navy with turquoise highlights',
    config: {
      presetId: 'ocean',
      bgPrimary: '#08121e',
      bgSecondary: '#0f2034',
      bgSurface: '#0b1828',
      border: '#1e3e62',
      accent: '#2dd4bf',
      accentSecondary: '#60a5fa',
    },
  },
  {
    id: 'slate',
    namePl: 'Arktyczny Grafit (Nord)',
    nameEn: 'Arctic Graphite (Nord)',
    descPl: 'Stonowany skandynawski grafit o łagodnym kontraście',
    descEn: 'Muted Scandinavian slate graphite with soft contrast',
    config: {
      presetId: 'slate',
      bgPrimary: '#1c2026',
      bgSecondary: '#262b33',
      bgSurface: '#20242b',
      border: '#3b4252',
      accent: '#88c0d0',
      accentSecondary: '#a3be8c',
    },
  },
];

export function sanitizeHexColor(value: unknown, fallback: string): string {
  const str = typeof value === 'string' ? value.trim() : '';
  return /^#[0-9a-fA-F]{3,8}$/.test(str) ? str : fallback;
}

function getHexLuminance(hex: string): number {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function generateThemeCss(theme: UIThemeConfig): string {
  const bgPrimary = sanitizeHexColor(theme?.bgPrimary, DEFAULT_UI_THEME.bgPrimary);
  const bgSecondary = sanitizeHexColor(theme?.bgSecondary, DEFAULT_UI_THEME.bgSecondary);
  const bgSurface = sanitizeHexColor(theme?.bgSurface, DEFAULT_UI_THEME.bgSurface);
  const border = sanitizeHexColor(theme?.border, DEFAULT_UI_THEME.border);
  const accent = sanitizeHexColor(theme?.accent, DEFAULT_UI_THEME.accent);
  const accentSecondary = sanitizeHexColor(theme?.accentSecondary, DEFAULT_UI_THEME.accentSecondary);

  const baseRules = `
    :root, html, body {
      color-scheme: dark;
      forced-color-adjust: none;
    }
  `;

  if (
    bgPrimary.toLowerCase() === DEFAULT_UI_THEME.bgPrimary &&
    bgSecondary.toLowerCase() === DEFAULT_UI_THEME.bgSecondary &&
    bgSurface.toLowerCase() === DEFAULT_UI_THEME.bgSurface &&
    border.toLowerCase() === DEFAULT_UI_THEME.border &&
    accent.toLowerCase() === DEFAULT_UI_THEME.accent &&
    accentSecondary.toLowerCase() === DEFAULT_UI_THEME.accentSecondary
  ) {
    return baseRules;
  }

  const accentTextContrast = getHexLuminance(accent) < 0.35 ? '#ffffff' : '#171a21';
  const accentSecondaryTextContrast = getHexLuminance(accentSecondary) < 0.35 ? '#ffffff' : '#171a21';

  return `
    ${baseRules}
    :root {
      --sm-bg-primary: ${bgPrimary};
      --sm-bg-secondary: ${bgSecondary};
      --sm-bg-surface: ${bgSurface};
      --sm-border: ${border};
      --sm-accent: ${accent};
      --sm-accent-secondary: ${accentSecondary};
    }

    /* Primary App & Header Backgrounds */
    .bg-\\[\\#171a21\\], .bg-\\[\\#14181f\\] {
      background-color: var(--sm-bg-primary) !important;
    }
    .bg-\\[\\#171a21\\]\\/60 {
      background-color: color-mix(in srgb, var(--sm-bg-primary) 75%, transparent) !important;
    }

    /* Secondary Cards, Panels & Modals */
    .bg-\\[\\#1b2838\\], .bg-\\[\\#16202d\\], .bg-\\[\\#212b3b\\] {
      background-color: var(--sm-bg-secondary) !important;
    }
    .bg-\\[\\#16202d\\]\\/60, .bg-\\[\\#16202d\\]\\/50 {
      background-color: color-mix(in srgb, var(--sm-bg-secondary) 70%, transparent) !important;
    }

    /* Inner Surfaces, Tables & Sub-boxes */
    .bg-\\[\\#141b24\\], .bg-\\[\\#131b26\\], .bg-\\[\\#141d28\\], .bg-\\[\\#121922\\], .bg-\\[\\#131b24\\], .bg-\\[\\#101722\\] {
      background-color: var(--sm-bg-surface) !important;
    }

    /* Gradients for Banners & Cards */
    .from-\\[\\#1b2838\\] {
      --tw-gradient-from: var(--sm-bg-secondary) !important;
    }
    .via-\\[\\#1b2838\\] {
      --tw-gradient-via: var(--sm-bg-secondary) !important;
    }
    .to-\\[\\#16202d\\], .to-\\[\\#212b3b\\] {
      --tw-gradient-to: var(--sm-bg-surface) !important;
    }
    .from-\\[\\#171a21\\] {
      --tw-gradient-from: var(--sm-bg-primary) !important;
    }

    /* Borders & Separators */
    .border-\\[\\#2a475e\\], .border-\\[\\#243547\\], .border-\\[\\#2a475e\\]\\/80, .border-\\[\\#2a475e\\]\\/60, .border-\\[\\#2a475e\\]\\/50, .border-\\[\\#243547\\]\\/60, .border-\\[\\#243547\\]\\/50 {
      border-color: var(--sm-border) !important;
    }
    .bg-\\[\\#2a475e\\] {
      background-color: var(--sm-border) !important;
    }
    .bg-\\[\\#2a475e\\]\\/60, .bg-\\[\\#2a475e\\]\\/50 {
      background-color: color-mix(in srgb, var(--sm-border) 65%, transparent) !important;
    }

    /* Primary Accent Color */
    .text-\\[\\#66c0f4\\] {
      color: var(--sm-accent) !important;
    }
    .bg-\\[\\#66c0f4\\] {
      background-color: var(--sm-accent) !important;
    }
    .bg-\\[\\#66c0f4\\].text-\\[\\#171a21\\] {
      color: ${accentTextContrast} !important;
    }
    .bg-\\[\\#66c0f4\\]\\/20, .bg-\\[\\#66c0f4\\]\\/10, .bg-\\[\\#172535\\] {
      background-color: color-mix(in srgb, var(--sm-accent) 18%, transparent) !important;
    }
    .border-\\[\\#66c0f4\\], .border-\\[\\#66c0f4\\]\\/50, .border-\\[\\#66c0f4\\]\\/40 {
      border-color: var(--sm-accent) !important;
    }
    .from-\\[\\#66c0f4\\] {
      --tw-gradient-from: var(--sm-accent) !important;
    }
    .to-\\[\\#66c0f4\\] {
      --tw-gradient-to: var(--sm-accent) !important;
    }

    /* Secondary Accent Color */
    .text-\\[\\#a4d007\\] {
      color: var(--sm-accent-secondary) !important;
    }
    .bg-\\[\\#a4d007\\] {
      background-color: var(--sm-accent-secondary) !important;
    }
    .bg-\\[\\#a4d007\\].text-\\[\\#171a21\\] {
      color: ${accentSecondaryTextContrast} !important;
    }
    .bg-\\[\\#a4d007\\]\\/10, .bg-\\[\\#193319\\] {
      background-color: color-mix(in srgb, var(--sm-accent-secondary) 18%, transparent) !important;
    }
    .border-\\[\\#a4d007\\], .border-\\[\\#a4d007\\]\\/50, .border-\\[\\#a4d007\\]\\/40, .border-\\[\\#a4d007\\]\\/30 {
      border-color: var(--sm-accent-secondary) !important;
    }
  `;
}

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: UIThemeConfig;
  onChangeTheme: (next: UIThemeConfig) => void;
  onResetTheme: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  onResetTheme,
}) => {
  const { lang, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ThemePreset) => {
    onChangeTheme({ ...preset.config });
  };

  const handleColorChange = (key: keyof Omit<UIThemeConfig, 'presetId'>, value: string) => {
    onChangeTheme({
      ...theme,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1b2838] border border-[#2a475e] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 text-[#66c0f4]">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                {t('Personalizacja Kolorów Interfejsu', 'Interface Color Personalization')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Wybierz gotowy motyw kolorystyczny lub stwórz własną paletę barw aplikacji',
                  'Choose a ready-made color theme or customize your own application color palette'
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

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Ready Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#66c0f4]" />
                {t('Gotowe Motywy Kolorystyczne', 'Curated Color Themes')}
              </h3>
              <button
                type="button"
                onClick={onResetTheme}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#171a21] hover:bg-[#2a475e] text-xs font-semibold text-[#c7d5e0] hover:text-white border border-[#2a475e] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#66c0f4]" />
                <span>{t('Przywróć domyślny', 'Reset to Default')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {UI_THEME_PRESETS.map((preset) => {
                const isSelected = theme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#66c0f4] bg-[#141b24] shadow-lg'
                        : 'border-[#2a475e] bg-[#141b24]/60 hover:bg-[#141b24] hover:border-[#66c0f4]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {lang === 'en' ? preset.nameEn : preset.namePl}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#66c0f4] text-[#171a21] flex items-center gap-0.5 shrink-0">
                            <Check className="w-3 h-3" /> {t('Aktywny', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8f98a0] mt-0.5 line-clamp-1">
                        {lang === 'en' ? preset.descEn : preset.descPl}
                      </p>
                    </div>

                    {/* Swatch Preview */}
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <span
                        className="w-6 h-6 rounded-full border border-white/20 shadow"
                        style={{ backgroundColor: preset.config.bgPrimary }}
                        title={t('Tło główne', 'Main background')}
                      />
                      <span
                        className="w-6 h-6 rounded-full border border-white/20 shadow"
                        style={{ backgroundColor: preset.config.bgSecondary }}
                        title={t('Karty', 'Cards')}
                      />
                      <span
                        className="w-6 h-6 rounded-full border border-white/20 shadow"
                        style={{ backgroundColor: preset.config.border }}
                        title={t('Obramowanie', 'Border')}
                      />
                      <span
                        className="w-6 h-6 rounded-full border border-white/30 shadow"
                        style={{ backgroundColor: preset.config.accent }}
                        title={t('Główny akcent', 'Primary accent')}
                      />
                      <span
                        className="w-6 h-6 rounded-full border border-white/30 shadow"
                        style={{ backgroundColor: preset.config.accentSecondary }}
                        title={t('Drugi akcent', 'Secondary accent')}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Color Pickers */}
          <div className="pt-4 border-t border-[#243547]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#a4d007]" />
                {t('Własne Kolory Elementów (Dowolna Personalizacja)', 'Custom Element Colors (Fine-Tuning)')}
              </h3>
              {theme.presetId === 'custom' && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#a4d007]/20 text-[#a4d007] border border-[#a4d007]/40 font-semibold">
                  {t('Własna konfiguracja aktywna', 'Custom configuration active')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <span className="text-xs font-mono text-[#c7d5e0] uppercase bg-[#171a21] px-2 py-1 rounded border border-[#2a475e]">
                      {theme[field.key]}
                    </span>
                    <label className="relative w-9 h-9 rounded-lg overflow-hidden border-2 border-white/30 cursor-pointer shadow-inner shrink-0">
                      <input
                        type="color"
                        value={theme[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="absolute -inset-2 w-14 h-14 cursor-pointer opacity-0"
                      />
                      <span
                        className="block w-full h-full"
                        style={{ backgroundColor: theme[field.key] }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#171a21] px-6 py-3.5 border-t border-[#2a475e] flex items-center justify-between">
          <span className="text-xs text-[#8f98a0]">
            {t(
              'Wybrany motyw zapisuje się automatycznie w przeglądarce oraz w pełnej kopii zapasowej (.json).',
              'Your selected theme is automatically saved in the browser and included in full backups (.json).'
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#66c0f4] text-[#171a21] font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            {t('Gotowe', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};

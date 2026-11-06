import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pl' | 'en';

export interface MonthItem {
  id: string;
  name: string;
  short: string;
}

export const MONTHS_PL: MonthItem[] = [
  { id: '01', name: 'Styczeń', short: 'Sty' },
  { id: '02', name: 'Luty', short: 'Lut' },
  { id: '03', name: 'Marzec', short: 'Mar' },
  { id: '04', name: 'Kwiecień', short: 'Kwi' },
  { id: '05', name: 'Maj', short: 'Maj' },
  { id: '06', name: 'Czerwiec', short: 'Cze' },
  { id: '07', name: 'Lipiec', short: 'Lip' },
  { id: '08', name: 'Sierpień', short: 'Sie' },
  { id: '09', name: 'Wrzesień', short: 'Wrz' },
  { id: '10', name: 'Październik', short: 'Paź' },
  { id: '11', name: 'Listopad', short: 'Lis' },
  { id: '12', name: 'Grudzień', short: 'Gru' },
];

export const MONTHS_EN: MonthItem[] = [
  { id: '01', name: 'January', short: 'Jan' },
  { id: '02', name: 'February', short: 'Feb' },
  { id: '03', name: 'March', short: 'Mar' },
  { id: '04', name: 'April', short: 'Apr' },
  { id: '05', name: 'May', short: 'May' },
  { id: '06', name: 'June', short: 'Jun' },
  { id: '07', name: 'July', short: 'Jul' },
  { id: '08', name: 'August', short: 'Aug' },
  { id: '09', name: 'September', short: 'Sep' },
  { id: '10', name: 'October', short: 'Oct' },
  { id: '11', name: 'November', short: 'Nov' },
  { id: '12', name: 'December', short: 'Dec' },
];

const TYPE_EN_MAP: Record<string, string> = {
  'Gra': 'Game',
  'Książka': 'Book',
  'Film': 'Movie',
  'Serial': 'Series',
  'Komiks': 'Comic',
  'Anime': 'Anime',
  'Manga': 'Manga',
  'Podcast': 'Podcast',
  'Planszówka': 'Board Game',
  'Dokument': 'Documentary',
  'Wszystkie': 'All',
};

const STATUS_EN_MAP: Record<string, string> = {
  'Ukończone': 'Completed',
  'W trakcie': 'In Progress',
  'Porzucone': 'Dropped',
  'Planowane': 'Planned',
  'Wszystkie': 'All',
};

const PLATFORM_EN_MAP: Record<string, string> = {
  'PC (Cyfrowa)': 'PC (Digital)',
  'Książka papierowa': 'Paperback / Print',
  'Kino / IMAX': 'Cinema / IMAX',
  'Inna': 'Other',
  'Inna / Domyślna': 'Other / Default',
  'Brak': 'None',
};

const GENRE_EN_MAP: Record<string, string> = {
  'Akcja': 'Action',
  'Kryminał': 'Crime / Mystery',
  'Dramat': 'Drama',
  'dramat historyczny': 'Historical Drama',
  'Biograficzny': 'Biography',
  'Historyczny': 'Historical',
  'Komedia': 'Comedy',
  'Platformówka 3D': '3D Platformer',
  'animacja': 'Animation',
  'Inny': 'Other',
  'Inny / Niesklasyfikowany': 'Other / Unclassified',
};

export function translateType(typeName: string, lang: Language): string {
  if (lang === 'pl') return typeName;
  return TYPE_EN_MAP[typeName] || typeName;
}

export function translateStatus(status: string, lang: Language): string {
  if (lang === 'pl') return status;
  return STATUS_EN_MAP[status] || status;
}

export function translatePlatform(platform: string, lang: Language): string {
  if (lang === 'pl') return platform;
  return PLATFORM_EN_MAP[platform] || platform;
}

export function translateGenre(genre: string, lang: Language): string {
  if (lang === 'pl') return genre;
  return GENRE_EN_MAP[genre] || genre;
}

export function getMonths(lang: Language): MonthItem[] {
  return lang === 'en' ? MONTHS_EN : MONTHS_PL;
}

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (pl: string, en: string) => string;
  trType: (typeName: string) => string;
  trStatus: (status: string) => string;
  trPlatform: (platform: string) => string;
  trGenre: (genre: string) => string;
  months: MonthItem[];
}

const LANG_STORAGE_KEY = 'shelfmedia_lang_v1';

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'pl',
  setLang: () => {},
  toggleLang: () => {},
  t: (pl) => pl,
  trType: (v) => v,
  trStatus: (v) => v,
  trPlatform: (v) => v,
  trGenre: (v) => v,
  months: MONTHS_PL,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'pl') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'pl';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  useEffect(() => {
    const handleExternalSync = (e: Event) => {
      const custom = e as CustomEvent;
      const nextLang = custom.detail?.lang;
      if (nextLang === 'pl' || nextLang === 'en') {
        setLangState((prev) => (prev === nextLang ? prev : nextLang));
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && (e.newValue === 'pl' || e.newValue === 'en')) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener('shelfmedia:external-sync', handleExternalSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('shelfmedia:external-sync', handleExternalSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent('shelfmedia:local-extra-change'));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLang = () => {
    setLangState((prev) => {
      const next = prev === 'pl' ? 'en' : 'pl';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
        window.dispatchEvent(new CustomEvent('shelfmedia:local-extra-change'));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const t = (pl: string, en: string) => (lang === 'en' ? en : pl);
  const trType = (typeName: string) => translateType(typeName, lang);
  const trStatus = (status: string) => translateStatus(status, lang);
  const trPlatform = (platform: string) => translatePlatform(platform, lang);
  const trGenre = (genre: string) => translateGenre(genre, lang);
  const months = getMonths(lang);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        trType,
        trStatus,
        trPlatform,
        trGenre,
        months,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}

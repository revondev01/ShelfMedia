export type ItemType = string;

export interface MediaTypeConfig {
  name: string;
  color: string;
  icon: string;
  iconColor?: string; // Kolor samej ikony (symbolu)
  bgColor?: string;   // Kolor tła ikonki / plakietki
  description?: string;
}

export interface AppLogoConfig {
  icon: string;
  bgColor: string;
  iconColor: string;
}

export const DEFAULT_APP_LOGO: AppLogoConfig = {
  icon: 'Library',
  bgColor: '#1999e3',
  iconColor: '#ffffff',
};

export interface Collection {
  id: string;
  title: string;
  description?: string;
  itemIds: number[];
  accentColor?: string;
  icon?: string;
  iconColor?: string;
  bgColor?: string;
  bannerEmoji?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_TYPE_CONFIGS: Record<string, MediaTypeConfig> = {};

export const DEFAULT_ITEM_TYPES: string[] = [];

export type ItemStatus = 'Ukończone' | 'W trakcie' | 'Porzucone' | 'Planowane';

export type RatingScale = 5 | 10;

export interface MediaItem {
  id: number;
  title: string;
  year: number | null;
  item_type: ItemType;
  platform: string;
  genre: string;
  creator: string; // Twórca / Twórcy (autor, reżyser, studio itp.)
  rating: number; // 0.5 - 5.0 or 0.5 - 10.0 depending on active RatingScale
  _rawRating10?: number; // Preserves original 10-point value when switching scales
  status: ItemStatus;
  hours_spent?: number | null; // Czas w godzinach - opcjonalny
  pages?: number | null; // Liczba stron - opcjonalna, szczególnie dla książek i komiksów
  date_logged: string; // YYYY-MM-DD
  comment: string;
}

export type SortField = 'title' | 'year' | 'creator' | 'rating' | 'hours_spent' | 'pages' | 'date_logged' | 'id';
export type SortOrder = 'asc' | 'desc';

export type SpineColorMode = 'type' | 'platform';

export const DEFAULT_PLATFORMS: string[] = [];

export const DEFAULT_PLATFORM_COLORS: Record<string, string> = {};

export const DEFAULT_GENRES: string[] = [];

export interface ShelfMediaBackup {
  format: 'shelfmedia_backup';
  version: string;
  exportedAt: string;
  itemsCount: number;
  data: {
    items: MediaItem[];
    types: string[];
    typeConfigs: Record<string, MediaTypeConfig>;
    platforms: string[];
    platformColors?: Record<string, string>;
    genres: string[];
    savedGradients?: any[];
    uiTheme?: any;
    ratingScale?: RatingScale;
    collections?: Collection[];
    userName?: string;
    appLogo?: AppLogoConfig;
  };
}



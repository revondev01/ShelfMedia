import { MediaItem, MediaTypeConfig, RatingScale, DEFAULT_ITEM_TYPES, DEFAULT_PLATFORMS, DEFAULT_PLATFORM_COLORS, DEFAULT_GENRES, DEFAULT_TYPE_CONFIGS, Collection, AppLogoConfig, DEFAULT_APP_LOGO, SpineColorMode } from '../types';
import { UIThemeConfig, DEFAULT_UI_THEME } from '../components/ThemeModal';
import { Language } from '../i18n';

export const SYNC_UPDATED_AT_KEY = 'shelfmedia_sync_updated_at_v1';
export const SYNC_CHANNEL_NAME = 'shelfmedia_realtime_sync_v1';

export interface ShelfSettingsSnapshot {
  ledEnabled: boolean;
  ledColor: string;
  shelfCapacity: number;
  shelfPlankColor: string;
  shelfBgColor: string;
  bookendColor: string;
  spineColorMode?: SpineColorMode;
  userName?: string;
  appLogo?: AppLogoConfig;
}

export interface SyncSnapshot {
  updatedAt: number;
  clientId: string;
  lang: Language;
  ratingScale: RatingScale;
  userName?: string;
  appLogo?: AppLogoConfig;
  items: MediaItem[];
  types: string[];
  typeConfigs: Record<string, MediaTypeConfig>;
  platforms: string[];
  platformColors?: Record<string, string>;
  genres: string[];
  collections?: Collection[];
  uiTheme: UIThemeConfig;
  savedGradients: any[];
  shelfSettings: ShelfSettingsSnapshot;
}

const CLIENT_ID = `sm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export function getClientId(): string {
  return CLIENT_ID;
}

export function getLocalUpdatedAt(): number {
  try {
    const raw = localStorage.getItem(SYNC_UPDATED_AT_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Check if there are already items in localStorage so existing data has a valid baseline timestamp
    const existingItems = localStorage.getItem('shelfmedia_items_v2');
    if (existingItems) {
      const parsedItems = JSON.parse(existingItems);
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        return 1000;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return 0;
}

export function setLocalUpdatedAt(ts: number): void {
  try {
    localStorage.setItem(SYNC_UPDATED_AT_KEY, String(ts));
  } catch {
    // Ignore storage write errors
  }
}

export function readShelfSettingsFromStorage(): ShelfSettingsSnapshot {
  let ledEnabled = true;
  let ledColor = '#38bdf8';
  let shelfCapacity = 12;
  let shelfPlankColor = '#334155';
  let shelfBgColor = '#0d141d';
  let bookendColor = '#475569';
  let spineColorMode: SpineColorMode = 'type';
  let userName = '';
  let appLogo: AppLogoConfig = DEFAULT_APP_LOGO;

  try {
    const rawLedEnabled = localStorage.getItem('shelfmedia_led_beam_enabled');
    if (rawLedEnabled !== null) ledEnabled = rawLedEnabled === 'true';

    const rawLedColor = localStorage.getItem('shelfmedia_led_beam_color');
    if (rawLedColor) ledColor = rawLedColor;

    const rawCap = localStorage.getItem('shelfmedia_shelf_capacity');
    if (rawCap) {
      const p = parseInt(rawCap, 10);
      if (!isNaN(p) && p >= 1) shelfCapacity = Math.min(20, Math.max(1, p));
    }

    const rawPlank = localStorage.getItem('shelfmedia_shelf_plank_color');
    if (rawPlank) shelfPlankColor = rawPlank;

    const rawBg = localStorage.getItem('shelfmedia_shelf_bg_color');
    if (rawBg) shelfBgColor = rawBg;

    const rawBookend = localStorage.getItem('shelfmedia_shelf_bookend_color');
    if (rawBookend) bookendColor = rawBookend;

    const rawSpineMode = localStorage.getItem('shelfmedia_spine_color_mode');
    if (rawSpineMode === 'platform' || rawSpineMode === 'type') spineColorMode = rawSpineMode;

    const rawUser = localStorage.getItem('shelfmedia_user_name_v1');
    if (rawUser) userName = rawUser;

    const rawLogo = localStorage.getItem('shelfmedia_app_logo_v1');
    if (rawLogo) {
      const parsedLogo = JSON.parse(rawLogo);
      if (parsedLogo && typeof parsedLogo === 'object') {
        appLogo = { ...DEFAULT_APP_LOGO, ...parsedLogo };
      }
    }
  } catch {
    // Ignore storage errors
  }

  return {
    ledEnabled,
    ledColor,
    shelfCapacity,
    shelfPlankColor,
    shelfBgColor,
    bookendColor,
    spineColorMode,
    userName,
    appLogo,
  };
}

export function writeShelfSettingsToStorage(settings: Partial<ShelfSettingsSnapshot>): void {
  try {
    if (typeof settings.ledEnabled === 'boolean') {
      localStorage.setItem('shelfmedia_led_beam_enabled', String(settings.ledEnabled));
    }
    if (typeof settings.ledColor === 'string' && settings.ledColor) {
      localStorage.setItem('shelfmedia_led_beam_color', settings.ledColor);
    }
    if (typeof settings.shelfCapacity === 'number' && !isNaN(settings.shelfCapacity)) {
      localStorage.setItem(
        'shelfmedia_shelf_capacity',
        String(Math.min(20, Math.max(1, Math.round(settings.shelfCapacity))))
      );
    }
    if (typeof settings.shelfPlankColor === 'string' && settings.shelfPlankColor) {
      localStorage.setItem('shelfmedia_shelf_plank_color', settings.shelfPlankColor);
    }
    if (typeof settings.shelfBgColor === 'string' && settings.shelfBgColor) {
      localStorage.setItem('shelfmedia_shelf_bg_color', settings.shelfBgColor);
    }
    if (typeof settings.bookendColor === 'string' && settings.bookendColor) {
      localStorage.setItem('shelfmedia_shelf_bookend_color', settings.bookendColor);
    }
    if (settings.spineColorMode === 'type' || settings.spineColorMode === 'platform') {
      localStorage.setItem('shelfmedia_spine_color_mode', settings.spineColorMode);
    }
    if (typeof settings.userName === 'string') {
      localStorage.setItem('shelfmedia_user_name_v1', settings.userName);
    }
    if (settings.appLogo && typeof settings.appLogo === 'object') {
      localStorage.setItem('shelfmedia_app_logo_v1', JSON.stringify(settings.appLogo));
    }
  } catch {
    // Ignore storage errors
  }
}

export function readFullSnapshotFromStorage(updatedAtOverride?: number): SyncSnapshot {
  const updatedAt = updatedAtOverride !== undefined ? updatedAtOverride : getLocalUpdatedAt();
  let lang: Language = 'pl';
  let ratingScale: RatingScale = 10;
  let items: MediaItem[] = [];
  let types: string[] = DEFAULT_ITEM_TYPES;
  let typeConfigs: Record<string, MediaTypeConfig> = DEFAULT_TYPE_CONFIGS;
  let platforms: string[] = DEFAULT_PLATFORMS;
  let platformColors: Record<string, string> = DEFAULT_PLATFORM_COLORS;
  let genres: string[] = DEFAULT_GENRES;
  let uiTheme: UIThemeConfig = DEFAULT_UI_THEME;
  let savedGradients: any[] = [];

  try {
    const rawLang = localStorage.getItem('shelfmedia_lang_v1');
    if (rawLang === 'en' || rawLang === 'pl') lang = rawLang;

    const rawScale = localStorage.getItem('shelfmedia_rating_scale_v1');
    if (rawScale === '5') ratingScale = 5;
    else if (rawScale === '10') ratingScale = 10;

    const rawItems = localStorage.getItem('shelfmedia_items_v2');
    if (rawItems) {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) items = parsed;
    }

    const rawTypes = localStorage.getItem('shelfmedia_types_v2');
    if (rawTypes) {
      const parsed = JSON.parse(rawTypes);
      if (Array.isArray(parsed)) types = parsed;
    }

    const rawConfigs = localStorage.getItem('shelfmedia_type_configs_v3');
    if (rawConfigs) {
      const parsed = JSON.parse(rawConfigs);
      if (parsed && typeof parsed === 'object') typeConfigs = { ...DEFAULT_TYPE_CONFIGS, ...parsed };
    }

    const rawPlatforms = localStorage.getItem('shelfmedia_platforms_v2');
    if (rawPlatforms) {
      const parsed = JSON.parse(rawPlatforms);
      if (Array.isArray(parsed)) platforms = parsed;
    }

    const rawPlatformColors = localStorage.getItem('shelfmedia_platform_colors_v2');
    if (rawPlatformColors) {
      const parsed = JSON.parse(rawPlatformColors);
      if (parsed && typeof parsed === 'object') platformColors = { ...DEFAULT_PLATFORM_COLORS, ...parsed };
    }

    const rawGenres = localStorage.getItem('shelfmedia_genres_v2');
    if (rawGenres) {
      const parsed = JSON.parse(rawGenres);
      if (Array.isArray(parsed)) genres = parsed;
    }

    const rawTheme = localStorage.getItem('shelfmedia_ui_theme_v1');
    if (rawTheme) {
      const parsed = JSON.parse(rawTheme);
      if (parsed && typeof parsed === 'object') uiTheme = { ...DEFAULT_UI_THEME, ...parsed };
    }

    const rawGrads = localStorage.getItem('shelfmedia_saved_gradients_v1');
    if (rawGrads) {
      const parsed = JSON.parse(rawGrads);
      if (Array.isArray(parsed)) savedGradients = parsed;
    }

    let collections: Collection[] = [];
    const rawCollections = localStorage.getItem('shelfmedia_collections_v1');
    if (rawCollections) {
      const parsed = JSON.parse(rawCollections);
      if (Array.isArray(parsed)) collections = parsed;
    }

    const shelfSettings = readShelfSettingsFromStorage();

    return {
      updatedAt,
      clientId: CLIENT_ID,
      lang,
      ratingScale,
      userName: shelfSettings.userName || '',
      appLogo: shelfSettings.appLogo || DEFAULT_APP_LOGO,
      items,
      types,
      typeConfigs,
      platforms,
      platformColors,
      genres,
      collections,
      uiTheme,
      savedGradients,
      shelfSettings,
    };
  } catch {
    // Ignore storage read errors
  }

  const shelfSettings = readShelfSettingsFromStorage();
  return {
    updatedAt,
    clientId: CLIENT_ID,
    lang,
    ratingScale,
    userName: shelfSettings.userName || '',
    appLogo: shelfSettings.appLogo || DEFAULT_APP_LOGO,
    items,
    types,
    typeConfigs,
    platforms,
    platformColors,
    genres,
    collections: [],
    uiTheme,
    savedGradients,
    shelfSettings,
  };
}

export function writeSnapshotToLocalStorage(snapshot: SyncSnapshot): void {
  try {
    localStorage.setItem(SYNC_UPDATED_AT_KEY, String(snapshot.updatedAt));
    if (Array.isArray(snapshot.items)) {
      localStorage.setItem('shelfmedia_items_v2', JSON.stringify(snapshot.items));
    }
    if (Array.isArray(snapshot.types)) {
      localStorage.setItem('shelfmedia_types_v2', JSON.stringify(snapshot.types));
    }
    if (snapshot.typeConfigs && typeof snapshot.typeConfigs === 'object') {
      localStorage.setItem('shelfmedia_type_configs_v3', JSON.stringify(snapshot.typeConfigs));
    }
    if (Array.isArray(snapshot.platforms)) {
      localStorage.setItem('shelfmedia_platforms_v2', JSON.stringify(snapshot.platforms));
    }
    if (snapshot.platformColors && typeof snapshot.platformColors === 'object') {
      localStorage.setItem('shelfmedia_platform_colors_v2', JSON.stringify(snapshot.platformColors));
    }
    if (Array.isArray(snapshot.genres)) {
      localStorage.setItem('shelfmedia_genres_v2', JSON.stringify(snapshot.genres));
    }
    if (Array.isArray(snapshot.collections)) {
      localStorage.setItem('shelfmedia_collections_v1', JSON.stringify(snapshot.collections));
    }
    if (snapshot.uiTheme && typeof snapshot.uiTheme === 'object') {
      localStorage.setItem('shelfmedia_ui_theme_v1', JSON.stringify(snapshot.uiTheme));
    }
    if (snapshot.ratingScale === 5 || snapshot.ratingScale === 10) {
      localStorage.setItem('shelfmedia_rating_scale_v1', String(snapshot.ratingScale));
    }
    if (snapshot.lang === 'pl' || snapshot.lang === 'en') {
      localStorage.setItem('shelfmedia_lang_v1', snapshot.lang);
    }
    if (typeof snapshot.userName === 'string') {
      localStorage.setItem('shelfmedia_user_name_v1', snapshot.userName);
    }
    if (snapshot.appLogo && typeof snapshot.appLogo === 'object') {
      localStorage.setItem('shelfmedia_app_logo_v1', JSON.stringify(snapshot.appLogo));
    }
    if (Array.isArray(snapshot.savedGradients)) {
      localStorage.setItem('shelfmedia_saved_gradients_v1', JSON.stringify(snapshot.savedGradients));
    }
    if (snapshot.shelfSettings && typeof snapshot.shelfSettings === 'object') {
      writeShelfSettingsToStorage({
        ...snapshot.shelfSettings,
        ...(snapshot.userName !== undefined ? { userName: snapshot.userName } : {}),
        ...(snapshot.appLogo !== undefined ? { appLogo: snapshot.appLogo } : {})
      });
    }
  } catch (err) {
    console.error('Error writing snapshot to localStorage:', err);
  }
}

export function getSyncEndpoints(): string[] {
  const endpoints = new Set<string>();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (origin && origin.startsWith('http')) {
    endpoints.add(`${origin}/api/sync`);
  }

  return Array.from(endpoints);
}

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

export function broadcastSnapshotLocally(snapshot: SyncSnapshot): void {
  try {
    broadcastChannel?.postMessage(snapshot);
  } catch {
    // Ignore BroadcastChannel errors
  }
}

export async function pushSnapshotToEndpoints(snapshot: SyncSnapshot): Promise<boolean> {
  broadcastSnapshotLocally(snapshot);
  const endpoints = getSyncEndpoints();
  let anySuccess = false;

  await Promise.allSettled(
    endpoints.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (res.ok) anySuccess = true;
      } catch {
        // Endpoint may not be running (e.g. portable server not started yet or offline)
      }
    })
  );

  return anySuccess;
}

export async function fetchLatestRemoteSnapshot(): Promise<SyncSnapshot | null> {
  const endpoints = getSyncEndpoints();
  let newest: SyncSnapshot | null = null;

  await Promise.allSettled(
    endpoints.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${url}?t=${Date.now()}`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);
        if (!res.ok) return;
        const data = (await res.json()) as SyncSnapshot;
        if (
          data &&
          typeof data === 'object' &&
          typeof data.updatedAt === 'number' &&
          data.updatedAt > 0 &&
          Array.isArray(data.items)
        ) {
          if (!newest || data.updatedAt > newest.updatedAt) {
            newest = data;
          }
        }
      } catch {
        // Endpoint unreachable
      }
    })
  );

  return newest;
}

export function notifyLocalExtraChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shelfmedia:local-extra-change'));
  }
}

export function notifyExternalSyncApplied(snapshot: SyncSnapshot): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shelfmedia:external-sync', { detail: snapshot }));
  }
}

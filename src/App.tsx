/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MediaItem, ItemType, ItemStatus, DEFAULT_PLATFORMS, DEFAULT_PLATFORM_COLORS, DEFAULT_GENRES, DEFAULT_ITEM_TYPES, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, ShelfMediaBackup, RatingScale, Collection, AppLogoConfig, DEFAULT_APP_LOGO } from './types';
import { INITIAL_MEDIA_ITEMS } from './sampleData';
import { Navbar } from './components/Navbar';
import { LibraryTab } from './components/LibraryTab';
import { CollectionsTab } from './components/CollectionsTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { ItemModal } from './components/ItemModal';
import { ReviewModal } from './components/ReviewModal';
import { OptionsManagerModal } from './components/OptionsManagerModal';
import { SocialCardModal } from './components/SocialCardModal';
import { BackupModal } from './components/BackupModal';
import { ThemeModal, UIThemeConfig, DEFAULT_UI_THEME, generateThemeCss } from './components/ThemeModal';
import { CsvImportModal } from './components/CsvImportModal';
import { downloadPortableZip } from './utils/zipGenerator';
import { getMediaTypeIcon, hexToRgba, getRandomPresetColor, createRandomMediaTypeConfig } from './utils/mediaTypeUtils';
import {
  SyncSnapshot,
  SYNC_CHANNEL_NAME,
  getClientId,
  getLocalUpdatedAt,
  setLocalUpdatedAt,
  readFullSnapshotFromStorage,
  writeSnapshotToLocalStorage,
  pushSnapshotToEndpoints,
  fetchLatestRemoteSnapshot,
  notifyExternalSyncApplied,
} from './utils/syncManager';
import { CheckCircle2, ShieldCheck, Package } from 'lucide-react';
import { useLanguage } from './i18n';

const STORAGE_KEY = 'shelfmedia_items_v2';
const PLATFORMS_STORAGE_KEY = 'shelfmedia_platforms_v2';
const PLATFORM_COLORS_STORAGE_KEY = 'shelfmedia_platform_colors_v2';
const GENRES_STORAGE_KEY = 'shelfmedia_genres_v2';
const TYPES_STORAGE_KEY = 'shelfmedia_types_v2';
const TYPE_CONFIGS_STORAGE_KEY = 'shelfmedia_type_configs_v3';
const UI_THEME_STORAGE_KEY = 'shelfmedia_ui_theme_v1';
const RATING_SCALE_STORAGE_KEY = 'shelfmedia_rating_scale_v1';
const COLLECTIONS_STORAGE_KEY = 'shelfmedia_collections_v1';
const USER_NAME_STORAGE_KEY = 'shelfmedia_user_name_v1';
const APP_LOGO_STORAGE_KEY = 'shelfmedia_app_logo_v1';

const parsePositiveIntValue = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return !isNaN(val) && val > 0 ? Math.round(val) : null;
  }
  const normalized = String(val).trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) return null;
  const numMatch = normalized.match(/-?\d+(\.\d+)?/);
  if (!numMatch) return null;
  const parsed = Math.round(parseFloat(numMatch[0]));
  return !isNaN(parsed) && parsed > 0 ? parsed : null;
};

export default function App() {
  const { t, trType } = useLanguage();

  const [items, setItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: MediaItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((it) => ({
            ...it,
            creator: it.creator || '',
            platform: it.platform === 'Steam (PC)' ? 'PC (Cyfrowa)' : it.platform,
            pages: parsePositiveIntValue(it.pages),
            hours_spent: it.hours_spent !== undefined ? it.hours_spent : null,
          }));
        }
      }
    } catch (e) {
      console.error('Błąd odczytu z localStorage:', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'library' | 'collections' | 'stats' | 'settings'>('library');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [optionsModalMode, setOptionsModalMode] = useState<'full' | 'shelf'>('full');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [viewingReviewItem, setViewingReviewItem] = useState<MediaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collections state
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Błąd odczytu kolekcji:', e);
    }
    return [];
  });

  // User Name for all summaries and watermarks
  const [userName, setUserName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(USER_NAME_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error('Błąd odczytu nazwy użytkownika:', e);
    }
    return '';
  });

  // Main Application Icon (background color, inner graphic icon, inner graphic color)
  const [appLogo, setAppLogo] = useState<AppLogoConfig>(() => {
    try {
      const saved = localStorage.getItem(APP_LOGO_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_APP_LOGO, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Błąd odczytu ikony aplikacji:', e);
    }
    return DEFAULT_APP_LOGO;
  });

  // Rating scale: 5 (0.5 - 5.0) or 10 (0.5 - 10.0)
  const [ratingScale, setRatingScale] = useState<RatingScale>(() => {
    try {
      const saved = localStorage.getItem(RATING_SCALE_STORAGE_KEY);
      if (saved === '5') return 5;
      if (saved === '10') return 10;
    } catch (e) {
      console.error('Błąd odczytu skali ocen:', e);
    }
    return 10;
  });

  // Dynamic UI Color Theme Personalization
  const [uiTheme, setUiTheme] = useState<UIThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_UI_THEME, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Błąd odczytu motywu UI:', e);
    }
    return DEFAULT_UI_THEME;
  });

  // Dynamic customizable Platforms & Formats (empty on fresh start)
  const [platforms, setPlatforms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PLATFORMS_STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Błąd odczytu platform:', e);
    }
    return DEFAULT_PLATFORMS;
  });

  // Dynamic customizable Platform & Format Colors (empty on fresh start, random colors assigned when items added)
  const [platformColors, setPlatformColors] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(PLATFORM_COLORS_STORAGE_KEY);
      if (saved) {
        const parsed: Record<string, string> = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_PLATFORM_COLORS, ...parsed };
      }
    } catch (e) {
      console.error('Błąd odczytu kolorów platform:', e);
    }
    return DEFAULT_PLATFORM_COLORS;
  });

  // Dynamic customizable Genres (empty on fresh start)
  const [genres, setGenres] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GENRES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Błąd odczytu gatunków:', e);
    }
    return DEFAULT_GENRES;
  });

  // Dynamic customizable Types (empty on fresh start)
  const [types, setTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TYPES_STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return Array.from(new Set([...DEFAULT_ITEM_TYPES, ...parsed]));
      }
    } catch (e) {
      console.error('Błąd odczytu typów:', e);
    }
    return DEFAULT_ITEM_TYPES;
  });

  // Dynamic customizable Type Configurations (empty on fresh start, random colors assigned when items added)
  const [typeConfigs, setTypeConfigs] = useState<Record<string, MediaTypeConfig>>(() => {
    try {
      const saved = localStorage.getItem(TYPE_CONFIGS_STORAGE_KEY);
      if (saved) {
        const parsed: Record<string, MediaTypeConfig> = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_TYPE_CONFIGS, ...parsed };
      }
    } catch (e) {
      console.error('Błąd odczytu konfiguracji typów:', e);
    }
    return DEFAULT_TYPE_CONFIGS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const isApplyingExternalSyncRef = useRef(false);
  const hasCompletedInitialSyncRef = useRef(false);
  const lastAppliedTimestampRef = useRef<number>(getLocalUpdatedAt());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, duration = 4000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  // Apply an incoming snapshot from another window / localhost / server
  const applyIncomingSnapshot = useCallback((snapshot: SyncSnapshot) => {
    if (!snapshot || typeof snapshot.updatedAt !== 'number') return;
    if (snapshot.clientId === getClientId() && snapshot.updatedAt <= lastAppliedTimestampRef.current) {
      return;
    }
    if (snapshot.updatedAt <= lastAppliedTimestampRef.current) {
      return;
    }

    isApplyingExternalSyncRef.current = true;
    lastAppliedTimestampRef.current = snapshot.updatedAt;

    writeSnapshotToLocalStorage(snapshot);

    if (Array.isArray(snapshot.items)) {
      setItems(
        snapshot.items.slice(0, 25000).map((it) => ({
          ...it,
          creator: it.creator || '',
          platform: it.platform === 'Steam (PC)' ? 'PC (Cyfrowa)' : it.platform,
          pages: parsePositiveIntValue(it.pages),
          hours_spent: it.hours_spent !== undefined ? it.hours_spent : null,
        }))
      );
    }
    if (Array.isArray(snapshot.types)) {
      setTypes(Array.from(new Set([...DEFAULT_ITEM_TYPES, ...snapshot.types])));
    }
    if (snapshot.typeConfigs && typeof snapshot.typeConfigs === 'object' && !Array.isArray(snapshot.typeConfigs)) {
      const safeTypeConfigs: Record<string, MediaTypeConfig> = { ...DEFAULT_TYPE_CONFIGS };
      for (const [k, v] of Object.entries(snapshot.typeConfigs)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (v && typeof v === 'object') safeTypeConfigs[k] = v;
      }
      setTypeConfigs(safeTypeConfigs);
    }
    if (Array.isArray(snapshot.platforms)) {
      setPlatforms(snapshot.platforms);
    }
    if (snapshot.platformColors && typeof snapshot.platformColors === 'object' && !Array.isArray(snapshot.platformColors)) {
      const safePlatformColors: Record<string, string> = { ...DEFAULT_PLATFORM_COLORS };
      for (const [k, v] of Object.entries(snapshot.platformColors)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (typeof v === 'string') safePlatformColors[k] = v;
      }
      setPlatformColors(safePlatformColors);
    }
    if (Array.isArray(snapshot.genres)) {
      setGenres(snapshot.genres);
    }
    if (snapshot.uiTheme && typeof snapshot.uiTheme === 'object' && !Array.isArray(snapshot.uiTheme)) {
      setUiTheme({ ...DEFAULT_UI_THEME, ...snapshot.uiTheme });
    }
    if (snapshot.ratingScale === 5 || snapshot.ratingScale === 10) {
      setRatingScale(snapshot.ratingScale);
    }
    if (Array.isArray(snapshot.collections)) {
      setCollections(snapshot.collections);
    }
    if (typeof snapshot.userName === 'string') {
      setUserName(snapshot.userName);
    } else if (typeof snapshot.shelfSettings?.userName === 'string') {
      setUserName(snapshot.shelfSettings.userName);
    }
    if (snapshot.appLogo && typeof snapshot.appLogo === 'object') {
      setAppLogo({ ...DEFAULT_APP_LOGO, ...snapshot.appLogo });
    } else if (snapshot.shelfSettings?.appLogo && typeof snapshot.shelfSettings.appLogo === 'object') {
      setAppLogo({ ...DEFAULT_APP_LOGO, ...snapshot.shelfSettings.appLogo });
    }

    notifyExternalSyncApplied(snapshot);

    setTimeout(() => {
      isApplyingExternalSyncRef.current = false;
    }, 80);
  }, []);

  // Push current local state to all sync channels (BroadcastChannel, localhost, cloud preview)
  const triggerLocalPush = useCallback(() => {
    if (isApplyingExternalSyncRef.current) return;
    const now = Date.now();
    lastAppliedTimestampRef.current = now;
    setLocalUpdatedAt(now);
    const snapshot = readFullSnapshotFromStorage(now);
    void pushSnapshotToEndpoints(snapshot);
  }, []);

  // Sync items with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Błąd zapisu do localStorage:', e);
    }
  }, [items]);

  // Sync platforms with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(platforms));
    } catch (e) {
      console.error('Błąd zapisu platform:', e);
    }
  }, [platforms]);

  // Sync platformColors with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PLATFORM_COLORS_STORAGE_KEY, JSON.stringify(platformColors));
    } catch (e) {
      console.error('Błąd zapisu kolorów platform:', e);
    }
  }, [platformColors]);

  // Sync genres with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(genres));
    } catch (e) {
      console.error('Błąd zapisu gatunków:', e);
    }
  }, [genres]);

  // Sync types with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TYPES_STORAGE_KEY, JSON.stringify(types));
    } catch (e) {
      console.error('Błąd zapisu typów:', e);
    }
  }, [types]);

  // Sync typeConfigs with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TYPE_CONFIGS_STORAGE_KEY, JSON.stringify(typeConfigs));
    } catch (e) {
      console.error('Błąd zapisu konfiguracji typów:', e);
    }
  }, [typeConfigs]);

  // Sync uiTheme with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, JSON.stringify(uiTheme));
    } catch (e) {
      console.error('Błąd zapisu motywu UI:', e);
    }
  }, [uiTheme]);

  // Sync ratingScale with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RATING_SCALE_STORAGE_KEY, String(ratingScale));
    } catch (e) {
      console.error('Błąd zapisu skali ocen:', e);
    }
  }, [ratingScale]);

  // Sync collections with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
    } catch (e) {
      console.error('Błąd zapisu kolekcji:', e);
    }
  }, [collections]);

  // Sync userName with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USER_NAME_STORAGE_KEY, userName);
    } catch (e) {
      console.error('Błąd zapisu nazwy użytkownika:', e);
    }
  }, [userName]);

  // Sync appLogo with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(APP_LOGO_STORAGE_KEY, JSON.stringify(appLogo));
    } catch (e) {
      console.error('Błąd zapisu ikony aplikacji:', e);
    }
  }, [appLogo]);

  // Automatically push whenever core state changes after initial handshake
  useEffect(() => {
    if (!hasCompletedInitialSyncRef.current) return;
    if (isApplyingExternalSyncRef.current) return;
    triggerLocalPush();
  }, [items, platforms, platformColors, genres, types, typeConfigs, uiTheme, ratingScale, collections, userName, appLogo, triggerLocalPush]);

  // Bidirectional synchronization lifecycle (Initial pull/push + BroadcastChannel + SSE + Polling + Storage + Extra changes)
  const handleManualSync = useCallback(async (showNotification = false) => {
    setIsSyncing(true);
    try {
      const remote = await fetchLatestRemoteSnapshot();
      const localTs = getLocalUpdatedAt();
      if (remote && remote.updatedAt > localTs) {
        applyIncomingSnapshot(remote);
        if (showNotification) {
          showToast(
            t(
              'Zsynchronizowano dane między oknem a localhost!',
              'Synchronized data between window and localhost!'
            ),
            3500
          );
        }
      } else if (localTs > (remote?.updatedAt || 0)) {
        const snapshot = readFullSnapshotFromStorage(localTs);
        await pushSnapshotToEndpoints(snapshot);
        if (showNotification) {
          showToast(
            t(
              'Wysłano aktualny stan bazy do drugiego okna / localhost!',
              'Pushed current database state to other window / localhost!'
            ),
            3500
          );
        }
      } else if (showNotification) {
        showToast(
          t(
            'Wersja na localhost i wersja w oknie są w pełni zsynchronizowane!',
            'Localhost version and window version are fully synchronized!'
          ),
          3500
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [applyIncomingSnapshot, showToast, t]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial sync check on startup (deferred slightly so initial UI render is instantaneous)
    const initTimer = setTimeout(async () => {
      const remote = await fetchLatestRemoteSnapshot();
      if (!isMounted) return;
      const localTs = getLocalUpdatedAt();
      if (remote && remote.updatedAt > localTs) {
        applyIncomingSnapshot(remote);
      } else if (localTs > (remote?.updatedAt || 0)) {
        const snapshot = readFullSnapshotFromStorage(localTs);
        await pushSnapshotToEndpoints(snapshot);
      }
      hasCompletedInitialSyncRef.current = true;
    }, 100);

    // 2. Same-browser BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event?.data && typeof event.data.updatedAt === 'number') {
            applyIncomingSnapshot(event.data as SyncSnapshot);
          }
        };
      }
    } catch {
      bc = null;
    }

    // 3. LocalStorage cross-tab listener
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'shelfmedia_sync_updated_at_v1' && e.newValue) {
        const incomingTs = Number(e.newValue);
        if (!isNaN(incomingTs) && incomingTs > lastAppliedTimestampRef.current) {
          const snapshot = readFullSnapshotFromStorage(incomingTs);
          applyIncomingSnapshot(snapshot);
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 4. Extra local changes listener (language, virtual shelf customization)
    const handleLocalExtraChange = () => {
      if (!hasCompletedInitialSyncRef.current || isApplyingExternalSyncRef.current) return;
      triggerLocalPush();
    };
    window.addEventListener('shelfmedia:local-extra-change', handleLocalExtraChange);

    // 5. Real-time Server-Sent Events (SSE) stream only on dev server (port 3000)
    let eventSource: EventSource | null = null;
    try {
      const isPortableServer = typeof window !== 'undefined' && window.location.port === '8765';
      if (!isPortableServer && typeof EventSource !== 'undefined') {
        eventSource = new EventSource('/api/sync/stream');
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data) as SyncSnapshot;
            if (parsed && typeof parsed.updatedAt === 'number' && parsed.updatedAt > 0) {
              applyIncomingSnapshot(parsed);
            }
          } catch {
            // Ignore malformed SSE message
          }
        };
      }
    } catch {
      eventSource = null;
    }

    // 6. Periodic cross-origin / localhost poll (every 2.5s) + on window focus
    const pollInterval = setInterval(async () => {
      if (!hasCompletedInitialSyncRef.current || isApplyingExternalSyncRef.current) return;
      const remote = await fetchLatestRemoteSnapshot();
      const localTs = lastAppliedTimestampRef.current;
      if (remote && remote.updatedAt > localTs) {
        applyIncomingSnapshot(remote);
      } else if (localTs > 0 && (!remote || localTs > remote.updatedAt)) {
        // Ensure newly started localhost server or cloud server receives our latest state
        const snapshot = readFullSnapshotFromStorage(localTs);
        void pushSnapshotToEndpoints(snapshot);
      }
    }, 2500);

    const handleWindowFocus = () => {
      if (hasCompletedInitialSyncRef.current) {
        void handleManualSync(false);
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      bc?.close();
      eventSource?.close();
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('shelfmedia:local-extra-change', handleLocalExtraChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [applyIncomingSnapshot, handleManualSync, triggerLocalPush]);

  // Distinct available years - appears ONLY when there is a row with a completion date of a completed medium
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    items.forEach((item) => {
      const isCompleted = item.status === 'Ukończone';
      if (isCompleted && item.date_logged && item.date_logged.length >= 4) {
        const y = item.date_logged.substring(0, 4);
        if (/^\d{4}$/.test(y)) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const availableCreators = useMemo(
    () => Array.from(new Set(items.map((i) => i.creator).filter(Boolean))),
    [items]
  );

  // Helper: Ensure any new item_type, platform, or genre has a list entry and a random color assigned
  const registerCategoriesWithRandomColors = useCallback(
    (entries: Array<{ item_type?: string; platform?: string; genre?: string }>) => {
      const addedTypes: string[] = [];
      const addedPlatforms: string[] = [];
      const addedGenres: string[] = [];

      entries.forEach((entry) => {
        const tp = entry.item_type?.trim();
        if (tp && !types.includes(tp) && !addedTypes.includes(tp)) {
          addedTypes.push(tp);
        }
        const pl = entry.platform?.trim();
        if (pl && !platforms.includes(pl) && !addedPlatforms.includes(pl)) {
          addedPlatforms.push(pl);
        }
        const gn = entry.genre?.trim();
        if (gn && !genres.includes(gn) && !addedGenres.includes(gn)) {
          addedGenres.push(gn);
        }
      });

      if (addedTypes.length > 0) {
        setTypes((prev) => Array.from(new Set([...prev, ...addedTypes])));
      }

      setTypeConfigs((prev) => {
        let changed = false;
        const next = { ...prev };
        const usedColors = Object.values(next).map((c) => c.color);
        entries.forEach((entry) => {
          const tp = entry.item_type?.trim();
          if (tp && !next[tp]) {
            const cfg = createRandomMediaTypeConfig(tp, usedColors);
            next[tp] = cfg;
            usedColors.push(cfg.color);
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      if (addedPlatforms.length > 0) {
        setPlatforms((prev) => Array.from(new Set([...prev, ...addedPlatforms])));
      }

      setPlatformColors((prev) => {
        let changed = false;
        const next = { ...prev };
        const usedColors = Object.values(next);
        entries.forEach((entry) => {
          const pl = entry.platform?.trim();
          if (pl && !next[pl]) {
            const randColor = getRandomPresetColor(usedColors);
            next[pl] = randColor;
            usedColors.push(randColor);
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      if (addedGenres.length > 0) {
        setGenres((prev) => Array.from(new Set([...prev, ...addedGenres])));
      }
    },
    [types, platforms, genres]
  );

  // Type handlers
  const handleAddType = (name: string, customConfig?: { color: string; icon: string; iconColor?: string; bgColor?: string }) => {
    setTypes((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setTypeConfigs((prev) => {
      const usedColors = Object.values(prev).map((c) => c.color);
      const randCfg = createRandomMediaTypeConfig(name, usedColors);
      const color = customConfig?.color || randCfg.color;
      const icon = customConfig?.icon || randCfg.icon;
      const iconColor = customConfig?.iconColor || color;
      const bgColor = customConfig?.bgColor || hexToRgba(color, 0.2);
      return {
        ...prev,
        [name]: { name, color, icon, iconColor, bgColor },
      };
    });
    showToast(
      t(
        `Dodano nowy typ medium: "${name}" ze swoją ikoną i kolorem`,
        `Added new media type: "${name}" with custom icon and color`
      )
    );
  };

  const handleUpdateTypeConfig = (typeName: string, updatedConfig: MediaTypeConfig, oldName?: string) => {
    if (oldName && oldName !== typeName) {
      setTypes((prev) => prev.map((tItem) => (tItem === oldName ? typeName : tItem)));
      setItems((prev) =>
        prev.map((item) => (item.item_type === oldName ? { ...item, item_type: typeName } : item))
      );
      setTypeConfigs((prev) => {
        const next = { ...prev };
        delete next[oldName];
        next[typeName] = updatedConfig;
        return next;
      });
      showToast(
        t(
          `Zaktualizowano typ "${oldName}" na "${typeName}" oraz jego styl!`,
          `Updated type "${oldName}" to "${typeName}" and its style!`
        )
      );
    } else {
      setTypeConfigs((prev) => ({
        ...prev,
        [typeName]: updatedConfig
      }));
      showToast(
        t(
          `Zaktualizowano kolor i ikonę dla typu "${typeName}"!`,
          `Updated color and icon for type "${typeName}"!`
        )
      );
    }
  };

  const handleDeleteType = (name: string) => {
    setTypes((prev) => prev.filter((tItem) => tItem !== name));
    setTypeConfigs((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    showToast(
      t(
        `Usunięto typ medium z listy wyboru: "${name}"`,
        `Removed media type from options: "${name}"`
      )
    );
  };

  const handleResetTypes = () => {
    setTypes(DEFAULT_ITEM_TYPES);
    setTypeConfigs(DEFAULT_TYPE_CONFIGS);
    showToast(
      t(
        'Wyczyszczono listę typów mediów, kolory i ikony.',
        'Cleared media types, colors, and icons.'
      )
    );
  };

  // Platform handlers
  const handleAddPlatform = (name: string, color?: string) => {
    setPlatforms((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setPlatformColors((prev) => {
      const assignedColor = color || getRandomPresetColor(Object.values(prev));
      return { ...prev, [name]: assignedColor };
    });
    showToast(
      t(
        `Dodano nowy format do listy: "${name}"`,
        `Added new platform/format to options: "${name}"`
      )
    );
  };

  const handleUpdatePlatformColor = (name: string, color: string) => {
    setPlatformColors((prev) => ({
      ...prev,
      [name]: color,
    }));
    showToast(
      t(
        `Zaktualizowano kolor dla formatu "${name}"!`,
        `Updated color for platform/format "${name}"!`
      )
    );
  };

  const handleDeletePlatform = (name: string) => {
    setPlatforms((prev) => prev.filter((p) => p !== name));
    showToast(
      t(
        `Usunięto format z listy wyboru: "${name}"`,
        `Removed platform/format from options: "${name}"`
      )
    );
  };

  const handleResetPlatforms = () => {
    setPlatforms(DEFAULT_PLATFORMS);
    setPlatformColors(DEFAULT_PLATFORM_COLORS);
    showToast(
      t(
        'Przywrócono domyślną listę platform i formatów oraz ich kolory.',
        'Restored default platforms, formats, and their colors.'
      )
    );
  };

  // Genre handlers
  const handleAddGenre = (name: string) => {
    setGenres((prev) => [...prev, name]);
    showToast(
      t(
        `Dodano nowy gatunek do listy: "${name}"`,
        `Added new genre to options: "${name}"`
      )
    );
  };

  const handleDeleteGenre = (name: string) => {
    setGenres((prev) => prev.filter((g) => g !== name));
    showToast(
      t(
        `Usunięto gatunek z listy wyboru: "${name}"`,
        `Removed genre from options: "${name}"`
      )
    );
  };

  const handleResetGenres = () => {
    setGenres(DEFAULT_GENRES);
    showToast(
      t(
        'Przywrócono domyślną listę gatunków.',
        'Restored default genres list.'
      )
    );
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MediaItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Rating Scale Automatic Database Conversion Handler
  const handleChangeRatingScale = (nextScale: RatingScale) => {
    if (nextScale === ratingScale) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (nextScale === 5) {
          const base10 = item._rawRating10 !== undefined ? item._rawRating10 : item.rating;
          const converted5 = Math.max(0.5, Math.min(5.0, Math.round((base10 / 2) * 2) / 2));
          return {
            ...item,
            rating: converted5,
            _rawRating10: base10,
          };
        } else {
          const restored10 =
            item._rawRating10 !== undefined
              ? Math.max(0.5, Math.min(10.0, Math.round(item._rawRating10 * 2) / 2))
              : Math.max(0.5, Math.min(10.0, Math.round((item.rating * 2) * 2) / 2));
          return {
            ...item,
            rating: restored10,
            _rawRating10: restored10,
          };
        }
      })
    );

    setRatingScale(nextScale);
    showToast(
      t(
        `Zmieniono skalę ocen na 0.5 – ${nextScale}. Przeliczono automatycznie ${items.length} pozycji w bazie!`,
        `Changed rating scale to 0.5 – ${nextScale}. Automatically converted ${items.length} items in database!`
      )
    );
  };

  const handleSaveItem = (itemData: Omit<MediaItem, 'id'>, existingId?: number) => {
    const normalizedRating = Math.max(0.5, Math.min(ratingScale, Math.round(itemData.rating * 2) / 2));
    const rawRating10 = ratingScale === 5 ? normalizedRating * 2 : normalizedRating;

    registerCategoriesWithRandomColors([
      {
        item_type: itemData.item_type,
        platform: itemData.platform,
        genre: itemData.genre,
      },
    ]);

    if (existingId !== undefined) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === existingId
            ? { ...itemData, creator: itemData.creator || '', rating: normalizedRating, _rawRating10: rawRating10, id: existingId }
            : i
        )
      );
      showToast(t(`Zaktualizowano: "${itemData.title}"`, `Updated: "${itemData.title}"`));
    } else {
      const maxExistingId = items.reduce((max, i) => (i.id > max ? i.id : max), 0);
      const newId = maxExistingId + 1;
      const newItem: MediaItem = {
        ...itemData,
        creator: itemData.creator || '',
        rating: normalizedRating,
        _rawRating10: rawRating10,
        id: newId,
      };
      setItems((prev) => [newItem, ...prev]);
      showToast(
        t(
          `Dodano do biblioteki: "${itemData.title}" (${itemData.item_type})`,
          `Added to library: "${itemData.title}" (${trType(itemData.item_type)})`
        )
      );
    }
  };

  const handleDeleteItem = (id: number) => {
    const itemToDelete = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setCollections((prev) =>
      prev.map((c) =>
        c.itemIds.includes(id)
          ? { ...c, itemIds: c.itemIds.filter((itemId) => itemId !== id), updatedAt: new Date().toISOString() }
          : c
      )
    );
    showToast(
      t(
        `Usunięto z bazy danych: "${itemToDelete?.title || id}"`,
        `Deleted from database: "${itemToDelete?.title || id}"`
      )
    );
  };

  const handleDeleteMultiple = (ids: number[]) => {
    const confirmed = window.confirm(
      t(
        `Czy na pewno chcesz bezpowrotnie usunąć ${ids.length} zaznaczonych pozycji z bazy danych?`,
        `Are you sure you want to permanently delete ${ids.length} selected items from the database?`
      )
    );
    if (confirmed) {
      const idSet = new Set(ids);
      setItems((prev) => prev.filter((i) => !idSet.has(i.id)));
      setCollections((prev) =>
        prev.map((c) =>
          c.itemIds.some((itemId) => idSet.has(itemId))
            ? { ...c, itemIds: c.itemIds.filter((itemId) => !idSet.has(itemId)), updatedAt: new Date().toISOString() }
            : c
        )
      );
      showToast(
        t(
          `Pomyślnie usunięto ${ids.length} pozycji z bazy danych.`,
          `Successfully deleted ${ids.length} items from the database.`
        )
      );
    }
  };

  // Mass / Bulk Edit Handler for Selected Items (e.g. change 2 games to type film)
  const handleBulkEdit = (ids: number[], updates: Partial<MediaItem>) => {
    if (ids.length === 0 || Object.keys(updates).length === 0) return;

    registerCategoriesWithRandomColors([
      {
        item_type: updates.item_type,
        platform: updates.platform,
        genre: updates.genre,
      },
    ]);

    setItems((prev) =>
      prev.map((item) => {
        if (ids.includes(item.id)) {
          return {
            ...item,
            ...updates,
          };
        }
        return item;
      })
    );

    showToast(
      t(
        `Pomyślnie zaktualizowano ${ids.length} pozycji w bazie!`,
        `Successfully updated ${ids.length} items in database!`
      )
    );
  };

  // Collections Management Handlers
  const handleCreateCollection = (
    title: string,
    description: string,
    accentColor: string,
    bannerEmoji: string,
    initialItemIds: number[] = [],
    styleConfig?: { icon: string; iconColor: string; bgColor: string }
  ) => {
    const newCol: Collection = {
      id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      description,
      accentColor,
      bannerEmoji,
      icon: styleConfig?.icon || 'Layers',
      iconColor: styleConfig?.iconColor || accentColor,
      bgColor: styleConfig?.bgColor || hexToRgba(accentColor, 0.22),
      itemIds: initialItemIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollections((prev) => [newCol, ...prev]);
    showToast(t(`Utworzono nową kolekcję: "${title}"!`, `Created new collection: "${title}"!`));
  };

  const handleUpdateCollection = (updated: Collection) => {
    setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(t(`Zaktualizowano kolekcję "${updated.title}"!`, `Updated collection "${updated.title}"!`));
  };

  const handleDeleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    showToast(t('Usunięto kolekcję.', 'Collection deleted.'));
  };

  const handleAddItemToCollection = (collectionId: string, itemId: number) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId && !c.itemIds.includes(itemId)) {
          return { ...c, itemIds: [...c.itemIds, itemId], updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const handleAddMultipleToCollection = (collectionId: string, itemIds: number[]) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          const newSet = new Set([...c.itemIds, ...itemIds]);
          return { ...c, itemIds: Array.from(newSet), updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
    showToast(
      t(
        `Dodano ${itemIds.length} pozycji do kolekcji!`,
        `Added ${itemIds.length} items to collection!`
      )
    );
  };

  const handleRemoveItemFromCollection = (collectionId: string, itemId: number) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          return { ...c, itemIds: c.itemIds.filter((id) => id !== itemId), updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const handleReorderCollectionItems = (collectionId: string, newItemIds: number[]) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === collectionId) {
          return { ...c, itemIds: newItemIds, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  const escapeCsvCell = (val: unknown): string => {
    const raw = String(val ?? '');
    // Neutralize CSV Formula Injection (DDE / macro execution in Excel / LibreOffice Calc, including leading whitespace or pipe)
    const safeFormula = /^[\s]*[=+\-@\t\r|]/.test(raw) ? `'${raw}` : raw;
    return `"${safeFormula.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    if (items.length === 0) {
      showToast(t('Biblioteka jest pusta, brak danych do eksportu!', 'The library is empty, no data to export!'));
      return;
    }

    const headers = ['id', 'title', 'year', 'item_type', 'platform', 'genre', 'creator', 'rating', 'status', 'hours_spent', 'pages', 'date_logged', 'comment'];
    const csvRows = [headers.join(',')];

    for (const item of items) {
      const cleanYear = parsePositiveIntValue(item.year);
      const cleanPages = parsePositiveIntValue(item.pages);
      const cleanHours =
        item.hours_spent !== undefined && item.hours_spent !== null && Number(item.hours_spent) > 0
          ? Number(Number(item.hours_spent).toFixed(1))
          : '';
      const row = [
        Number(item.id) || 0,
        escapeCsvCell(item.title),
        cleanYear ?? '',
        escapeCsvCell(item.item_type),
        escapeCsvCell(item.platform),
        escapeCsvCell(item.genre),
        escapeCsvCell(item.creator || ''),
        Number(item.rating) || 8.0,
        escapeCsvCell(item.status),
        cleanHours,
        cleanPages ?? '',
        escapeCsvCell(item.date_logged),
        escapeCsvCell(item.comment),
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shelfmedia_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      t(
        `Wyeksportowano ${items.length} pozycji do pliku CSV!`,
        `Exported ${items.length} items to CSV file!`
      )
    );
  };

  // Full System & Database Backup (JSON) - Everything: Items, Types, Colors, Platforms, Genres, Gradients
  const handleExportFullBackup = () => {
    let savedGradients: any[] = [];
    try {
      const rawGrad = localStorage.getItem('shelfmedia_saved_gradients_v1');
      if (rawGrad) savedGradients = JSON.parse(rawGrad);
    } catch (e) {
      console.error('Błąd odczytu gradientów do kopii zapasowej:', e);
    }

    const backupData: ShelfMediaBackup = {
      format: 'shelfmedia_backup',
      version: '2.7',
      exportedAt: new Date().toISOString(),
      itemsCount: items.length,
      data: {
        items,
        types,
        typeConfigs,
        platforms,
        platformColors,
        genres,
        savedGradients,
        uiTheme,
        ratingScale,
        collections,
        userName,
        appLogo,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shelfmedia_pelna_kopia_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      t(
        `Pobrano pełną kopię zapasową (${items.length} dzieł, ${types.length} typów, ${savedGradients.length} własnych gradientów)!`,
        `Downloaded full backup (${items.length} items, ${types.length} types, ${savedGradients.length} custom gradients)!`
      )
    );
  };

  // Full Backup Import & Restore (JSON)
  const MAX_IMPORT_FILE_SIZE = 15 * 1024 * 1024; // 15 MB DoS protection

  const handleImportFullBackup = (file: File) => {
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast(
        t(
          'Plik jest zbyt duży (maksymalny dozwolony rozmiar to 15 MB).',
          'File is too large (maximum allowed size is 15 MB).'
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          showToast(t('Wybrany plik nie jest poprawnym plikiem JSON.', 'The selected file is not a valid JSON file.'));
          return;
        }

        // Support both structured backup format { format: 'shelfmedia_backup', data: { items, ... } } and direct format
        const rawItemsList = parsed?.data?.items || parsed?.items;
        if (!Array.isArray(rawItemsList)) {
          showToast(
            t(
              'Nieprawidłowy plik kopii zapasowej ShelfMedia (brak listy pozycji "items").',
              'Invalid ShelfMedia backup file (missing "items" list).'
            )
          );
          return;
        }

        const sanitizeStr = (v: unknown, maxLen = 500, fallback = ''): string =>
          typeof v === 'string' ? v.trim().slice(0, maxLen) : fallback;

        const backupScale: RatingScale =
          parsed?.data?.ratingScale === 5 || parsed?.ratingScale === 5
            ? 5
            : parsed?.data?.ratingScale === 10 || parsed?.ratingScale === 10
            ? 10
            : ratingScale;

        const itemsToRestore: MediaItem[] = rawItemsList
          .filter((it: any) => it && typeof it === 'object' && sanitizeStr(it.title, 300))
          .slice(0, 25000)
          .map((it: any, idx: number) => {
            const rawRating = Number(it.rating);
            const fallbackDefault = backupScale === 5 ? 4.0 : 8.0;
            let rating = !isNaN(rawRating)
              ? Math.max(0.5, Math.min(10.0, Math.round(rawRating * 2) / 2))
              : fallbackDefault;

            // Adapt rating if backup scale differs from active scale, or adopt backup's ratingScale
            const rawRating10 =
              typeof it._rawRating10 === 'number' && !isNaN(it._rawRating10)
                ? Math.max(0.5, Math.min(10.0, it._rawRating10))
                : backupScale === 5
                ? Math.min(10.0, rating * 2)
                : rating;

            if (backupScale === 5 && rating > 5.0) {
              rating = Math.max(0.5, Math.min(5.0, Math.round((rating / 2) * 2) / 2));
            }

            const rawYear = parsePositiveIntValue(it.year);
            const year = rawYear !== null && rawYear >= 1800 && rawYear <= 2100 ? rawYear : null;
            const rawHours = it.hours_spent !== null && it.hours_spent !== undefined && it.hours_spent !== '' ? Number(it.hours_spent) : null;
            const hours_spent = rawHours !== null && !isNaN(rawHours) && rawHours >= 0 ? Number(rawHours.toFixed(1)) : null;
            const pages = parsePositiveIntValue(it.pages);
            const validStatuses: ItemStatus[] = ['Ukończone', 'W trakcie', 'Planowane', 'Porzucone'];
            const status: ItemStatus = validStatuses.includes(it.status) ? it.status : 'Ukończone';

            return {
              id: typeof it.id === 'number' && !isNaN(it.id) ? it.id : idx + 1,
              title: sanitizeStr(it.title, 300),
              year,
              item_type: sanitizeStr(it.item_type, 80, 'Gra'),
              platform: sanitizeStr(it.platform, 120, 'Inna'),
              genre: sanitizeStr(it.genre, 120, 'Inny'),
              creator: sanitizeStr(it.creator, 200, ''),
              rating,
              _rawRating10: rawRating10,
              status,
              hours_spent,
              pages,
              date_logged: sanitizeStr(it.date_logged, 30),
              comment: sanitizeStr(it.comment, 5000),
            };
          });

        const rawTypes = parsed?.data?.types || parsed?.types;
        const typesToRestore: string[] = Array.isArray(rawTypes)
          ? rawTypes.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim().slice(0, 80))
          : DEFAULT_ITEM_TYPES;

        const rawTypeConfigs = parsed?.data?.typeConfigs || parsed?.typeConfigs;
        const typeConfigsToRestore: Record<string, MediaTypeConfig> = { ...DEFAULT_TYPE_CONFIGS };
        if (rawTypeConfigs && typeof rawTypeConfigs === 'object' && !Array.isArray(rawTypeConfigs)) {
          for (const [key, cfg] of Object.entries(rawTypeConfigs)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            if (cfg && typeof cfg === 'object') {
              const c = cfg as any;
              const safeColor = typeof c.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c.color.trim()) ? c.color.trim() : '#3b82f6';
              typeConfigsToRestore[key.slice(0, 80)] = {
                name: sanitizeStr(c.name, 80, key.slice(0, 80)),
                color: safeColor,
                icon: sanitizeStr(c.icon, 60, 'Sparkles'),
                iconColor: typeof c.iconColor === 'string' ? c.iconColor.trim().slice(0, 40) : safeColor,
                bgColor: typeof c.bgColor === 'string' ? c.bgColor.trim().slice(0, 60) : undefined,
              };
            }
          }
        }

        const rawPlatforms = parsed?.data?.platforms || parsed?.platforms;
        const platformsToRestore: string[] = Array.isArray(rawPlatforms)
          ? rawPlatforms.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim().slice(0, 120))
          : DEFAULT_PLATFORMS;

        const rawGenres = parsed?.data?.genres || parsed?.genres;
        const genresToRestore: string[] = Array.isArray(rawGenres)
          ? rawGenres.filter((x: unknown) => typeof x === 'string' && x.trim().length > 0).map((x: string) => x.trim().slice(0, 120))
          : DEFAULT_GENRES;

        const rawCollections = parsed?.data?.collections || parsed?.collections;
        const collectionsToRestore: Collection[] = Array.isArray(rawCollections)
          ? rawCollections.filter((c: any) => c && typeof c === 'object' && sanitizeStr(c.title, 200)).map((c: any) => {
              const safeAccent = typeof c.accentColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c.accentColor.trim()) ? c.accentColor.trim() : '#66c0f4';
              return {
                id: sanitizeStr(c.id, 80, `col_${Date.now()}`),
                title: sanitizeStr(c.title, 200, 'Kolekcja'),
                description: sanitizeStr(c.description, 1000, ''),
                accentColor: safeAccent,
                bannerEmoji: sanitizeStr(c.bannerEmoji, 20, '⭐'),
                icon: sanitizeStr(c.icon, 60, 'Layers'),
                iconColor: typeof c.iconColor === 'string' ? c.iconColor.trim().slice(0, 40) : safeAccent,
                bgColor: typeof c.bgColor === 'string' ? c.bgColor.trim().slice(0, 60) : undefined,
                itemIds: Array.isArray(c.itemIds) ? c.itemIds.filter((id: any) => typeof id === 'number') : [],
                createdAt: sanitizeStr(c.createdAt, 40, new Date().toISOString()),
                updatedAt: sanitizeStr(c.updatedAt, 40, new Date().toISOString()),
              };
            })
          : [];

        const rawUserName = parsed?.data?.userName ?? parsed?.userName;
        const userNameToRestore = sanitizeStr(rawUserName, 80, '');

        const rawAppLogo = parsed?.data?.appLogo || parsed?.appLogo;
        const appLogoToRestore: AppLogoConfig = rawAppLogo && typeof rawAppLogo === 'object'
          ? {
              icon: sanitizeStr(rawAppLogo.icon, 60, DEFAULT_APP_LOGO.icon),
              iconColor: typeof rawAppLogo.iconColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(rawAppLogo.iconColor.trim()) ? rawAppLogo.iconColor.trim() : DEFAULT_APP_LOGO.iconColor,
              bgColor: typeof rawAppLogo.bgColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(rawAppLogo.bgColor.trim()) ? rawAppLogo.bgColor.trim() : DEFAULT_APP_LOGO.bgColor,
            }
          : appLogo;

        const gradientsToRestore = Array.isArray(parsed?.data?.savedGradients || parsed?.savedGradients)
          ? (parsed?.data?.savedGradients || parsed?.savedGradients).slice(0, 100)
          : [];
        const uiThemeToRestore = parsed?.data?.uiTheme || parsed?.uiTheme;

        const rawPlatformColors = parsed?.data?.platformColors || parsed?.platformColors;
        const platformColorsToRestore: Record<string, string> = { ...DEFAULT_PLATFORM_COLORS };
        if (rawPlatformColors && typeof rawPlatformColors === 'object' && !Array.isArray(rawPlatformColors)) {
          for (const [key, val] of Object.entries(rawPlatformColors)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            if (typeof val === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(val.trim())) {
              platformColorsToRestore[key.slice(0, 120)] = val.trim();
            }
          }
        }

        // Save directly to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToRestore));
        localStorage.setItem(TYPES_STORAGE_KEY, JSON.stringify(typesToRestore));
        localStorage.setItem(TYPE_CONFIGS_STORAGE_KEY, JSON.stringify(typeConfigsToRestore));
        localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(platformsToRestore));
        localStorage.setItem(PLATFORM_COLORS_STORAGE_KEY, JSON.stringify(platformColorsToRestore));
        localStorage.setItem(GENRES_STORAGE_KEY, JSON.stringify(genresToRestore));
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collectionsToRestore));
        localStorage.setItem(USER_NAME_STORAGE_KEY, userNameToRestore);
        localStorage.setItem(APP_LOGO_STORAGE_KEY, JSON.stringify(appLogoToRestore));

        if (Array.isArray(gradientsToRestore)) {
          localStorage.setItem('shelfmedia_saved_gradients_v1', JSON.stringify(gradientsToRestore));
        }
        if (uiThemeToRestore && typeof uiThemeToRestore === 'object') {
          const safeTheme: UIThemeConfig = {
            presetId: sanitizeStr(uiThemeToRestore.presetId, 40, DEFAULT_UI_THEME.presetId),
            bgPrimary: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.bgPrimary || '').trim()) ? String(uiThemeToRestore.bgPrimary).trim() : DEFAULT_UI_THEME.bgPrimary,
            bgSecondary: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.bgSecondary || '').trim()) ? String(uiThemeToRestore.bgSecondary).trim() : DEFAULT_UI_THEME.bgSecondary,
            bgSurface: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.bgSurface || '').trim()) ? String(uiThemeToRestore.bgSurface).trim() : DEFAULT_UI_THEME.bgSurface,
            border: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.border || '').trim()) ? String(uiThemeToRestore.border).trim() : DEFAULT_UI_THEME.border,
            accent: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.accent || '').trim()) ? String(uiThemeToRestore.accent).trim() : DEFAULT_UI_THEME.accent,
            accentSecondary: /^#[0-9a-fA-F]{3,8}$/.test(String(uiThemeToRestore.accentSecondary || '').trim()) ? String(uiThemeToRestore.accentSecondary).trim() : DEFAULT_UI_THEME.accentSecondary,
          };
          localStorage.setItem(UI_THEME_STORAGE_KEY, JSON.stringify(safeTheme));
          setUiTheme(safeTheme);
        }

        // Update React state
        setRatingScale(backupScale);
        localStorage.setItem(RATING_SCALE_STORAGE_KEY, String(backupScale));
        setItems(itemsToRestore);
        setTypes(typesToRestore);
        setTypeConfigs(typeConfigsToRestore);
        setPlatforms(platformsToRestore);
        setPlatformColors(platformColorsToRestore);
        setGenres(genresToRestore);
        setCollections(collectionsToRestore);
        setUserName(userNameToRestore);
        setAppLogo(appLogoToRestore);

        setIsBackupModalOpen(false);
        showToast(
          t(
            `Przywrócono pełną kopię zapasową! (${itemsToRestore.length} pozycji, ${typesToRestore.length} typów mediów, ${platformsToRestore.length} formatów, ${gradientsToRestore.length} własnych gradientów)`,
            `Restored full backup! (${itemsToRestore.length} items, ${typesToRestore.length} media types, ${platformsToRestore.length} platforms, ${gradientsToRestore.length} custom gradients)`
          )
        );
      } catch (err) {
        console.error('Błąd importu pełnej kopii:', err);
        showToast(t(`Błąd podczas przywracania kopii zapasowej: ${err}`, `Error restoring backup: ${err}`));
      }
    };
    reader.readAsText(file);
  };

  // Robust CSV Import Parser
  const handleImportCsv = (file: File) => {
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast(
        t(
          'Plik CSV jest zbyt duży (maksymalny dozwolony rozmiar to 15 MB).',
          'CSV file is too large (maximum allowed size is 15 MB).'
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target?.result as string;
        if (!text) return;

        // Strip UTF-8 BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        // Auto-detect delimiter: comma vs semicolon vs tab
        const firstLine = text.split(/\r?\n/)[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const delimiter = (semiCount > commaCount && semiCount > tabCount) ? ';' : (tabCount > commaCount ? '\t' : ',');

        // Parse CSV lines taking into account quotes and detected delimiter
        const parseCsvLines = (csvText: string, delim: string): string[][] => {
          const rows: string[][] = [];
          let currentRow: string[] = [];
          let currentField = '';
          let inQuotes = false;

          for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++; // Skip escaped quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === delim && !inQuotes) {
              currentRow.push(currentField.trim());
              currentField = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
              if (char === '\r' && nextChar === '\n') {
                i++;
              }
              currentRow.push(currentField.trim());
              currentField = '';
              if (currentRow.some((f) => f.length > 0)) {
                rows.push(currentRow);
              }
              currentRow = [];
            } else {
              currentField += char;
            }
          }

          if (currentField.length > 0 || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some((f) => f.length > 0)) {
              rows.push(currentRow);
            }
          }

          return rows;
        };

        const rows = parseCsvLines(text, delimiter);
        if (rows.length < 2) {
          showToast(t('Plik CSV jest pusty lub nie zawiera wierszy z danymi!', 'The CSV file is empty or contains no data rows!'));
          return;
        }

        const rawHeaders = rows[0].map((h) => h.toLowerCase().replace(/["']/g, '').trim());
        const normHeaders = rawHeaders.map((h) => h.replace(/[^a-z0-9ąćęłńóśźż]/gi, '').toLowerCase());

        // Flexible column finder matching aliases and substrings
        const findColIndex = (aliases: string[], fallbackSubstrings?: string[]): number => {
          for (const alias of aliases) {
            const idx = rawHeaders.indexOf(alias.toLowerCase());
            if (idx !== -1) return idx;
          }
          for (const alias of aliases) {
            const norm = alias.replace(/[^a-z0-9ąćęłńóśźż]/gi, '').toLowerCase();
            const idx = normHeaders.indexOf(norm);
            if (idx !== -1) return idx;
          }
          if (fallbackSubstrings) {
            for (const sub of fallbackSubstrings) {
              const idx = rawHeaders.findIndex((h) => h.includes(sub.toLowerCase()));
              if (idx !== -1) return idx;
            }
          }
          return -1;
        };

        const titleIdx = findColIndex(['title', 'tytuł', 'tytul', 'name', 'nazwa', 'dzieło', 'dzielo'], ['tytu', 'title']);
        const yearIdx = findColIndex(['year', 'rok', 'premiera', 'wydanie', 'rocznik'], ['rok', 'year']);
        const typeIdx = findColIndex(['item_type', 'typ', 'rodzaj', 'type', 'kategoria', 'medium'], ['typ', 'type']);
        const platformIdx = findColIndex(['platform', 'platforma', 'format', 'czytnik', 'konsola', 'urządzenie', 'urzadzenie'], ['platf', 'format']);
        const genreIdx = findColIndex(['genre', 'gatunek', 'kategoria_gatunku'], ['gatun', 'genre']);
        const creatorIdx = findColIndex(
          ['creator', 'twórca', 'tworca', 'twórcy', 'tworcy', 'autor', 'author', 'reżyser', 'rezyser', 'director', 'studio', 'developer', 'deweloper', 'wykonawca'],
          ['twór', 'twor', 'autor', 'reżys', 'rezys', 'creat', 'direct', 'studi']
        );
        const ratingIdx = findColIndex(['rating', 'ocena', 'score', 'punkty', 'gwiazdki', 'rate'], ['ocen', 'rat']);
        const statusIdx = findColIndex(['status', 'stan', 'postęp', 'postep'], ['stat']);
        const hoursIdx = findColIndex(
          [
            'hours_spent', 'hours', 'godziny', 'godzin', 'godz', 'czas',
            'czas (h)', 'czas [h]', 'czash', 'czas_h', 'time', 'timespent',
            'time_spent', 'hoursspent', 'czas spędzony', 'spędzony czas',
            'czasspedzony', 'czas trwania', 'duration', 'h'
          ],
          ['godz', 'hour', 'czash', 'czas', 'time']
        );
        const pagesIdx = findColIndex(
          [
            'pages', 'strony', 'stron', 'liczba_stron', 'liczba stron',
            'liczba_str', 'page_count', 'pagecount', 'pages_count', 'str'
          ],
          ['stron', 'page', 'str']
        );
        const dateIdx = findColIndex(['date_logged', 'data', 'date', 'ukonczono', 'data_oceny', 'data_wpisu'], ['dat']);
        const commentIdx = findColIndex(['comment', 'komentarz', 'opinia', 'recenzja', 'notatka', 'notes', 'opis'], ['koment', 'recenz', 'notat']);

        if (titleIdx === -1) {
          showToast(
            t(
              'Nie znaleziono kolumny z tytułem (wymagany nagłówek "title" lub "tytuł") w pliku CSV!',
              'Could not find title column (required header "title" or "tytuł") in the CSV file!'
            )
          );
          return;
        }

        let maxId = items.reduce((max, i) => (i.id > max ? i.id : max), 0);
        const newItems: MediaItem[] = [];
        const detectedNewPlatforms = new Set<string>();
        const detectedNewGenres = new Set<string>();
        const detectedNewTypes = new Set<string>();
        const maxRowsToImport = Math.min(rows.length, 25001);

        for (let r = 1; r < maxRowsToImport; r++) {
          const row = rows[r];
          const rawTitle = row[titleIdx];
          if (!rawTitle || rawTitle.trim() === '') continue;

          let year: number | null = null;
          if (yearIdx !== -1 && row[yearIdx]) {
            const parsedY = parsePositiveIntValue(row[yearIdx]);
            if (parsedY !== null && parsedY >= 1000 && parsedY <= 2100) year = parsedY;
          }

          let itemType: ItemType = 'Gra';
          if (typeIdx !== -1 && row[typeIdx]) {
            const rawType = row[typeIdx].trim();
            const lower = rawType.toLowerCase();
            if (lower.includes('książk') || lower.includes('ksiazk') || lower.includes('book')) {
              itemType = 'Książka';
            } else if (lower.includes('film') || lower.includes('movie')) {
              itemType = 'Film';
            } else if (lower.includes('serial') || lower.includes('series')) {
              itemType = 'Serial';
            } else if (lower.includes('gra') || lower.includes('game')) {
              itemType = 'Gra';
            } else if (rawType) {
              itemType = rawType;
            }
          }
          if (itemType && !types.includes(itemType)) {
            detectedNewTypes.add(itemType);
          }

          let rating = ratingScale === 5 ? 4.0 : 8.0;
          let rawRating10 = 8.0;
          if (ratingIdx !== -1 && row[ratingIdx]) {
            const numMatch = row[ratingIdx].replace(',', '.').match(/-?\d+(\.\d+)?/);
            if (numMatch) {
              const parsedR = parseFloat(numMatch[0]);
              if (!isNaN(parsedR)) {
                const clamped10 = Math.max(0.5, Math.min(10.0, Math.round(parsedR * 2) / 2));
                if (ratingScale === 5) {
                  if (clamped10 > 5.0) {
                    rawRating10 = clamped10;
                    rating = Math.max(0.5, Math.min(5.0, Math.round((clamped10 / 2) * 2) / 2));
                  } else {
                    rating = Math.max(0.5, Math.min(5.0, clamped10));
                    rawRating10 = rating * 2;
                  }
                } else {
                  rating = clamped10;
                  rawRating10 = clamped10;
                }
              }
            }
          }

          let status: ItemStatus = 'Ukończone';
          if (statusIdx !== -1 && row[statusIdx]) {
            const rawS = row[statusIdx].toLowerCase();
            if (rawS.includes('w trakcie') || rawS.includes('progress') || rawS.includes('grane') || rawS.includes('czytane')) {
              status = 'W trakcie';
            } else if (rawS.includes('porzuc') || rawS.includes('drop')) {
              status = 'Porzucone';
            } else if (rawS.includes('plan') || rawS.includes('chcę') || rawS.includes('wish')) {
              status = 'Planowane';
            } else {
              status = 'Ukończone';
            }
          }

          let hoursSpent: number | null = null;
          if (hoursIdx !== -1 && row[hoursIdx] !== undefined) {
            const rawH = row[hoursIdx].toString().trim();
            if (rawH) {
              if (/^\d{1,4}:\d{2}(:\d{2})?$/.test(rawH)) {
                const parts = rawH.split(':').map(Number);
                hoursSpent = Number((parts[0] + (parts[1] || 0) / 60).toFixed(1));
              } else {
                const numMatch = rawH.replace(',', '.').match(/-?\d+(\.\d+)?/);
                if (numMatch) {
                  const parsedH = parseFloat(numMatch[0]);
                  if (!isNaN(parsedH)) hoursSpent = Number(Math.max(0, parsedH).toFixed(1));
                }
              }
            }
          }

          let pagesCount: number | null = null;
          if (pagesIdx !== -1 && row[pagesIdx] !== undefined) {
            pagesCount = parsePositiveIntValue(row[pagesIdx]);
          }

          let platform = platformIdx !== -1 && row[platformIdx] ? row[platformIdx].trim() : (itemType === 'Książka' ? 'Książka papierowa' : 'Inna');
          if (platform === 'Steam (PC)') platform = 'PC (Cyfrowa)';
          if (platform && !platforms.includes(platform)) {
            detectedNewPlatforms.add(platform);
          }

          const genre = genreIdx !== -1 && row[genreIdx] ? row[genreIdx].trim() : 'Inny';
          if (genre && !genres.includes(genre)) {
            detectedNewGenres.add(genre);
          }

          const creator = creatorIdx !== -1 && row[creatorIdx] ? row[creatorIdx].trim() : '';

          let dateLogged = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : '';
          if (!dateLogged) {
            dateLogged = year ? `${year}-06-01` : new Date().toISOString().split('T')[0];
          }
          const comment = commentIdx !== -1 && row[commentIdx] ? row[commentIdx].trim() : '';

          maxId++;
          newItems.push({
            id: maxId,
            title: rawTitle,
            year,
            item_type: itemType,
            platform,
            genre,
            creator,
            rating,
            _rawRating10: rawRating10,
            status,
            hours_spent: hoursSpent,
            pages: pagesCount,
            date_logged: dateLogged,
            comment,
          });
        }

        if (newItems.length === 0) {
          showToast(
            t(
              'Nie udało się zaimportować żadnych poprawnych wierszy z pliku CSV.',
              'Could not import any valid rows from the CSV file.'
            )
          );
          return;
        }

        registerCategoriesWithRandomColors(
          newItems.map((it) => ({
            item_type: it.item_type,
            platform: it.platform,
            genre: it.genre,
          }))
        );

        const totalHoursImported = newItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
        const totalPagesImported = newItems.reduce((acc, curr) => acc + (curr.pages || 0), 0);
        setItems((prev) => [...newItems, ...prev]);
        showToast(
          t(
            `Zaimportowano ${newItems.length} pozycji (${totalHoursImported.toFixed(1)} h czasu${totalPagesImported > 0 ? `, ${totalPagesImported} stron` : ''})!`,
            `Imported ${newItems.length} items (${totalHoursImported.toFixed(1)} h time${totalPagesImported > 0 ? `, ${totalPagesImported} pages` : ''})!`
          )
        );
      } catch (err) {
        console.error('Błąd importu CSV:', err);
        showToast(t(`Błąd podczas przetwarzania pliku CSV: ${err}`, `Error processing CSV file: ${err}`));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#171a21] text-[#c7d5e0] flex flex-col font-sans selection:bg-[#2a475e] selection:text-white">
      {/* Dynamic UI Theme Override Styles */}
      <style id="shelfmedia-ui-theme">{generateThemeCss(uiTheme)}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#1b2838] border border-[#a4d007] text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#a4d007]" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenOptionsManager={() => {
          setOptionsModalMode('full');
          setIsOptionsModalOpen(true);
        }}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenCsvImportModal={() => setIsCsvImportModalOpen(true)}
        onExportCsv={handleExportCsv}
        onImportCsv={handleImportCsv}
        itemsCount={items.length}
        collectionsCount={collections.length}
        appLogo={appLogo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {/* Banner Twoja półka na media */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-[#1b2838] to-[#16202d] border border-[#2a475e]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            {(() => {
              const BannerIcon = getMediaTypeIcon(appLogo.icon || 'Library');
              return (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition-colors"
                  style={{
                    backgroundColor: appLogo.bgColor || '#2a475e',
                    color: appLogo.iconColor || '#66c0f4',
                    borderColor: `${appLogo.iconColor || '#66c0f4'}45`,
                  }}
                >
                  <BannerIcon className="w-5 h-5" />
                </div>
              );
            })()}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-bold">
                  {t('Twoja półka na media', 'Your media shelf')}
                </span>
                {userName && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#66c0f4]/20 border border-[#66c0f4]/40 text-[#66c0f4] font-semibold">
                    👤 {userName}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8f98a0] mt-0.5">
                {t(
                  'Twoja osobista kolekcja gier, książek, filmów i seriali. Zapis lokalny, podział rocznikowy i statystyki i generowanie grafik na sociale.',
                  'Your personal collection of games, books, movies, and series. Local storage, yearly breakdown, statistics, and social graphics generation.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tab 1: Library & Year Tabs View */}
        {activeTab === 'library' && (
          <LibraryTab
            items={items}
            availableTypes={types}
            typeConfigs={typeConfigs}
            platforms={platforms}
            platformColors={platformColors}
            genres={genres}
            ratingScale={ratingScale}
            userName={userName}
            collections={collections}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
            onDeleteMultiple={handleDeleteMultiple}
            onBulkEdit={handleBulkEdit}
            onAddToExistingCollection={handleAddMultipleToCollection}
            onCreateCollectionWithItems={handleCreateCollection}
            onViewComment={setViewingReviewItem}
            onAddNew={handleOpenAddModal}
            onOpenOptionsManager={() => {
              setOptionsModalMode('shelf');
              setIsOptionsModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Curated Collections & Series */}
        {activeTab === 'collections' && (
          <CollectionsTab
            collections={collections}
            items={items}
            typeConfigs={typeConfigs}
            platformColors={platformColors}
            ratingScale={ratingScale}
            userName={userName}
            onCreateCollection={handleCreateCollection}
            onUpdateCollection={handleUpdateCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddItemToCollection={handleAddItemToCollection}
            onAddMultipleToCollection={handleAddMultipleToCollection}
            onRemoveItemFromCollection={handleRemoveItemFromCollection}
            onReorderCollectionItems={handleReorderCollectionItems}
            onEditItem={handleOpenEditModal}
            onDeleteItem={handleDeleteItem}
            onOpenOptionsManager={() => {
              setOptionsModalMode('shelf');
              setIsOptionsModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Statistics & Annual / Monthly Replays */}
        {activeTab === 'stats' && (
          <StatsTab
            items={items}
            availableTypes={types}
            typeConfigs={typeConfigs}
            ratingScale={ratingScale}
            userName={userName}
            onOpenSocialModal={() => setIsSocialModalOpen(true)}
          />
        )}

        {/* Tab 4: Settings (Language, Rating Scale, Backup, UI Colors, Profile, App Icon) */}
        {activeTab === 'settings' && (
          <SettingsTab
            ratingScale={ratingScale}
            onChangeRatingScale={handleChangeRatingScale}
            uiTheme={uiTheme}
            onChangeTheme={setUiTheme}
            onResetTheme={() => {
              setUiTheme(DEFAULT_UI_THEME);
              showToast(t('Przywrócono domyślne kolory interfejsu!', 'Restored default interface colors!'));
            }}
            onExportFullBackup={handleExportFullBackup}
            onImportFullBackup={handleImportFullBackup}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
            itemsCount={items.length}
            typesCount={types.length}
            platformsCount={platforms.length}
            genresCount={genres.length}
            userName={userName}
            onChangeUserName={setUserName}
            appLogo={appLogo}
            onChangeAppLogo={setAppLogo}
            gradientsCount={(() => {
              try {
                const raw = localStorage.getItem('shelfmedia_saved_gradients_v1');
                return raw ? JSON.parse(raw).length : 0;
              } catch {
                return 0;
              }
            })()}
          />
        )}
      </main>

      {/* Add / Edit Modal Dialog */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialItem={editingItem}
        onDeleteItem={handleDeleteItem}
        availablePlatforms={platforms}
        availableGenres={genres}
        availableCreators={availableCreators}
        availableTypes={types}
        typeConfigs={typeConfigs}
        ratingScale={ratingScale}
        onOpenOptionsManager={() => {
          setOptionsModalMode('full');
          setIsOptionsModalOpen(true);
        }}
        onQuickAddType={handleAddType}
      />

      {/* Customizable Options Manager Modal (Types, Platforms / Formats & Genres) */}
      <OptionsManagerModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        mode={optionsModalMode}
        platforms={platforms}
        platformColors={platformColors}
        genres={genres}
        types={types}
        typeConfigs={typeConfigs}
        items={items}
        onAddPlatform={handleAddPlatform}
        onUpdatePlatformColor={handleUpdatePlatformColor}
        onDeletePlatform={handleDeletePlatform}
        onResetPlatforms={handleResetPlatforms}
        onAddGenre={handleAddGenre}
        onDeleteGenre={handleDeleteGenre}
        onResetGenres={handleResetGenres}
        onAddType={handleAddType}
        onUpdateTypeConfig={handleUpdateTypeConfig}
        onDeleteType={handleDeleteType}
        onResetTypes={handleResetTypes}
      />

      {/* Social Media Share Graphic Modal (ShelfMedia Podsumowanie) */}
      <SocialCardModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        items={items}
        availableYears={availableYears}
        availableTypes={types}
        typeConfigs={typeConfigs}
        ratingScale={ratingScale}
        userName={userName}
      />

      {/* Review / Comment Details Modal */}
      <ReviewModal
        item={viewingReviewItem}
        onClose={() => setViewingReviewItem(null)}
        ratingScale={ratingScale}
      />

      {/* Full Database & System Backup Modal (JSON & CSV) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onExportFullBackup={handleExportFullBackup}
        onImportFullBackup={handleImportFullBackup}
        onExportCsv={handleExportCsv}
        onImportCsv={handleImportCsv}
        itemsCount={items.length}
        typesCount={types.length}
        platformsCount={platforms.length}
        genresCount={genres.length}
        gradientsCount={(() => {
          try {
            const raw = localStorage.getItem('shelfmedia_saved_gradients_v1');
            return raw ? JSON.parse(raw).length : 0;
          } catch {
            return 0;
          }
        })()}
      />

      {/* Interface Color Personalization Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        theme={uiTheme}
        onChangeTheme={setUiTheme}
        onResetTheme={() => {
          setUiTheme(DEFAULT_UI_THEME);
          showToast(t('Przywrócono domyślne kolory interfejsu!', 'Restored default interface colors!'));
        }}
      />

      {/* CSV Import & Required Layout Guide Modal */}
      <CsvImportModal
        isOpen={isCsvImportModalOpen}
        onClose={() => setIsCsvImportModalOpen(false)}
        onImportCsv={handleImportCsv}
      />

      {/* ShelfMedia Footer */}
      <footer className="mt-auto border-t border-[#2a475e]/60 bg-[#14181f] py-4 text-xs text-[#8f98a0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-wide">ShelfMedia</span>
            <span>•</span>
            <span>
              {t(
                'Gry • Książki • Filmy • Seriale i wiele więcej',
                'Games • Books • Movies • Series and much more'
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-[#a4d007]">
              <ShieldCheck className="w-3.5 h-3.5" />{' '}
              {t(
                'Prywatność, import CSV & 100% lokalna baza',
                'Privacy, CSV import & 100% local database'
              )}
            </span>
            <span className="text-[#8f98a0]">
              {t(
                'Zaprojektowano dla graczy, czytelników i kinomanów i nie tylko!',
                'Designed for gamers, readers, movie buffs, and more!'
              )}
            </span>
            {typeof window !== 'undefined' && window.location.hostname.endsWith('.run.app') && (
              <button
                type="button"
                onClick={() => downloadPortableZip(items, platforms, genres, types, typeConfigs)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] hover:text-white border border-[#66c0f4]/40 font-semibold transition-colors cursor-pointer"
                title={t(
                  'Pobierz gotową paczkę finalną ShelfMedia_Localhost.zip (w pobranej wersji ten przycisk nie jest widoczny)',
                  'Download final ShelfMedia_Localhost.zip package (this button is hidden in the downloaded final version)'
                )}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{t('Pobierz paczkę finalną (.ZIP)', 'Download Final Package (.ZIP)')}</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

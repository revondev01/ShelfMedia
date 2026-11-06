import React from 'react';
import { 
  Gamepad2, 
  BookOpen, 
  Film, 
  Tv, 
  BookMarked, 
  Scroll, 
  Sparkles, 
  Radio, 
  Dices, 
  FileText, 
  Headphones, 
  Music, 
  Video, 
  Clapperboard,
  Layers, 
  Compass, 
  Trophy, 
  Flame, 
  Heart, 
  Palette, 
  Monitor, 
  GraduationCap, 
  Ghost, 
  Sword, 
  Disc,
  Library,
  Star,
  Crown,
  LucideIcon
} from 'lucide-react';
import { MediaTypeConfig, DEFAULT_TYPE_CONFIGS, DEFAULT_PLATFORM_COLORS } from '../types';

export interface IconOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const AVAILABLE_ICONS: IconOption[] = [
  { id: 'Library', label: 'Biblioteka / Półka', icon: Library },
  { id: 'Gamepad2', label: 'Gra / Pad', icon: Gamepad2 },
  { id: 'BookOpen', label: 'Książka', icon: BookOpen },
  { id: 'Film', label: 'Film / Taśma', icon: Film },
  { id: 'Tv', label: 'Serial / TV', icon: Tv },
  { id: 'BookMarked', label: 'Komiks', icon: BookMarked },
  { id: 'Scroll', label: 'Manga / Zwój', icon: Scroll },
  { id: 'Sparkles', label: 'Anime / Magia', icon: Sparkles },
  { id: 'Radio', label: 'Podcast', icon: Radio },
  { id: 'Headphones', label: 'Audiobook / Słuchawki', icon: Headphones },
  { id: 'Dices', label: 'Planszówka / Kości', icon: Dices },
  { id: 'FileText', label: 'Dokument / Artykuł', icon: FileText },
  { id: 'Clapperboard', label: 'Kino / Klaps', icon: Clapperboard },
  { id: 'Music', label: 'Muzyka / Utwór', icon: Music },
  { id: 'Disc', label: 'Płyta / Album', icon: Disc },
  { id: 'Video', label: 'Wideo / Klip', icon: Video },
  { id: 'Sword', label: 'Fantasy / RPG', icon: Sword },
  { id: 'Ghost', label: 'Horror / Groza', icon: Ghost },
  { id: 'Compass', label: 'Przygoda / Podróż', icon: Compass },
  { id: 'Flame', label: 'Akcja / Hit', icon: Flame },
  { id: 'Heart', label: 'Romans / Dramat', icon: Heart },
  { id: 'Trophy', label: 'Osiągnięcia / Sport', icon: Trophy },
  { id: 'Star', label: 'Gwiazda / Ulubione', icon: Star },
  { id: 'Crown', label: 'Korona / Top', icon: Crown },
  { id: 'Palette', label: 'Sztuka / Design', icon: Palette },
  { id: 'Monitor', label: 'Software / Technologia', icon: Monitor },
  { id: 'GraduationCap', label: 'Edukacja / Nauka', icon: GraduationCap },
  { id: 'Layers', label: 'Kolekcja / Uniwersum', icon: Layers }
];

export const COLOR_PRESETS = [
  { hex: '#3b82f6', label: 'Błękitny (Gaming)' },
  { hex: '#6366f1', label: 'Indygo (Sci-Fi)' },
  { hex: '#8b5cf6', label: 'Fioletowy (Anime)' },
  { hex: '#a855f7', label: 'Purpurowy' },
  { hex: '#d946ef', label: 'Fuksja (Film / Pop)' },
  { hex: '#ec4899', label: 'Różowy (Manga)' },
  { hex: '#ef4444', label: 'Czerwony (Akcja / Horror)' },
  { hex: '#f97316', label: 'Pomarańczowy (Przygoda)' },
  { hex: '#f59e0b', label: 'Złoty / Bursztyn (Komiks)' },
  { hex: '#d97706', label: 'Ciepły bursztyn (Książki)' },
  { hex: '#b45309', label: 'Klasyczny brąz (Literatura)' },
  { hex: '#10b981', label: 'Szmaragdowy (Seriale)' },
  { hex: '#14b8a6', label: 'Turkus morski (Planszówki)' },
  { hex: '#06b6d4', label: 'Cyjan (Podcasty / Audio)' },
  { hex: '#0284c7', label: 'Lazurowy (Animacja)' },
  { hex: '#64748b', label: 'Grafitowy (Dokument)' }
];

const ICON_MAP: Record<string, LucideIcon> = AVAILABLE_ICONS.reduce((acc, curr) => {
  acc[curr.id] = curr.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

export const ICON_TO_EMOJI_MAP: Record<string, string> = {
  Library: '📚',
  Gamepad2: '🎮',
  BookOpen: '📖',
  Film: '🎬',
  Tv: '📺',
  BookMarked: '📚',
  Scroll: '📑',
  Sparkles: '✨',
  Radio: '🎙️',
  Headphones: '🎧',
  Dices: '🎲',
  FileText: '📄',
  Clapperboard: '🎬',
  Music: '🎵',
  Disc: '💿',
  Video: '📹',
  Sword: '⚔️',
  Ghost: '👻',
  Compass: '🧭',
  Flame: '🔥',
  Heart: '❤️',
  Trophy: '🏆',
  Star: '⭐',
  Crown: '👑',
  Palette: '🎨',
  Monitor: '💻',
  GraduationCap: '🎓',
  Layers: '🗂️'
};

export function getMediaTypeIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Sparkles;
}

export const ICON_SVG_PATHS: Record<string, string[]> = {
  Library: ['M16 6l4 14', 'M12 6v14', 'M8 8v12', 'M4 4v16'],
  Gamepad2: [
    'M6 11h4',
    'M8 9v4',
    'M15 12h.01',
    'M18 10h.01',
    'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z',
  ],
  BookOpen: [
    'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  ],
  Film: [
    'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M7 2v20',
    'M17 2v20',
    'M2 12h20',
    'M2 7h5',
    'M2 17h5',
    'M17 17h5',
    'M17 7h5',
  ],
  Tv: [
    'M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
    'M17 2l-5 5-5-5',
  ],
  BookMarked: [
    'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20',
    'M10 2v8l3-2 3 2V2',
  ],
  Scroll: [
    'M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4',
    'M19 17V5a2 2 0 0 0-2-2H4',
  ],
  Sparkles: [
    'M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z',
    'M5 3v4',
    'M3 5h4',
    'M19 17v4',
    'M17 19h4',
  ],
  Radio: [
    'M4.9 19.1C1 15.2 1 8.8 4.9 4.9',
    'M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5',
    'M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5',
    'M19.1 4.9C23 8.8 23 15.1 19.1 19',
    'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  ],
  Headphones: [
    'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3',
  ],
  Dices: [
    'M4 10h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z',
    'M17.92 14l3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6',
    'M6 18h.01',
    'M10 14h.01',
    'M15 6h.01',
    'M18 9h.01',
  ],
  FileText: [
    'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
    'M14 2v6h6',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8',
  ],
  Clapperboard: [
    'M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z',
    'M4 11l-.88-2.87a2 2 0 0 1 1.33-2.5l11.48-3.5a2 2 0 0 1 2.5 1.33l.87 2.87L4 11.01z',
    'M6.6 4.99l3.38 4.2',
    'M11.86 3.38l3.38 4.2',
  ],
  Music: [
    'M9 18V5l12-2v13',
    'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  Disc: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ],
  Video: [
    'M22 8l-6 4 6 4V8z',
    'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  ],
  Sword: [
    'M14.5 17.5L3 6V3h3l11.5 11.5',
    'M13 19l6-6',
    'M16 16l4 4',
    'M19 21l2-2',
  ],
  Ghost: [
    'M9 10h.01',
    'M15 10h.01',
    'M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z',
  ],
  Compass: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  ],
  Flame: [
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  ],
  Heart: [
    'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  ],
  Trophy: [
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
    'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0 0 12 0V2Z',
  ],
  Star: [
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  ],
  Crown: [
    'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z',
    'M5 20h14',
  ],
  Palette: [
    'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z',
    'M7.5 10.5h.01',
    'M12 7.5h.01',
    'M16.5 10.5h.01',
  ],
  Monitor: [
    'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M8 21h8',
    'M12 17v4',
  ],
  GraduationCap: [
    'M22 10v6',
    'M2 10l10-5 10 5-10 5z',
    'M6 12v5c3 3 9 3 12 0v-5',
  ],
  Layers: [
    'M12 2L2 7l10 5 10-5-10-5z',
    'M2 17l10 5 10-5',
    'M2 12l10 5 10-5',
  ],
  Clock: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 6v6l4 2',
  ],
  CheckCircle2: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M9 12l2 2 4-4',
  ],
  TrendingUp: [
    'M22 7l-8.5 8.5-5-5L2 17',
    'M16 7h6v6',
  ],
  Award: [
    'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
    'M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  ],
  Calendar: [
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M16 2v4',
    'M8 2v4',
    'M3 10h18',
  ],
};

/**
 * Draws the configured Lucide vector icon onto a 2D Canvas context centered at (cx, cy)
 */
export function drawMediaTypeIconOnCanvas(
  ctx: CanvasRenderingContext2D,
  iconName: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
  lineWidth = 2.2
): void {
  const paths = ICON_SVG_PATHS[iconName] || ICON_SVG_PATHS.Sparkles;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const scale = size / 24;
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of paths) {
    const p = new Path2D(d);
    ctx.stroke(p);
  }
  ctx.restore();
}

export function getIconEmoji(iconName: string): string {
  return ICON_TO_EMOJI_MAP[iconName] || '🏷️';
}

export function getMediaTypeEmoji(
  typeName: string | undefined | null,
  customConfigs?: Record<string, MediaTypeConfig>
): string {
  const config = getMediaTypeConfig(typeName, customConfigs);
  return getIconEmoji(config.icon);
}

export function getMediaTypeConfig(
  typeName: string | undefined | null,
  customConfigs?: Record<string, MediaTypeConfig>
): MediaTypeConfig {
  const name = (typeName || '').trim();
  if (!name) {
    return { name: 'Inne', color: '#64748b', icon: 'Sparkles' };
  }

  // 1. Direct match in custom configs
  if (customConfigs && customConfigs[name]) {
    return customConfigs[name];
  }

  // 2. Case-insensitive match in custom configs
  if (customConfigs) {
    const key = Object.keys(customConfigs).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    if (key && customConfigs[key]) {
      return customConfigs[key];
    }
  }

  // 3. Match in defaults
  if (DEFAULT_TYPE_CONFIGS[name]) {
    return DEFAULT_TYPE_CONFIGS[name];
  }
  const defaultKey = Object.keys(DEFAULT_TYPE_CONFIGS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (defaultKey && DEFAULT_TYPE_CONFIGS[defaultKey]) {
    return DEFAULT_TYPE_CONFIGS[defaultKey];
  }

  // 4. Fuzzy fallback based on common words
  const low = name.toLowerCase();
  if (low.includes('książ') || low.includes('ksiaz')) {
    return { name, color: '#d97706', icon: 'BookOpen' };
  }
  if (low.includes('gra') || low.includes('game')) {
    return { name, color: '#3b82f6', icon: 'Gamepad2' };
  }
  if (low.includes('film') || low.includes('movie') || low.includes('kino')) {
    return { name, color: '#d946ef', icon: 'Film' };
  }
  if (low.includes('serial') || low.includes('series') || low.includes('show')) {
    return { name, color: '#10b981', icon: 'Tv' };
  }
  if (low.includes('komiks') || low.includes('comic')) {
    return { name, color: '#f59e0b', icon: 'BookMarked' };
  }
  if (low.includes('manga')) {
    return { name, color: '#ec4899', icon: 'Scroll' };
  }
  if (low.includes('anime')) {
    return { name, color: '#8b5cf6', icon: 'Sparkles' };
  }
  if (low.includes('podcast') || low.includes('audio')) {
    return { name, color: '#06b6d4', icon: 'Radio' };
  }
  if (low.includes('plansz') || low.includes('board')) {
    return { name, color: '#14b8a6', icon: 'Dices' };
  }
  if (low.includes('dokument') || low.includes('doc')) {
    return { name, color: '#64748b', icon: 'FileText' };
  }

  // Deterministic color generation for unknown custom types
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLOR_PRESETS.length;
  const pickedColor = COLOR_PRESETS[colorIndex].hex;

  return {
    name,
    color: pickedColor,
    icon: 'Sparkles'
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(59, 130, 246, ${alpha})`;
}

/**
 * Returns complete styling for table badges and filter tags based on color or config
 */
export function getTableBadgeStyle(colorHex: string) {
  return {
    backgroundColor: hexToRgba(colorHex, 0.16),
    borderColor: hexToRgba(colorHex, 0.45),
    color: colorHex
  };
}

/**
 * Returns precise styling for the icon and icon container badge
 */
export function getIconBadgeStyle(config: MediaTypeConfig) {
  const bgColor = config.bgColor || hexToRgba(config.color, 0.22);
  const iconColor = config.iconColor || config.color;
  return {
    container: {
      backgroundColor: bgColor,
      borderColor: hexToRgba(config.color, 0.5),
    },
    icon: {
      color: iconColor,
    },
    text: {
      color: config.color,
    }
  };
}

/**
 * Returns gradient and glow styling for Virtual Shelf spines
 */
export function getSpineStyle(colorHex: string) {
  return {
    background: `linear-gradient(180deg, ${hexToRgba(colorHex, 0.45)} 0%, ${hexToRgba(colorHex, 0.22)} 35%, #0f172a 75%, #0a0e17 100%)`,
    borderColor: hexToRgba(colorHex, 0.7),
    boxShadow: `0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 ${hexToRgba(colorHex, 0.8)}`
  };
}

/**
 * Resolves the color for a given platform/format (with fallback to defaults or deterministic preset)
 */
export function getPlatformColor(
  platformName: string | undefined | null,
  customPlatformColors?: Record<string, string>
): string {
  const name = (platformName || '').trim();
  if (!name) return '#64748b';

  if (customPlatformColors && customPlatformColors[name]) {
    return customPlatformColors[name];
  }

  if (customPlatformColors) {
    const key = Object.keys(customPlatformColors).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    if (key && customPlatformColors[key]) {
      return customPlatformColors[key];
    }
  }

  if (DEFAULT_PLATFORM_COLORS[name]) {
    return DEFAULT_PLATFORM_COLORS[name];
  }
  const defKey = Object.keys(DEFAULT_PLATFORM_COLORS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (defKey && DEFAULT_PLATFORM_COLORS[defKey]) {
    return DEFAULT_PLATFORM_COLORS[defKey];
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLOR_PRESETS.length;
  return COLOR_PRESETS[colorIndex].hex;
}

/**
 * Picks a random vibrant color from COLOR_PRESETS (preferring unused colors when possible)
 */
export function getRandomPresetColor(usedColors?: string[]): string {
  const usedSet = new Set((usedColors || []).map((c) => c.toLowerCase()));
  const unused = COLOR_PRESETS.filter((p) => !usedSet.has(p.hex.toLowerCase()));
  const pool = unused.length > 0 ? unused : COLOR_PRESETS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].hex;
}

/**
 * Infers a suitable default icon for a media type name and assigns a random color
 */
export function createRandomMediaTypeConfig(
  typeName: string,
  usedColors?: string[]
): MediaTypeConfig {
  const name = typeName.trim() || 'Inne';
  const low = name.toLowerCase();
  let icon = 'Sparkles';

  if (low.includes('książ') || low.includes('ksiaz') || low.includes('book')) {
    icon = 'BookOpen';
  } else if (low.includes('gra') || low.includes('game')) {
    icon = 'Gamepad2';
  } else if (low.includes('film') || low.includes('movie') || low.includes('kino')) {
    icon = 'Film';
  } else if (low.includes('serial') || low.includes('series') || low.includes('show')) {
    icon = 'Tv';
  } else if (low.includes('komiks') || low.includes('comic')) {
    icon = 'BookMarked';
  } else if (low.includes('manga')) {
    icon = 'Scroll';
  } else if (low.includes('anime')) {
    icon = 'Sparkles';
  } else if (low.includes('podcast') || low.includes('radio')) {
    icon = 'Radio';
  } else if (low.includes('audio') || low.includes('muzyk') || low.includes('music')) {
    icon = 'Headphones';
  } else if (low.includes('plansz') || low.includes('board')) {
    icon = 'Dices';
  } else if (low.includes('dokument') || low.includes('doc')) {
    icon = 'FileText';
  }

  const color = getRandomPresetColor(usedColors);
  return {
    name,
    color,
    icon,
    iconColor: color,
    bgColor: hexToRgba(color, 0.2),
  };
}



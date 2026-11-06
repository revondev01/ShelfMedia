import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, DEFAULT_PLATFORM_COLORS, SpineColorMode } from '../types';
import { 
  Star, 
  Plus, 
  Layers,
  Sparkles,
  Sliders,
  Power,
  Palette,
  RotateCcw,
  Minus,
  Download
} from 'lucide-react';
import { 
  getMediaTypeConfig, 
  getMediaTypeIcon, 
  drawMediaTypeIconOnCanvas,
  getPlatformColor,
  hexToRgba
} from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

export const LED_COLOR_PRESETS = [
  { name: 'Cyjan Neo', nameEn: 'Neo Cyan', color: '#38bdf8' },
  { name: 'Szmaragd', nameEn: 'Emerald', color: '#10b981' },
  { name: 'Fiolet RGB', nameEn: 'RGB Purple', color: '#a855f7' },
  { name: 'Złoty Bursztyn', nameEn: 'Golden Amber', color: '#f59e0b' },
  { name: 'Karmazyn', nameEn: 'Crimson', color: '#ef4444' },
  { name: 'Róż Cyber', nameEn: 'Cyber Pink', color: '#ec4899' },
  { name: 'Ciepły Biały', nameEn: 'Warm White', color: '#f8fafc' },
];

export const SHELF_PLANK_PRESETS = [
  { name: 'Stalowy Regał', nameEn: 'Brushed Steel', color: '#334155' },
  { name: 'Klasyczny Dąb', nameEn: 'Classic Oak', color: '#854d0e' },
  { name: 'Ciemny Orzech', nameEn: 'Dark Walnut', color: '#451a03' },
  { name: 'Szlachetny Mahoń', nameEn: 'Rich Mahogany', color: '#7f1d1d' },
  { name: 'Czarny Heban', nameEn: 'Black Ebony', color: '#18181b' },
  { name: 'Nocny Granat', nameEn: 'Midnight Navy', color: '#1e3a5f' },
  { name: 'Skandynawska Szarość', nameEn: 'Nordic Silver', color: '#64748b' },
];

export const SHELF_BG_PRESETS = [
  { name: 'Głęboki Ciemny', nameEn: 'Deep Dark', color: '#0d141d' },
  { name: 'Nocny Szafir', nameEn: 'Night Sapphire', color: '#0f172a' },
  { name: 'Ciepły Antracyt', nameEn: 'Warm Anthracite', color: '#1c1917' },
  { name: 'Leśny Cień', nameEn: 'Forest Shadow', color: '#071f18' },
  { name: 'Burgundowy Gabinet', nameEn: 'Burgundy Study', color: '#240d15' },
  { name: 'Kosmiczny Fiolet', nameEn: 'Cosmic Violet', color: '#160f29' },
  { name: 'Grafitowy Loft', nameEn: 'Graphite Loft', color: '#1e293b' },
];

export const BOOKEND_COLOR_PRESETS = [
  { name: 'Stal Szczotkowana', nameEn: 'Brushed Steel', color: '#475569' },
  { name: 'Złoty Mosiądz', nameEn: 'Golden Brass', color: '#d97706' },
  { name: 'Miedź Industrialna', nameEn: 'Industrial Copper', color: '#b45309' },
  { name: 'Szmaragdowy Akcent', nameEn: 'Emerald Accent', color: '#059669' },
  { name: 'Karmazynowa Czerwień', nameEn: 'Crimson Red', color: '#dc2626' },
  { name: 'Królewski Fiolet', nameEn: 'Royal Purple', color: '#7c3aed' },
  { name: 'Srebrny Chrom', nameEn: 'Silver Chrome', color: '#94a3b8' },
];

const MAX_SHELF_CAPACITY = 20;
const MAX_SHELVES_PER_PNG = 5;
const DEFAULT_SHELF_CAPACITY = 12;
const DEFAULT_SHELF_PLANK_COLOR = '#334155';
const DEFAULT_SHELF_BG_COLOR = '#0d141d';
const DEFAULT_BOOKEND_COLOR = '#475569';

interface VirtualShelfViewProps {
  items: MediaItem[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  platformColors?: Record<string, string>;
  userName?: string;
  shelfTitle?: string;
  onSelectItem: (item: MediaItem) => void;
  onAddNew: () => void;
  onOpenOptionsManager?: () => void;
}

export const VirtualShelfView: React.FC<VirtualShelfViewProps> = ({
  items,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  platformColors = DEFAULT_PLATFORM_COLORS,
  userName = '',
  shelfTitle,
  onSelectItem,
  onAddNew,
  onOpenOptionsManager,
}) => {
  const { lang, t, trType, trPlatform } = useLanguage();

  // Spine color mode: 'type' (by media type) or 'platform' (by platform/format)
  const [spineColorMode, setSpineColorMode] = useState<SpineColorMode>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_spine_color_mode');
      if (stored === 'platform' || stored === 'type') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'type';
  });

  // LED Beam state with local persistence
  const [ledEnabled, setLedEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_led_beam_enabled');
      if (stored !== null) return stored === 'true';
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  const [ledColor, setLedColor] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_led_beam_color');
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return '#38bdf8';
  });

  const [showLedPicker, setShowLedPicker] = useState<boolean>(false);

  // Shelf Personalization states with localStorage persistence (max 20 items per shelf)
  const [shelfCapacity, setShelfCapacity] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_shelf_capacity');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          return Math.min(MAX_SHELF_CAPACITY, Math.max(1, parsed));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SHELF_CAPACITY;
  });

  const [shelfPlankColor, setShelfPlankColor] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_shelf_plank_color');
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SHELF_PLANK_COLOR;
  });

  const [shelfBgColor, setShelfBgColor] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_shelf_bg_color');
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SHELF_BG_COLOR;
  });

  const [bookendColor, setBookendColor] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('shelfmedia_shelf_bookend_color');
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BOOKEND_COLOR;
  });

  const [showShelfCustomizer, setShowShelfCustomizer] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  // Measure shelf inner width to know when items do not fill the entire shelf width
  const shelfContainerRef = useRef<HTMLDivElement | null>(null);
  const [shelfWidth, setShelfWidth] = useState<number>(1024);

  useEffect(() => {
    const el = shelfContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setShelfWidth(el.clientWidth);
      }
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(el);
      return () => observer.disconnect();
    } else {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [items.length]);

  const isApplyingExternalRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    const handleExternalSync = (e: Event) => {
      const custom = e as CustomEvent;
      const s = custom.detail?.shelfSettings;
      if (!s || typeof s !== 'object') return;
      isApplyingExternalRef.current = true;
      if (typeof s.ledEnabled === 'boolean') setLedEnabled(s.ledEnabled);
      if (typeof s.ledColor === 'string' && s.ledColor) setLedColor(s.ledColor);
      if (typeof s.shelfCapacity === 'number' && !isNaN(s.shelfCapacity)) {
        setShelfCapacity(Math.min(MAX_SHELF_CAPACITY, Math.max(1, Math.round(s.shelfCapacity))));
      }
      if (typeof s.shelfPlankColor === 'string' && s.shelfPlankColor) setShelfPlankColor(s.shelfPlankColor);
      if (typeof s.shelfBgColor === 'string' && s.shelfBgColor) setShelfBgColor(s.shelfBgColor);
      if (typeof s.bookendColor === 'string' && s.bookendColor) setBookendColor(s.bookendColor);
      if (s.spineColorMode === 'type' || s.spineColorMode === 'platform') setSpineColorMode(s.spineColorMode);
      setTimeout(() => {
        isApplyingExternalRef.current = false;
      }, 50);
    };

    const handleStorage = (e: StorageEvent) => {
      isApplyingExternalRef.current = true;
      if (e.key === 'shelfmedia_led_beam_enabled' && e.newValue !== null) {
        setLedEnabled(e.newValue === 'true');
      } else if (e.key === 'shelfmedia_led_beam_color' && e.newValue) {
        setLedColor(e.newValue);
      } else if (e.key === 'shelfmedia_shelf_capacity' && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed)) setShelfCapacity(Math.min(MAX_SHELF_CAPACITY, Math.max(1, parsed)));
      } else if (e.key === 'shelfmedia_shelf_plank_color' && e.newValue) {
        setShelfPlankColor(e.newValue);
      } else if (e.key === 'shelfmedia_shelf_bg_color' && e.newValue) {
        setShelfBgColor(e.newValue);
      } else if (e.key === 'shelfmedia_shelf_bookend_color' && e.newValue) {
        setBookendColor(e.newValue);
      } else if (e.key === 'shelfmedia_spine_color_mode' && (e.newValue === 'type' || e.newValue === 'platform')) {
        setSpineColorMode(e.newValue);
      }
      setTimeout(() => {
        isApplyingExternalRef.current = false;
      }, 50);
    };

    window.addEventListener('shelfmedia:external-sync', handleExternalSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('shelfmedia:external-sync', handleExternalSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('shelfmedia_led_beam_enabled', String(ledEnabled));
      localStorage.setItem('shelfmedia_led_beam_color', ledColor);
      localStorage.setItem('shelfmedia_shelf_capacity', String(shelfCapacity));
      localStorage.setItem('shelfmedia_shelf_plank_color', shelfPlankColor);
      localStorage.setItem('shelfmedia_shelf_bg_color', shelfBgColor);
      localStorage.setItem('shelfmedia_shelf_bookend_color', bookendColor);
      localStorage.setItem('shelfmedia_spine_color_mode', spineColorMode);
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
      }
      if (!isApplyingExternalRef.current) {
        window.dispatchEvent(new CustomEvent('shelfmedia:local-extra-change'));
      }
    } catch (e) {
      console.error(e);
    }
  }, [ledEnabled, ledColor, shelfCapacity, shelfPlankColor, shelfBgColor, bookendColor, spineColorMode]);

  const handleResetShelfCustomization = () => {
    setShelfCapacity(DEFAULT_SHELF_CAPACITY);
    setShelfPlankColor(DEFAULT_SHELF_PLANK_COLOR);
    setShelfBgColor(DEFAULT_SHELF_BG_COLOR);
    setBookendColor(DEFAULT_BOOKEND_COLOR);
    setSpineColorMode('type');
  };

  // Compute dynamic height and base width per item based on type and volume (pages or hours spent)
  const getItemDimensions = (item: MediaItem) => {
    const tStr = (item.item_type || '').toLowerCase();
    
    // Books and comics scale with pages (capped at 226px height so top hover tooltip is never clipped)
    if (tStr.includes('książ') || tStr.includes('ksiaz') || tStr.includes('manga') || tStr.includes('komiks')) {
      const p = item.pages || 320;
      const h = Math.round(Math.min(226, Math.max(196, 192 + p * 0.03)));
      const w = Math.round(Math.min(54, Math.max(40, 38 + p * 0.022)));
      return { height: `${h}px`, width: `${w}px`, heightNum: h, widthNum: w };
    }

    // Games scale with hours spent
    if (tStr.includes('gra') || tStr.includes('game')) {
      const hrs = item.hours_spent || 30;
      const h = Math.round(Math.min(218, Math.max(192, 190 + hrs * 0.14)));
      const w = Math.round(Math.min(52, Math.max(40, 38 + hrs * 0.09)));
      return { height: `${h}px`, width: `${w}px`, heightNum: h, widthNum: w };
    }

    // Series scale slightly with hours
    if (tStr.includes('serial') || tStr.includes('series')) {
      const hrs = item.hours_spent || 10;
      const h = Math.round(Math.min(212, Math.max(188, 188 + hrs * 0.2)));
      return { height: `${h}px`, width: `42px`, heightNum: h, widthNum: 42 };
    }

    // Movies standard DVD / BluRay box
    if (tStr.includes('film') || tStr.includes('movie')) {
      return { height: '186px', width: '38px', heightNum: 186, widthNum: 38 };
    }

    // Podcasts / Boardgames / Others
    return { height: '200px', width: '42px', heightNum: 200, widthNum: 42 };
  };

  // Resolve spine color for a given item based on active spineColorMode ('type' vs 'platform')
  const resolveSpineColor = (item: MediaItem): string => {
    if (spineColorMode === 'platform') {
      return getPlatformColor(item.platform, platformColors);
    }
    return getMediaTypeConfig(item.item_type, typeConfigs).color;
  };

  // Extract distinct active types in current shelf view for legend (strictly from displayed items)
  const distinctTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.item_type && i.item_type.trim()) set.add(i.item_type.trim());
    });
    return Array.from(set);
  }, [items]);

  // Extract distinct active platforms in current shelf view for legend (strictly from displayed items)
  const distinctPlatforms = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.platform && i.platform.trim()) set.add(i.platform.trim());
    });
    return Array.from(set);
  }, [items]);

  // Chunk items into shelf levels based on user-customizable shelfCapacity (max 20 per shelf)
  const shelfTiers = useMemo(() => {
    if (items.length === 0) return [];
    const size = Math.min(MAX_SHELF_CAPACITY, Math.max(1, shelfCapacity));
    const tiers: MediaItem[][] = [];
    for (let i = 0; i < items.length; i += size) {
      tiers.push(items.slice(i, i + size));
    }
    return tiers;
  }, [items, shelfCapacity]);

  // Helper to draw rounded rectangle on 2D Canvas
  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  // Export current shelf view to .PNG (up to 5 shelves per image; generates multiple .png files sequentially with _1, _2... suffix)
  const handleExportShelvesPng = async () => {
    if (shelfTiers.length === 0 || isExportingPng) return;
    setIsExportingPng(true);

    try {
      const totalImagePages = Math.max(1, Math.ceil(shelfTiers.length / MAX_SHELVES_PER_PNG));
      const cleanUserName = userName ? userName.replace(/^@+/, '').trim() : '';
      const baseSlug = (shelfTitle || 'shelf')
        .toLowerCase()
        .replace(/[^a-z0-9ąćęłńóśźż]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'shelf';

      for (let pageIdx = 0; pageIdx < totalImagePages; pageIdx++) {
        const pageShelves = shelfTiers.slice(
          pageIdx * MAX_SHELVES_PER_PNG,
          (pageIdx + 1) * MAX_SHELVES_PER_PNG
        );
        const startShelfIndex = pageIdx * MAX_SHELVES_PER_PNG;
        const pageItems = pageShelves.flat();

        const pageDistinctTypes = Array.from(
          new Set(
            pageItems
              .map((i) => (i.item_type ? i.item_type.trim() : ''))
              .filter(Boolean)
          )
        );
        const pageDistinctPlatforms = Array.from(
          new Set(
            pageItems
              .map((i) => (i.platform ? i.platform.trim() : ''))
              .filter(Boolean)
          )
        );

        const canvasW = 1600;
        const padX = 56;
        const maxLegendContentW = canvasW - padX * 2 - 36;

        // Build legend entries for the current spineColorMode adapted to displayed content on this graphic
        const legendHeading =
          spineColorMode === 'platform'
            ? `${t('Platformy i Formaty', 'Platforms & Formats')}:`
            : `${t('Typ mediów', 'Media Type')}:`;

        const legendEntries =
          spineColorMode === 'type'
            ? pageDistinctTypes.map((tName) => {
                const cfg = getMediaTypeConfig(tName, typeConfigs);
                return {
                  label: trType(tName),
                  color: cfg.color,
                  icon: cfg.icon,
                };
              })
            : pageDistinctPlatforms.map((pName) => ({
                label: trPlatform(pName),
                color: getPlatformColor(pName, platformColors),
                icon: null as string | null,
              }));

        // Measure legend layout rows using a scratch canvas context
        const measureCanvas = document.createElement('canvas');
        const mCtx = measureCanvas.getContext('2d');
        if (mCtx) {
          mCtx.font = '700 13px Inter, system-ui, sans-serif';
        }
        const headingWidth = mCtx ? mCtx.measureText(legendHeading).width + 18 : 140;

        type PositionedLegendEntry = {
          label: string;
          color: string;
          icon: string | null;
          row: number;
          x: number;
          itemW: number;
        };

        const positionedLegend: PositionedLegendEntry[] = [];
        let curRow = 0;
        let curLegendX = headingWidth;

        legendEntries.forEach((entry) => {
          const textW = mCtx ? mCtx.measureText(entry.label).width : entry.label.length * 8;
          const badgeSize = 20;
          const itemW = badgeSize + 8 + textW + 22;
          if (curLegendX + itemW > maxLegendContentW && curLegendX > headingWidth) {
            curRow++;
            curLegendX = 0;
          }
          positionedLegend.push({
            ...entry,
            row: curRow,
            x: curLegendX,
            itemW,
          });
          curLegendX += itemW;
        });

        const totalLegendRows = Math.max(1, curRow + 1);
        const legendRowH = 28;
        const legendBoxPadY = 12;
        const legendBoxH = totalLegendRows * legendRowH + legendBoxPadY * 2;
        const legendBoxY = 104;
        const headerH = legendBoxY + legendBoxH + 22;

        const shelfBlockH = 315;
        const shelfGap = 28;
        const footerH = 52;
        const canvasH =
          headerH +
          pageShelves.length * shelfBlockH +
          Math.max(0, pageShelves.length - 1) * shelfGap +
          footerH;

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // 1. Main Canvas Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
        bgGrad.addColorStop(0, '#111722');
        bgGrad.addColorStop(0.5, '#16202d');
        bgGrad.addColorStop(1, '#0d131c');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Top Header: "Shelf" + userName
        ctx.save();
        const headerTitle = cleanUserName ? `Shelf • ${cleanUserName}` : 'Shelf';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(headerTitle, padX, 24);

        // Subtitle with view / collection info and mode name
        const modeTitle =
          spineColorMode === 'platform'
            ? t('Platformy i Formaty', 'Platforms & Formats')
            : t('Typ mediów', 'Media Type');
        const subParts: string[] = [];
        if (shelfTitle) subParts.push(shelfTitle);
        subParts.push(`${items.length} ${t('pozycji', 'items')}`);
        subParts.push(modeTitle);
        if (totalImagePages > 1) {
          subParts.push(t(`Część ${pageIdx + 1} z ${totalImagePages}`, `Part ${pageIdx + 1} of ${totalImagePages}`));
        }
        ctx.fillStyle = '#8f98a0';
        ctx.font = '600 15px Inter, system-ui, sans-serif';
        ctx.fillText(subParts.join('  •  '), padX, 70);

        // 2b. Legend Box ("Typ mediów:" or "Platformy i Formaty:" + icon/color badges)
        const legendBoxX = padX;
        const legendBoxW = canvasW - padX * 2;
        drawRoundRect(ctx, legendBoxX, legendBoxY, legendBoxW, legendBoxH, 10);
        ctx.fillStyle = 'rgba(23, 26, 33, 0.85)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(102, 192, 244, 0.25)';
        ctx.stroke();

        const firstRowCenterY = legendBoxY + legendBoxPadY + legendRowH / 2;
        ctx.fillStyle = '#66c0f4';
        ctx.font = '800 13px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(legendHeading, legendBoxX + 18, firstRowCenterY);

        positionedLegend.forEach((entry) => {
          const rowCenterY = legendBoxY + legendBoxPadY + entry.row * legendRowH + legendRowH / 2;
          const itemStartX = legendBoxX + 18 + entry.x;
          const badgeSize = 20;
          const badgeY = rowCenterY - badgeSize / 2;

          // Colored badge square
          ctx.save();
          drawRoundRect(ctx, itemStartX, badgeY, badgeSize, badgeSize, 5);
          ctx.fillStyle = entry.color;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.stroke();

          // Draw vector icon inside badge for Media Type mode (never emoji!)
          if (entry.icon) {
            drawMediaTypeIconOnCanvas(
              ctx,
              entry.icon,
              itemStartX + badgeSize / 2,
              rowCenterY,
              13,
              '#ffffff',
              2.2
            );
          }
          ctx.restore();

          // Entry label text
          ctx.fillStyle = '#e5e9f0';
          ctx.font = '700 13px Inter, system-ui, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.fillText(entry.label, itemStartX + badgeSize + 8, rowCenterY);
        });

        ctx.restore();

        // 3. Draw Each Shelf Tier in this chunk (up to 5 shelves)
        const shelfBoxW = canvasW - padX * 2;
        const innerPadX = 34;
        const usableCanvasShelfW = shelfBoxW - innerPadX * 2;

        pageShelves.forEach((shelfItems, localIdx) => {
          const globalTierIdx = startShelfIndex + localIdx;
          const boxX = padX;
          const boxY = headerH + localIdx * (shelfBlockH + shelfGap);
          const plankH = 26;
          const plankY = boxY + shelfBlockH - plankH - 14;

          // Shelf Backboard Box
          ctx.save();
          drawRoundRect(ctx, boxX, boxY, shelfBoxW, shelfBlockH - 10, 16);
          const shelfBackGrad = ctx.createLinearGradient(boxX, boxY, boxX, plankY);
          shelfBackGrad.addColorStop(0, hexToRgba(shelfBgColor, 0.96));
          shelfBackGrad.addColorStop(0.7, shelfBgColor);
          shelfBackGrad.addColorStop(1, '#070b10');
          ctx.fillStyle = shelfBackGrad;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = hexToRgba(shelfPlankColor, 0.5);
          ctx.stroke();

          // Subtle dotted backboard texture
          ctx.fillStyle = 'rgba(255,255,255,0.035)';
          for (let gx = boxX + 20; gx < boxX + shelfBoxW - 15; gx += 22) {
            for (let gy = boxY + 18; gy < plankY - 10; gy += 22) {
              ctx.fillRect(gx, gy, 1.5, 1.5);
            }
          }
          ctx.restore();

          // Calculate spine widths on canvas
          const gapPx = 10;
          const rawSpinesSum = shelfItems.reduce((acc, it) => acc + getItemDimensions(it).widthNum * 1.32, 0);
          const totalGapsW = Math.max(0, shelfItems.length - 1) * gapPx;
          const isFull20 = shelfItems.length >= MAX_SHELF_CAPACITY;
          const showBookend = !isFull20 && rawSpinesSum + totalGapsW < usableCanvasShelfW - 44;
          const targetArea = usableCanvasShelfW - totalGapsW - (showBookend ? 38 : 0);
          const scaleFactor =
            isFull20 || rawSpinesSum > targetArea
              ? Math.max(0.68, targetArea / Math.max(1, rawSpinesSum))
              : 1;

          let curX = boxX + innerPadX;

          shelfItems.forEach((item) => {
            const dim = getItemDimensions(item);
            const spW = Math.max(42, Math.round(dim.widthNum * 1.32 * scaleFactor));
            const spH = Math.round(dim.heightNum * 1.08);
            const spY = plankY - spH;
            const baseColor = resolveSpineColor(item);
            const itemTypeCfg = getMediaTypeConfig(item.item_type, typeConfigs);

            // Spine Body
            ctx.save();
            drawRoundRect(ctx, curX, spY, spW, spH, 4);
            const spGrad = ctx.createLinearGradient(curX, spY, curX, plankY);
            spGrad.addColorStop(0, hexToRgba(baseColor, 0.52));
            spGrad.addColorStop(0.35, hexToRgba(baseColor, 0.24));
            spGrad.addColorStop(0.75, '#0f172a');
            spGrad.addColorStop(1, '#080d16');
            ctx.fillStyle = spGrad;
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = hexToRgba(baseColor, 0.55);
            ctx.stroke();

            // Top colored cap
            ctx.fillStyle = baseColor;
            ctx.fillRect(curX + 1, spY, spW - 2, 4);

            // Top ribbon bar
            ctx.fillStyle = hexToRgba(baseColor, 0.85);
            ctx.fillRect(curX + spW * 0.18, spY + 10, spW * 0.64, 2.5);

            // Top Vector Icon (drawn directly on canvas, never emoji)
            drawMediaTypeIconOnCanvas(
              ctx,
              itemTypeCfg.icon,
              curX + spW / 2,
              spY + 24,
              15,
              baseColor,
              2.2
            );

            // Bottom Rating Box
            const bottomBoxH = 30;
            const bottomBoxY = plankY - bottomBoxH;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(curX + 1, bottomBoxY, spW - 2, bottomBoxH);

            ctx.fillStyle = '#fcd34d';
            ctx.font = '900 12px monospace, Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`★${item.rating.toFixed(1)}`, curX + spW / 2, bottomBoxY + 12);

            ctx.fillStyle = hexToRgba(baseColor, 0.7);
            ctx.fillRect(curX + spW * 0.18, plankY - 6, spW * 0.64, 2);

            // Vertical Title in the middle
            const availTitleH = Math.max(40, bottomBoxY - (spY + 42) - 8);
            ctx.save();
            ctx.translate(curX + spW / 2, spY + 42 + availTitleH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let displayTitle = item.title;
            while (displayTitle.length > 4 && ctx.measureText(displayTitle).width > availTitleH) {
              displayTitle = displayTitle.slice(0, -2).trim() + '…';
            }
            ctx.fillText(displayTitle, 0, 0);
            ctx.restore();

            ctx.restore();
            curX += spW + gapPx;
          });

          // Draw Bookend if applicable
          if (showBookend) {
            const beX = curX + 4;
            const beH = 152;
            const beW = 22;
            const beY = plankY - beH;
            ctx.save();
            drawRoundRect(ctx, beX, beY, beW, beH, 4);
            const beGrad = ctx.createLinearGradient(beX, beY, beX + beW, beY);
            beGrad.addColorStop(0, bookendColor);
            beGrad.addColorStop(0.6, hexToRgba(bookendColor, 0.8));
            beGrad.addColorStop(1, '#0f172a');
            ctx.fillStyle = beGrad;
            ctx.fill();
            ctx.strokeStyle = hexToRgba(bookendColor, 0.95);
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner slot on bookend
            drawRoundRect(ctx, beX + 8, beY + 32, 6, 86, 3);
            ctx.fillStyle = '#090d14';
            ctx.fill();

            // Bookend foot
            ctx.fillStyle = bookendColor;
            ctx.fillRect(beX, plankY - 10, beW + 8, 10);
            ctx.restore();
          }

          // Draw Shelf Plank / Ledge (WITHOUT any LED status text!)
          ctx.save();
          const plankGrad = ctx.createLinearGradient(boxX, plankY, boxX + shelfBoxW, plankY);
          plankGrad.addColorStop(0, hexToRgba(shelfPlankColor, 0.85));
          plankGrad.addColorStop(0.5, shelfPlankColor);
          plankGrad.addColorStop(1, hexToRgba(shelfPlankColor, 0.85));
          ctx.fillStyle = plankGrad;
          ctx.fillRect(boxX, plankY, shelfBoxW, plankH);

          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(boxX, plankY);
          ctx.lineTo(boxX + shelfBoxW, plankY);
          ctx.stroke();

          // Plank left label: PÓŁKA X • Y / Z POZYCJI
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '700 12px monospace, Inter, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          ctx.fillText(
            `${t(`PÓŁKA ${globalTierIdx + 1}`, `SHELF ${globalTierIdx + 1}`)}  •  ${shelfItems.length} / ${shelfCapacity} ${t('pozycji', 'items')}`,
            boxX + 24,
            plankY + plankH / 2
          );

          // Neon LED Underglow Line (visual glow only, no text)
          if (ledEnabled) {
            ctx.save();
            ctx.shadowColor = ledColor;
            ctx.shadowBlur = 18;
            ctx.fillStyle = ledColor;
            ctx.fillRect(boxX + 2, plankY + plankH, shelfBoxW - 4, 3.5);
            ctx.restore();
          }
          ctx.restore();
        });

        // 4. Footer
        ctx.save();
        ctx.fillStyle = '#64748b';
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        const footerStamp = cleanUserName ? `ShelfMedia • ${cleanUserName}` : 'ShelfMedia';
        ctx.fillText(footerStamp, canvasW - padX, canvasH - footerH / 2);
        ctx.restore();

        // Trigger download with sequence number suffix (_1.png, _2.png, etc.)
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${baseSlug}_polki_${pageIdx + 1}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (pageIdx < totalImagePages - 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    } catch (err) {
      console.error('Błąd eksportu półek do PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#1b2838] rounded-2xl border border-[#2a475e] p-12 text-center shadow-xl">
        <div className="w-16 h-16 rounded-full bg-[#171a21] border border-[#2a475e] flex items-center justify-center mx-auto mb-4 text-[#66c0f4]">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {t('Pusta Wirtualna Półka', 'Empty Virtual Shelf')}
        </h3>
        <p className="text-sm text-[#8f98a0] max-w-md mx-auto mb-6">
          {t(
            'Żadne dzieło nie pasuje do aktualnych filtrów lub Twoja biblioteka jest pusta. Dodaj nową pozycję lub zresetuj kryteria wyszukiwania.',
            'No items match the current filters or your library is empty. Add a new item or reset your search filters.'
          )}
        </p>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6c9313] hover:to-[#8bb817] text-white rounded-lg text-sm font-bold shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('Dodaj pierwsze dzieło', 'Add first item')}</span>
        </button>
      </div>
    );
  }

  const totalPngPages = Math.max(1, Math.ceil(shelfTiers.length / MAX_SHELVES_PER_PNG));

  return (
    <div className="space-y-8" ref={shelfContainerRef}>
      {/* Dynamic Shelf Legend / Spine Color Mode Switcher, Shelf Customizer, LED Beam Controls & PNG Export */}
      <div className="bg-[#171a21] p-3.5 rounded-xl border border-[#2a475e] text-xs shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Spine Color Mode Toggle: By Media Type vs By Platform */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold text-white uppercase tracking-wider">
              {t('Kolory Grzbietów:', 'Spine Colors:')}
            </span>
            <div className="flex items-center bg-[#111720] p-1 rounded-lg border border-[#2a475e]">
              <button
                type="button"
                onClick={() => setSpineColorMode('type')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  spineColorMode === 'type'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Wg typu mediów', 'By Media Type')}
              </button>
              <button
                type="button"
                onClick={() => setSpineColorMode('platform')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  spineColorMode === 'platform'
                    ? 'bg-[#a4d007] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Wg platformy / formatu', 'By Platform / Format')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenOptionsManager && (
              <button
                type="button"
                onClick={onOpenOptionsManager}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border bg-[#1b2838] text-[#e5e9f0] hover:text-white border-[#2a475e] hover:border-[#66c0f4] transition-all cursor-pointer"
              >
                <span className="text-[11px]">{t('Zmień kolory i ikony', 'Customize colors & icons')}</span>
              </button>
            )}

            {/* Shelf Personalization Button */}
            <button
              type="button"
              onClick={() => setShowShelfCustomizer((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                showShelfCustomizer
                  ? 'bg-[#2a475e] text-white border-[#66c0f4] shadow'
                  : 'bg-[#1b2838] text-[#e5e9f0] hover:text-white border-[#2a475e]'
              }`}
              title={t(
                'Personalizuj ilość pozycji na półce, kolor półki, tła oraz podpórki (bookend)',
                'Customize items per shelf, shelf color, background color, and bookend color'
              )}
            >
              <span className="text-[11px]">
                {t('Personalizacja Półki', 'Customize Shelf')} ({shelfCapacity})
              </span>
            </button>

            {/* LED Controls Button */}
            <button
              type="button"
              onClick={() => setShowLedPicker((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                ledEnabled
                  ? 'bg-[#1b2838] text-white border-[#38bdf8]/60 shadow'
                  : 'bg-[#131922] text-[#8f98a0] border-[#2a475e]'
              }`}
              title={t('Dostosuj podświetlenie LED półki lub je wyłącz', 'Customize or toggle shelf LED underglow')}
            >
              <span
                className={`w-2 h-2 rounded-full ${ledEnabled ? 'animate-pulse' : 'bg-slate-600'}`}
                style={ledEnabled ? { backgroundColor: ledColor, boxShadow: `0 0 8px ${ledColor}` } : undefined}
              />
              <span className="text-[11px]">LED</span>
              <Sliders className="w-3 h-3 text-[#66c0f4]" />
            </button>

            {/* Export Current Shelf View to PNG Button */}
            <button
              type="button"
              onClick={handleExportShelvesPng}
              disabled={isExportingPng}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white border border-[#a4d007]/50 shadow transition-all cursor-pointer disabled:opacity-50"
              title={t(
                'Eksportuj aktualny widok wirtualnych półek do pliku .PNG (max 5 półek na grafikę)',
                'Export current virtual shelves view to .PNG (max 5 shelves per image)'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                {isExportingPng
                  ? t('Generowanie PNG...', 'Generating PNG...')
                  : totalPngPages > 1
                  ? t(`Eksportuj półki .PNG (${totalPngPages} pliki)`, `Export shelves .PNG (${totalPngPages} files)`)
                  : t('Eksportuj półki (.PNG)', 'Export shelves (.PNG)')}
              </span>
            </button>
          </div>
        </div>

        {/* Active Color Legend Row */}
        <div className="pt-2 border-t border-[#243547]/70 flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
            {spineColorMode === 'type'
              ? `${t('Typ mediów', 'Media Type')}:`
              : `${t('Platformy i Formaty', 'Platforms & Formats')}:`}
          </span>
          {spineColorMode === 'type' ? (
            distinctTypes.map((tName) => {
              const cfg = getMediaTypeConfig(tName, typeConfigs);
              const IconC = getMediaTypeIcon(cfg.icon);
              return (
                <div key={tName} className="flex items-center gap-1.5">
                  <span 
                    className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center"
                    style={{ 
                      backgroundColor: cfg.color, 
                      borderColor: hexToRgba(cfg.color, 0.9),
                      boxShadow: `0 0 6px ${hexToRgba(cfg.color, 0.4)}`
                    }}
                  >
                    <IconC className="w-2.5 h-2.5 text-white drop-shadow" />
                  </span>
                  <span className="font-semibold text-white/90">
                    {trType(tName)}
                  </span>
                </div>
              );
            })
          ) : (
            distinctPlatforms.map((pName) => {
              const pCol = getPlatformColor(pName, platformColors);
              return (
                <div key={pName} className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-sm border"
                    style={{
                      backgroundColor: pCol,
                      borderColor: hexToRgba(pCol, 0.9),
                      boxShadow: `0 0 6px ${hexToRgba(pCol, 0.4)}`,
                    }}
                  />
                  <span className="font-semibold text-white/90">
                    {trPlatform(pName)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Shelf Customizer Drawer (Capacity, Shelf Color, Background Color, Bookend Color) */}
        {showShelfCustomizer && (
          <div className="p-3.5 rounded-lg bg-[#111720] border border-[#243547] space-y-3.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2d3d] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {t('Personalizacja Wirtualnej Półki', 'Virtual Shelf Personalization')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetShelfCustomization}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1b2838] hover:bg-[#243547] text-[#c7d5e0] hover:text-white border border-[#2a475e] text-[11px] font-semibold transition-colors cursor-pointer"
                title={t('Przywróć domyślny wygląd półki', 'Restore default shelf settings')}
              >
                <RotateCcw className="w-3 h-3 text-[#66c0f4]" />
                <span>{t('Domyślne ustawienia', 'Reset defaults')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* 1. Number of items per shelf (max 20) */}
              <div className="bg-[#161f2c] p-3 rounded-lg border border-[#243547] flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {t('Ilość pozycji na półce:', 'Items per shelf:')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#2a475e] text-[#66c0f4] font-mono text-xs font-bold">
                    {shelfCapacity} / {MAX_SHELF_CAPACITY}
                  </span>
                </div>

                <div className="flex items-center gap-2 my-1">
                  <button
                    type="button"
                    onClick={() => setShelfCapacity((prev) => Math.max(1, prev - 1))}
                    className="w-6 h-6 rounded bg-[#1b2838] hover:bg-[#2a475e] text-white flex items-center justify-center border border-[#2a475e] cursor-pointer"
                    title={t('Zmniejsz ilość pozycji', 'Decrease items per shelf')}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={MAX_SHELF_CAPACITY}
                    value={shelfCapacity}
                    onChange={(e) => setShelfCapacity(Math.min(MAX_SHELF_CAPACITY, Math.max(1, Number(e.target.value))))}
                    className="flex-1 accent-[#66c0f4] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setShelfCapacity((prev) => Math.min(MAX_SHELF_CAPACITY, prev + 1))}
                    className="w-6 h-6 rounded bg-[#1b2838] hover:bg-[#2a475e] text-white flex items-center justify-center border border-[#2a475e] cursor-pointer"
                    title={t('Zwiększ ilość pozycji (max 20)', 'Increase items per shelf (max 20)')}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {[5, 8, 10, 12, 15, 18, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setShelfCapacity(num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                        shelfCapacity === num
                          ? 'bg-[#66c0f4] text-[#0f172a] border-[#66c0f4]'
                          : 'bg-[#111720] text-[#8f98a0] hover:text-white border-[#243547]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Shelf Plank Color */}
              <div className="bg-[#161f2c] p-3 rounded-lg border border-[#243547] flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {t('Kolor samej półki:', 'Shelf plank color:')}
                  </span>
                  <span className="font-mono text-[10px] text-[#8f98a0]">{shelfPlankColor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 my-1">
                  {SHELF_PLANK_PRESETS.map((p) => {
                    const isSelected = shelfPlankColor.toLowerCase() === p.color.toLowerCase();
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setShelfPlankColor(p.color)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          isSelected ? 'scale-125 border-white ring-2 ring-white/50 z-10' : 'border-white/30 hover:scale-110'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={lang === 'en' ? p.nameEn : p.name}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#243547]/60">
                  <span className="text-[10px] text-[#8f98a0]">{t('Własny kolor półki:', 'Custom plank color:')}</span>
                  <input
                    type="color"
                    value={shelfPlankColor}
                    onChange={(e) => setShelfPlankColor(e.target.value)}
                    className="w-6 h-6 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    title={t('Wybierz własny kolor deski regału', 'Pick custom shelf plank color')}
                  />
                </div>
              </div>

              {/* 3. Shelf Background Color */}
              <div className="bg-[#161f2c] p-3 rounded-lg border border-[#243547] flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {t('Kolor tła półki:', 'Shelf background:')}
                  </span>
                  <span className="font-mono text-[10px] text-[#8f98a0]">{shelfBgColor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 my-1">
                  {SHELF_BG_PRESETS.map((p) => {
                    const isSelected = shelfBgColor.toLowerCase() === p.color.toLowerCase();
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setShelfBgColor(p.color)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          isSelected ? 'scale-125 border-white ring-2 ring-white/50 z-10' : 'border-white/30 hover:scale-110'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={lang === 'en' ? p.nameEn : p.name}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#243547]/60">
                  <span className="text-[10px] text-[#8f98a0]">{t('Własny kolor tła:', 'Custom background:')}</span>
                  <input
                    type="color"
                    value={shelfBgColor}
                    onChange={(e) => setShelfBgColor(e.target.value)}
                    className="w-6 h-6 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    title={t('Wybierz własny kolor tła półki', 'Pick custom shelf background color')}
                  />
                </div>
              </div>

              {/* 4. Bookend Color */}
              <div className="bg-[#161f2c] p-3 rounded-lg border border-[#243547] flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {t('Kolor podpórki (Bookend):', 'Bookend color:')}
                  </span>
                  <span className="font-mono text-[10px] text-[#8f98a0]">{bookendColor}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 my-1">
                  {BOOKEND_COLOR_PRESETS.map((p) => {
                    const isSelected = bookendColor.toLowerCase() === p.color.toLowerCase();
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setBookendColor(p.color)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          isSelected ? 'scale-125 border-white ring-2 ring-white/50 z-10' : 'border-white/30 hover:scale-110'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={lang === 'en' ? p.nameEn : p.name}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#243547]/60">
                  <span className="text-[10px] text-[#8f98a0]">{t('Własny kolor podpórki:', 'Custom bookend color:')}</span>
                  <input
                    type="color"
                    value={bookendColor}
                    onChange={(e) => setBookendColor(e.target.value)}
                    className="w-6 h-6 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    title={t('Wybierz własny kolor podpórki (bookend)', 'Pick custom bookend color')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LED Customizer Drawer */}
        {showLedPicker && (
          <div className="p-3 rounded-lg bg-[#111720] border border-[#243547] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLedEnabled((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  ledEnabled
                    ? 'bg-gradient-to-r from-[#173a27] to-[#1f4d34] text-[#a4d007] border border-[#a4d007]/60 shadow'
                    : 'bg-[#1f242e] text-[#8f98a0] hover:text-white border border-[#374151]'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{ledEnabled ? t('Włączone', 'Enabled') : t('Wyłączone', 'Disabled')}</span>
              </button>
            </div>

            {ledEnabled && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#8f98a0]">{t('Kolor LED:', 'LED Color:')}</span>
                <div className="flex items-center gap-1.5">
                  {LED_COLOR_PRESETS.map((p) => {
                    const isSelected = ledColor.toLowerCase() === p.color.toLowerCase();
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setLedColor(p.color)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer relative ${
                          isSelected ? 'scale-125 border-white ring-2 ring-white/50 z-10' : 'border-white/30 hover:scale-110'
                        }`}
                        style={{ backgroundColor: p.color, boxShadow: isSelected ? `0 0 10px ${p.color}` : 'none' }}
                        title={lang === 'en' ? p.nameEn : p.name}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 ml-1 pl-2.5 border-l border-[#243547]">
                  <input
                    type="color"
                    value={ledColor}
                    onChange={(e) => setLedColor(e.target.value)}
                    className="w-6 h-6 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    title={t('Wybierz dowolny własny kolor LED', 'Pick any custom LED color')}
                  />
                  <span className="font-mono text-[11px] text-[#c7d5e0]">{ledColor}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shelf Tiers */}
      <div className="space-y-12">
        {shelfTiers.map((shelfItems, tierIdx) => {
          const gapPx = 8;
          const usableShelfWidth = Math.max(320, shelfWidth - 56);
          const rawSpinesSum = shelfItems.reduce((acc, it) => acc + getItemDimensions(it).widthNum, 0);
          const totalGapsWidth = Math.max(0, shelfItems.length - 1) * gapPx;
          const isFull20Shelf = shelfItems.length >= MAX_SHELF_CAPACITY;
          const showBookend = !isFull20Shelf && rawSpinesSum + totalGapsWidth < usableShelfWidth - 32;

          const targetSpinesArea = usableShelfWidth - totalGapsWidth - (showBookend ? 30 : 0);
          const widthScale =
            isFull20Shelf || rawSpinesSum > targetSpinesArea
              ? Math.max(0.65, targetSpinesArea / Math.max(1, rawSpinesSum))
              : 1;

          return (
            <div 
              key={tierIdx} 
              className="relative rounded-xl border shadow-2xl pt-2"
              style={{
                borderColor: hexToRgba(shelfPlankColor, 0.45),
                background: `linear-gradient(180deg, ${hexToRgba(shelfBgColor, 0.92)} 0%, ${shelfBgColor} 65%, #070b10 100%)`,
              }}
            >
              {/* Shelf Backboard Texture */}
              <div className="absolute inset-0 rounded-xl bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.04] pointer-events-none overflow-hidden" />

              {/* Shelf Items Area */}
              <div className="relative z-10 px-5 sm:px-7 pt-14 flex items-end justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-0 min-h-[290px] scrollbar-thin scrollbar-thumb-[#2a475e]">
                {shelfItems.map((item, itemIdx) => {
                  const config = getMediaTypeConfig(item.item_type, typeConfigs);
                  const IconComponent = getMediaTypeIcon(config.icon);
                  const dim = getItemDimensions(item);
                  const scaledWidthPx = `${Math.max(32, Math.round(dim.widthNum * widthScale))}px`;
                  const baseColor = resolveSpineColor(item);

                  // Prevent left/right edge clipping of the hover tooltip
                  let tooltipPositionClass = 'left-1/2 -translate-x-1/2';
                  if (itemIdx <= 2) {
                    tooltipPositionClass = 'left-0 translate-x-0';
                  } else if (itemIdx >= shelfItems.length - 3 && (isFull20Shelf || itemIdx >= 12)) {
                    tooltipPositionClass = 'right-0 translate-x-0';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      style={{ 
                        height: dim.height, 
                        width: scaledWidthPx,
                        minWidth: scaledWidthPx,
                        background: `linear-gradient(180deg, ${hexToRgba(baseColor, 0.45)} 0%, ${hexToRgba(baseColor, 0.2)} 35%, #0f172a 75%, #080d16 100%)`,
                        borderTop: `3px solid ${baseColor}`,
                        borderLeft: `1px solid ${hexToRgba(baseColor, 0.5)}`,
                        borderRight: `1px solid ${hexToRgba(baseColor, 0.3)}`,
                        boxShadow: `inset 3px 0 4px rgba(255,255,255,0.15), inset -3px 0 5px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.5)`,
                      }}
                      title={`${item.title}${item.creator ? ` — ${item.creator}` : ''} (${trType(item.item_type)} • ${trPlatform(item.platform)}) — ${t('Ocena:', 'Rating:')} ★${item.rating.toFixed(1)}`}
                      className="relative group cursor-pointer flex flex-col justify-between items-center rounded-t-sm transition-all duration-200 ease-out hover:-translate-y-2.5 hover:scale-105 z-10 hover:z-40 select-none"
                    >
                      {/* Top Spine Ribbon with configured icon */}
                      <div className="w-full flex flex-col items-center pt-2 px-1">
                        <div 
                          className="w-3/4 h-[2px] rounded-full mb-1.5"
                          style={{ backgroundColor: hexToRgba(baseColor, 0.8) }}
                        />
                        <IconComponent 
                          className="w-3.5 h-3.5 drop-shadow"
                          style={{ color: baseColor }}
                        />
                      </div>

                      {/* Middle: Vertical Title (top-to-bottom) */}
                      <div className="flex-1 flex items-center justify-center py-2 overflow-hidden w-full px-0.5">
                        <span 
                          className="text-xs font-bold text-white tracking-wide truncate drop-shadow-md [writing-mode:vertical-rl] rotate-180 max-h-[130px]"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                        >
                          {item.title}
                        </span>
                      </div>

                      {/* Bottom: Rating at base with star */}
                      <div className="w-full flex flex-col items-center pb-2 pt-1 border-t border-black/30 bg-black/35">
                        <div className="flex items-center gap-0.5 font-mono text-[11px] font-black text-amber-300 drop-shadow">
                          <Star className="w-2.5 h-2.5 fill-amber-300" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                        <div 
                          className="w-3/4 h-[2px] rounded-full mt-1"
                          style={{ backgroundColor: hexToRgba(baseColor, 0.6) }}
                        />
                      </div>

                      {/* Tooltip on Hover */}
                      <div 
                        className={`absolute -top-11 ${tooltipPositionClass} hidden group-hover:flex items-center gap-2 px-3 py-1.5 bg-[#0b111a]/95 backdrop-blur-md text-white text-[11px] font-semibold rounded-lg shadow-2xl border whitespace-nowrap z-50 pointer-events-none`}
                        style={{ borderColor: baseColor, boxShadow: `0 6px 20px rgba(0,0,0,0.75), 0 0 10px ${hexToRgba(baseColor, 0.3)}` }}
                      >
                        <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: baseColor }} />
                        <span className="font-bold text-white">{item.title}</span>
                        {item.creator && (
                          <span className="text-[#cbd5e1]">— {item.creator}</span>
                        )}
                        <span className="text-[#94a3b8]">
                          ({spineColorMode === 'platform' ? trPlatform(item.platform) : trType(item.item_type)})
                        </span>
                        <span className="text-[#475569]">•</span>
                        <span className="text-amber-300 font-mono font-bold">★ {item.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Customizable Bookend when items do not fill the entire width of the shelf */}
                {showBookend && (
                  <div 
                    className="flex items-end ml-1.5 mb-0 select-none shrink-0 group/bookend"
                    title={t('Podpórka do książek (Bookend)', 'Bookend')}
                  >
                    <div
                      className="h-36 w-5 rounded-tr-md border-t-2 border-r-2 shadow-lg flex flex-col items-center justify-center transition-transform duration-200 group-hover/bookend:scale-[1.02]"
                      style={{
                        background: `linear-gradient(90deg, ${bookendColor} 0%, ${hexToRgba(bookendColor, 0.78)} 55%, #0f172a 100%)`,
                        borderColor: hexToRgba(bookendColor, 0.95),
                        boxShadow: `inset 2px 0 4px rgba(255,255,255,0.22), 3px 4px 12px rgba(0,0,0,0.6)`,
                      }}
                    >
                      <div 
                        className="w-1.5 h-20 rounded-full"
                        style={{
                          backgroundColor: '#090d14',
                          boxShadow: `inset 0 1px 3px rgba(0,0,0,0.9), 0 0 4px ${hexToRgba(bookendColor, 0.5)}`
                        }}
                      />
                    </div>
                    <div
                      className="h-2.5 w-6 -ml-0.5 rounded-r-sm border-t border-r shadow-md"
                      style={{
                        background: `linear-gradient(180deg, ${bookendColor} 0%, #0f172a 100%)`,
                        borderColor: hexToRgba(bookendColor, 0.85),
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Modern Shelf Deck with Customizable Plank Color & LED Underglow (without LED text label on shelf) */}
              <div className="relative">
                {/* Shelf Plank / Ledge */}
                <div 
                  className="h-5 border-t border-b border-b-[#090d14] shadow-xl relative z-20 flex items-center justify-between px-6"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(shelfPlankColor, 0.82)} 0%, ${shelfPlankColor} 50%, ${hexToRgba(shelfPlankColor, 0.82)} 100%)`,
                    borderTopColor: hexToRgba('#ffffff', 0.25),
                    boxShadow: `inset 0 1px 3px rgba(255,255,255,0.18), 0 6px 14px rgba(0,0,0,0.6)`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-white/90 tracking-widest font-bold drop-shadow">
                      {t(`Półka ${tierIdx + 1}`, `Shelf ${tierIdx + 1}`)}
                    </span>
                    <span className="text-[10px] text-white/70 font-mono">
                      • {shelfItems.length} / {shelfCapacity} {t('pozycji', 'items')}
                    </span>
                  </div>
                </div>

                {/* Neon LED strip underneath with customizable color / toggle */}
                {ledEnabled ? (
                  <div 
                    className="h-[2.5px] relative z-20 transition-all duration-300"
                    style={{
                      backgroundColor: ledColor,
                      boxShadow: `0 0 14px ${ledColor}, 0 0 28px ${hexToRgba(ledColor, 0.65)}, 0 0 45px ${hexToRgba(ledColor, 0.35)}`
                    }}
                  />
                ) : (
                  <div className="h-[1.5px] bg-[#16202c] relative z-20" />
                )}

                {/* Under-shelf Ambient Shadow */}
                <div className="h-5 rounded-b-xl bg-gradient-to-b from-black/70 to-transparent" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

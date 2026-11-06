import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Check, 
  Sparkles, 
  Calendar, 
  Smartphone, 
  Square,
  Monitor,
  Palette,
  Sliders,
  Save,
  BookmarkPlus,
  Trash2
} from 'lucide-react';
import { MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, RatingScale } from '../types';
import { getMediaTypeConfig, getMediaTypeIcon, drawMediaTypeIconOnCanvas } from '../utils/mediaTypeUtils';
import { useLanguage, MONTHS_PL } from '../i18n';

export interface GradientPreset {
  id: string;
  name: string;
  nameEn?: string;
  start: string;
  mid: string;
  end: string;
  accent: string;
  direction?: 'diagonal' | 'vertical' | 'radial';
}

export const DEFAULT_GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'steam', name: 'Klasyk', nameEn: 'Classic', start: '#0d131b', mid: '#171d25', end: '#1b2838', accent: '#66c0f4', direction: 'diagonal' },
  { id: 'neon', name: 'Cyber Neon', nameEn: 'Cyber Neon', start: '#080819', mid: '#130c2c', end: '#231145', accent: '#00f2fe', direction: 'diagonal' },
  { id: 'purple', name: 'Fiolet Ametyst', nameEn: 'Amethyst Purple', start: '#120b1f', mid: '#221138', end: '#361852', accent: '#c084fc', direction: 'diagonal' },
  { id: 'emerald', name: 'Szmaragd', nameEn: 'Emerald', start: '#061612', mid: '#0c261e', end: '#13392c', accent: '#10b981', direction: 'diagonal' },
  { id: 'sunset', name: 'Zachód Słońca', nameEn: 'Sunset', start: '#1a0b14', mid: '#2d1222', end: '#45172b', accent: '#fb923c', direction: 'diagonal' },
  { id: 'crimson', name: 'Karmazyn', nameEn: 'Crimson', start: '#18070b', mid: '#290b14', end: '#3d111d', accent: '#f43f5e', direction: 'diagonal' },
  { id: 'gold', name: 'Złoty Prestiż', nameEn: 'Gold Prestige', start: '#151308', mid: '#29220c', end: '#3b3111', accent: '#facc15', direction: 'diagonal' },
];

export const GRADIENT_PRESETS = DEFAULT_GRADIENT_PRESETS;
export const MONTHS = MONTHS_PL;

interface SocialCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  availableYears: string[];
  availableTypes?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  ratingScale?: RatingScale;
  userName?: string;
}

export const SocialCardModal: React.FC<SocialCardModalProps> = ({
  isOpen,
  onClose,
  items,
  availableYears,
  availableTypes,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  ratingScale = 10,
  userName = '',
}) => {
  const { lang, t, trType, trStatus, trPlatform, trGenre, months } = useLanguage();

  const [summaryPeriod, setSummaryPeriod] = useState<'yearly' | 'release_year' | 'monthly'>('yearly');
  const [selectedYear, setSelectedYear] = useState<string>(() => availableYears[0] || 'Wszystkie');
  const [selectedMonth, setSelectedMonth] = useState<string>('10');
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'story' | 'square'>('landscape');
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const availableReleaseYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.year && i.year > 0) set.add(String(i.year));
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const activeYearsList = summaryPeriod === 'release_year' ? availableReleaseYears : availableYears;

  // Custom gradient settings state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('steam');
  const [customStart, setCustomStart] = useState<string>('#0d131b');
  const [customMid, setCustomMid] = useState<string>('#171d25');
  const [customEnd, setCustomEnd] = useState<string>('#1b2838');
  const [customAccent, setCustomAccent] = useState<string>('#66c0f4');
  const [gradientDirection, setGradientDirection] = useState<'diagonal' | 'vertical' | 'radial'>('diagonal');
  const [showColorPickers, setShowColorPickers] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [newGradientName, setNewGradientName] = useState<string>('');

  // Persistent customizable list of user saved gradients
  const SAVED_GRADIENTS_KEY = 'shelfmedia_saved_gradients_v1';
  const [savedGradients, setSavedGradients] = useState<GradientPreset[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_GRADIENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Błąd odczytu zapisanych gradientów:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_GRADIENTS_KEY, JSON.stringify(savedGradients));
    } catch (e) {
      console.error('Błąd zapisu gradientów:', e);
    }
  }, [savedGradients]);

  const handleSelectPreset = (p: GradientPreset) => {
    setSelectedPresetId(p.id);
    setCustomStart(p.start);
    setCustomMid(p.mid);
    setCustomEnd(p.end);
    setCustomAccent(p.accent);
    if (p.direction) {
      setGradientDirection(p.direction);
    }
  };

  const handleSaveCustomGradient = () => {
    const defaultName = lang === 'en' ? `Custom #${savedGradients.length + 1}` : `Własny #${savedGradients.length + 1}`;
    const name = newGradientName.trim() || defaultName;
    const newPreset: GradientPreset = {
      id: `grad_${Date.now()}`,
      name,
      start: customStart,
      mid: customMid,
      end: customEnd,
      accent: customAccent,
      direction: gradientDirection,
    };
    setSavedGradients((prev) => [...prev, newPreset]);
    setSelectedPresetId(newPreset.id);
    setNewGradientName('');
    setSavedFeedback(t(`Zapisano gradient "${name}"!`, `Saved gradient "${name}"!`));
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleDeleteSavedGradient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const grad = savedGradients.find((g) => g.id === id);
    if (
      window.confirm(
        t(
          `Czy na pewno chcesz usunąć zapisany gradient "${grad?.name || ''}"?`,
          `Are you sure you want to delete saved gradient "${grad?.name || ''}"?`
        )
      )
    ) {
      setSavedGradients((prev) => prev.filter((g) => g.id !== id));
      if (selectedPresetId === id) {
        handleSelectPreset(DEFAULT_GRADIENT_PRESETS[0]);
      }
      setSavedFeedback(t('Usunięto wybrany gradient.', 'Deleted selected gradient.'));
      setTimeout(() => setSavedFeedback(null), 2500);
    }
  };

  // Sync selected year if activeYearsList changes
  useEffect(() => {
    if (activeYearsList.length > 0 && selectedYear !== 'Wszystkie' && !activeYearsList.includes(selectedYear)) {
      setSelectedYear(activeYearsList[0]);
    }
  }, [activeYearsList, selectedYear]);

  // Dynamic available categories
  const allAvailableTypes = useMemo(() => {
    const set = new Set<string>();
    if (availableTypes && availableTypes.length > 0) {
      availableTypes.forEach((tItem) => set.add(tItem));
    }
    items.forEach((i) => {
      if (i.item_type) set.add(i.item_type);
    });
    return Array.from(set);
  }, [availableTypes, items]);

  // Selected up to 4 categories for social card
  const [selectedSummaryCategories, setSelectedSummaryCategories] = useState<string[]>(() =>
    allAvailableTypes.slice(0, 4)
  );

  useEffect(() => {
    setSelectedSummaryCategories((prev) => {
      const valid = prev.filter((c) => allAvailableTypes.includes(c));
      if (valid.length > 0) return valid;
      return allAvailableTypes.slice(0, 4);
    });
  }, [allAvailableTypes]);

  const handleToggleCategory = (cat: string) => {
    if (selectedSummaryCategories.includes(cat)) {
      if (selectedSummaryCategories.length <= 1) return;
      setSelectedSummaryCategories((prev) => prev.filter((c) => c !== cat));
    } else {
      if (selectedSummaryCategories.length >= 4) {
        setSelectedSummaryCategories((prev) => [...prev.slice(0, 3), cat]);
      } else {
        setSelectedSummaryCategories((prev) => [...prev, cat]);
      }
    }
  };

  // Month name helper
  const selectedMonthObj = months.find((m) => m.id === selectedMonth) || months[9];

  // Compute metrics for the selected year or month
  const summaryData = useMemo(() => {
    const filteredItems = items.filter((item) => {
      if (summaryPeriod === 'yearly') {
        if (selectedYear === 'Wszystkie') return true;
        const y = item.date_logged ? item.date_logged.substring(0, 4) : String(item.year || '');
        return y === selectedYear;
      } else if (summaryPeriod === 'release_year') {
        if (selectedYear === 'Wszystkie') return Boolean(item.year && item.year > 0);
        return item.year && item.year > 0 ? String(item.year) === selectedYear : false;
      } else {
        if (!item.date_logged) return false;
        return item.date_logged.startsWith(`${selectedYear}-${selectedMonth}`);
      }
    });

    const totalHours = filteredItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
    const totalPages = filteredItems.reduce((acc, curr) => acc + (curr.pages || 0), 0);
    const completedCount = filteredItems.filter((i) => i.status === 'Ukończone').length;
    const avgRating = filteredItems.length > 0
      ? filteredItems.reduce((acc, curr) => acc + curr.rating, 0) / filteredItems.length
      : 0;

    const sortFn = (a: MediaItem, b: MediaItem) =>
      b.rating - a.rating || (b.hours_spent || 0) - (a.hours_spent || 0) || (b.pages || 0) - (a.pages || 0);

    const maxRating = filteredItems.length > 0 ? Math.max(...filteredItems.map((i) => i.rating)) : 0;
    const topRatedTitles = filteredItems.length > 0
      ? filteredItems.filter((i) => i.rating === maxRating).sort(sortFn)
      : [];

    // Dynamic category awards with EX AEQUO grouping
    const categoryAwards = selectedSummaryCategories.map((cat) => {
      const catLower = cat.toLowerCase();
      const catItems = filteredItems.filter((i) => {
        const itemTypeLower = (i.item_type || '').toLowerCase();
        if (catLower.includes('książk') || catLower.includes('ksiazk')) {
          return itemTypeLower.includes('książk') || itemTypeLower.includes('ksiazk');
        }
        return itemTypeLower === catLower;
      });

      const totalCategoryHours = Number(catItems.reduce((acc, c) => acc + (c.hours_spent || 0), 0).toFixed(1));
      const totalCategoryPages = catItems.reduce((acc, c) => acc + (c.pages || 0), 0);

      if (catItems.length === 0) {
        return {
          category: cat,
          itemsCount: 0,
          totalCategoryHours: 0,
          totalCategoryPages: 0,
          maxRating: 0,
          winners: [] as MediaItem[],
          runnerUp: null as MediaItem | null,
          isExAequo: false,
        };
      }

      const sortedCat = [...catItems].sort(sortFn);
      const catMaxRating = Math.max(...catItems.map((i) => i.rating));
      const winners = sortedCat.filter((i) => i.rating === catMaxRating);
      const runnerUp = sortedCat.find((i) => i.rating < catMaxRating) || null;

      return {
        category: cat,
        itemsCount: catItems.length,
        totalCategoryHours,
        totalCategoryPages,
        maxRating: catMaxRating,
        winners,
        runnerUp,
        isExAequo: winners.length > 1,
      };
    });

    // Top genres (up to 5)
    const genreMap: Record<string, { hours: number; count: number }> = {};
    filteredItems.forEach((i) => {
      const g = i.genre || 'Inny';
      if (!genreMap[g]) genreMap[g] = { hours: 0, count: 0 };
      genreMap[g].hours += (i.hours_spent || 0);
      genreMap[g].count += 1;
    });
    const topGenres = Object.entries(genreMap)
      .map(([name, data]) => ({ name, hours: Number(data.hours.toFixed(1)), count: data.count }))
      .sort((a, b) => b.hours - a.hours || b.count - a.count)
      .slice(0, 5);

    // Top platforms (up to 4)
    const platformMap: Record<string, { hours: number; count: number }> = {};
    filteredItems.forEach((i) => {
      const p = i.platform || 'Inna';
      if (!platformMap[p]) platformMap[p] = { hours: 0, count: 0 };
      platformMap[p].hours += (i.hours_spent || 0);
      platformMap[p].count += 1;
    });
    const topPlatforms = Object.entries(platformMap)
      .map(([name, data]) => ({ name, hours: Number(data.hours.toFixed(1)), count: data.count }))
      .sort((a, b) => b.hours - a.hours || b.count - a.count)
      .slice(0, 4);

    const topPlatform = topPlatforms[0] || { name: 'Brak', hours: 0, count: 0 };

    return {
      period: summaryPeriod,
      year: selectedYear,
      month: selectedMonthObj.name,
      monthId: selectedMonth,
      totalCount: filteredItems.length,
      completedCount,
      completionRate: filteredItems.length > 0 ? Math.round((completedCount / filteredItems.length) * 100) : 0,
      totalHours: Number(totalHours.toFixed(1)),
      totalPages,
      avgRating: Number(avgRating.toFixed(1)),
      maxRating,
      topRatedTitles,
      categoryAwards,
      topGenres,
      topPlatforms,
      topPlatform,
    };
  }, [items, summaryPeriod, selectedYear, selectedMonth, selectedMonthObj, selectedSummaryCategories]);

  // Render canvas graphic with unified visual style across Landscape (16:9), Story (9:16), and Square (1:1)
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = aspectRatio === 'landscape' ? 1920 : aspectRatio === 'square' ? 1440 : 1080;
    const height = aspectRatio === 'landscape' ? 1080 : aspectRatio === 'square' ? 1440 : 1920;
    canvas.width = width;
    canvas.height = height;

    // Helper: convert hex color to rgba for ambient glow
    const hexToRgba = (hex: string, alpha: number) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16) || 102;
      const g = parseInt(clean.substring(2, 4), 16) || 192;
      const b = parseInt(clean.substring(4, 6), 16) || 244;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // --- 1. Background Gradient ---
    let bgGrad: CanvasGradient;
    if (gradientDirection === 'vertical') {
      bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, customStart);
      bgGrad.addColorStop(0.5, customMid);
      bgGrad.addColorStop(1, customEnd);
    } else if (gradientDirection === 'radial') {
      bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.65);
      bgGrad.addColorStop(0, customMid);
      bgGrad.addColorStop(0.65, customStart);
      bgGrad.addColorStop(1, customEnd);
    } else {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, customStart);
      bgGrad.addColorStop(0.45, customMid);
      bgGrad.addColorStop(1, customEnd);
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic ambient atmospheric glow circles based on accent color
    const radGlow1 = ctx.createRadialGradient(220, 200, 20, 220, 200, 680);
    radGlow1.addColorStop(0, hexToRgba(customAccent, 0.18));
    radGlow1.addColorStop(1, hexToRgba(customAccent, 0));
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, width, height);

    const radGlow2 = ctx.createRadialGradient(width - 220, height - 260, 20, width - 220, height - 260, 780);
    radGlow2.addColorStop(0, hexToRgba(customAccent, 0.14));
    radGlow2.addColorStop(1, hexToRgba(customAccent, 0));
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, width, height);

    // --- 2. Outer Frame Border & Corner Accents ---
    ctx.strokeStyle = '#2a475e';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = customAccent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(36, 120);
    ctx.lineTo(36, 36);
    ctx.lineTo(120, 36);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 120, 36);
    ctx.lineTo(width - 36, 36);
    ctx.lineTo(width - 36, 120);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, height - 120);
    ctx.lineTo(36, height - 36);
    ctx.lineTo(120, height - 36);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 120, height - 36);
    ctx.lineTo(width - 36, height - 36);
    ctx.lineTo(width - 36, height - 120);
    ctx.stroke();

    // Helper: Rounded Rectangle
    const roundRect = (x: number, y: number, w: number, h: number, radius = 16) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Helper: Text truncation
    const truncateText = (text: string, maxWidth: number, font: string): string => {
      ctx.font = font;
      if (ctx.measureText(text).width <= maxWidth) return text;
      let truncated = text;
      while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + '...';
    };

    // Unified 6 Metrics Data (used in Story, Landscape, and Square)
    const unifiedMetrics = [
      {
        icon: 'Clock',
        label: t('ŁĄCZNY CZAS', 'TOTAL TIME'),
        val: `${summaryData.totalHours} h`,
        sub: t('Wszystkie media łącznie', 'All media combined'),
        color: '#66c0f4',
      },
      {
        icon: 'CheckCircle2',
        label: t('UKOŃCZONE DZIEŁA', 'COMPLETED'),
        val: `${summaryData.completedCount} / ${summaryData.totalCount}`,
        sub: t(`Skuteczność: ${summaryData.completionRate}%`, `Completion rate: ${summaryData.completionRate}%`),
        color: '#a4d007',
      },
      {
        icon: 'Star',
        label: t('ŚREDNIA OCENA', 'AVG RATING'),
        val: `${summaryData.avgRating} / ${ratingScale}`,
        sub: t(`Z ${summaryData.totalCount} ocenionych pozycji`, `From ${summaryData.totalCount} rated items`),
        color: '#f39c12',
      },
      {
        icon: 'Trophy',
        label: t('NAJWYŻSZA OCENA', 'HIGHEST RATING'),
        val: summaryData.maxRating > 0 ? `${summaryData.maxRating.toFixed(1)} / ${ratingScale} ★` : '—',
        sub:
          summaryData.topRatedTitles.length > 1
            ? t(`${summaryData.topRatedTitles.length} tytuły ex aequo`, `${summaryData.topRatedTitles.length} titles tied`)
            : summaryData.topRatedTitles[0]?.title || t('Brak danych', 'No data'),
        color: '#fbbf24',
      },
      {
        icon: 'BookOpen',
        label: t('PRZECZYTANE STRONY', 'PAGES READ'),
        val: `${summaryData.totalPages} ${t('str.', 'p.')}`,
        sub: t('Książki, komiksy i mangi', 'Books, comics & manga'),
        color: '#e0a96d',
      },
      {
        icon: 'Monitor',
        label: t('GŁÓWNY FORMAT', 'TOP PLATFORM'),
        val: trPlatform(summaryData.topPlatform.name),
        sub: t(
          `Spędzono: ${summaryData.topPlatform.hours} h (${summaryData.topPlatform.count} poz.)`,
          `Spent: ${summaryData.topPlatform.hours} h (${summaryData.topPlatform.count} items)`
        ),
        color: '#d48cf0',
      },
    ];

    // Shared Helper: Draw a Single Metric Card (identical style across all formats)
    const drawMetricCard = (cx: number, cy: number, colW: number, rowH: number, m: typeof unifiedMetrics[0]) => {
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#2a475e';
      ctx.lineWidth = 1.5;
      roundRect(cx, cy, colW, rowH, 16);
      ctx.fill();
      ctx.stroke();

      const isCompact = rowH < 105;
      const iconSize = isCompact ? 15 : 16;
      const labelY = cy + (isCompact ? 26 : 30);
      drawMediaTypeIconOnCanvas(ctx, m.icon, cx + 23, labelY - 5, iconSize, m.color, 2.2);

      ctx.fillStyle = '#8f98a0';
      ctx.font = `bold ${isCompact ? 13 : 14}px "Segoe UI", Inter, sans-serif`;
      ctx.fillText(truncateText(m.label, colW - 52, `bold ${isCompact ? 13 : 14}px "Segoe UI"`), cx + 36, labelY);

      ctx.fillStyle = m.color;
      ctx.font = `900 ${isCompact ? 26 : 30}px "Segoe UI", Inter, sans-serif`;
      ctx.fillText(
        truncateText(m.val, colW - 32, `900 ${isCompact ? 26 : 30}px "Segoe UI", Inter, sans-serif`),
        cx + 16,
        cy + (isCompact ? 61 : 70)
      );

      ctx.fillStyle = '#9aa5b1';
      ctx.font = `${isCompact ? 12 : 13}px "Segoe UI", Inter, sans-serif`;
      ctx.fillText(
        truncateText(m.sub, colW - 32, `${isCompact ? 12 : 13}px "Segoe UI", Inter, sans-serif`),
        cx + 16,
        cy + (isCompact ? 84 : 96)
      );
    };

    // Shared Helper: Draw a Category Award Card (identical rich vertical styling across all formats)
    const drawCategoryAwardCard = (
      ax: number,
      ay: number,
      awW: number,
      awH: number,
      aw: typeof summaryData.categoryAwards[0]
    ) => {
      const cfg = getMediaTypeConfig(aw.category, typeConfigs);
      const color = cfg.color;
      const border = hexToRgba(cfg.color, 0.55);

      // Card Box
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      roundRect(ax, ay, awW, awH, 18);
      ctx.fill();
      ctx.stroke();

      // Top Header Band inside Card (height 44px: ay+2 to ay+46)
      ctx.fillStyle = hexToRgba(color, 0.14);
      roundRect(ax + 2, ay + 2, awW - 4, 44, 16);
      ctx.fill();

      // Subtle separator line below header band
      ctx.strokeStyle = hexToRgba(color, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax + 12, ay + 46);
      ctx.lineTo(ax + awW - 12, ay + 46);
      ctx.stroke();

      // Draw Media Type Vector Icon in header
      drawMediaTypeIconOnCanvas(ctx, cfg.icon, ax + 27, ay + 24, 18, color, 2.2);

      ctx.fillStyle = color;
      ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
      const catDisplayName = trType(aw.category).toUpperCase();
      const cardTypeTitle =
        lang === 'en'
          ? `${catDisplayName} OF THE ${summaryPeriod === 'yearly' || summaryPeriod === 'release_year' ? 'YEAR' : 'MONTH'}`
          : `${catDisplayName} ${summaryPeriod === 'yearly' || summaryPeriod === 'release_year' ? 'ROKU' : 'MIESIĄCA'}`;
      ctx.fillText(truncateText(cardTypeTitle, awW - 228, 'bold 16px "Segoe UI"'), ax + 42, ay + 30);

      if (aw.winners.length > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
        const ratingText = `★ ${aw.maxRating.toFixed(1)}${aw.isExAequo ? ` [EX AEQUO x${aw.winners.length}]` : ''}`;
        const ratingW = ctx.measureText(ratingText).width;
        ctx.fillText(ratingText, ax + awW - ratingW - 18, ay + 30);

        if (aw.winners.length === 1) {
          const item = aw.winners[0];
          // Winner Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px "Segoe UI", Inter, sans-serif';
          ctx.fillText(truncateText(item.title, awW - 40, 'bold 24px "Segoe UI", Inter, sans-serif'), ax + 20, ay + 82);

          // Platform, Genre, Creator & Year
          ctx.fillStyle = '#9aa5b1';
          ctx.font = '15px "Segoe UI", Inter, sans-serif';
          const metaText = `${trPlatform(item.platform)} • ${trGenre(item.genre)}${item.creator ? ` • ${item.creator}` : ''}${item.year ? ` • ${item.year}` : ''}`;
          ctx.fillText(truncateText(metaText, awW - 40, '15px "Segoe UI", Inter, sans-serif'), ax + 20, ay + 112);

          // Hours & Pages Pill
          ctx.fillStyle = '#1b2838';
          ctx.strokeStyle = '#2a475e';
          ctx.lineWidth = 1;
          roundRect(ax + 20, ay + 126, awW - 40, 38, 10);
          ctx.fill();
          ctx.stroke();

          const hasH = item.hours_spent !== null && item.hours_spent !== undefined;
          const hasP = item.pages !== null && item.pages !== undefined && item.pages > 0;
          const pillIcon = hasP ? 'BookOpen' : hasH ? 'Clock' : cfg.icon;
          drawMediaTypeIconOnCanvas(ctx, pillIcon, ax + 37, ay + 145, 15, color, 2.2);

          ctx.fillStyle = '#c7d5e0';
          ctx.font = 'bold 14px "Segoe UI", Inter, sans-serif';
          let hText = '';
          if (hasP && hasH) {
            hText = t(
              `${item.pages} str.  •  ${item.hours_spent!.toFixed(1)} h  •  W kategorii: ${aw.itemsCount} poz.`,
              `${item.pages} p.  •  ${item.hours_spent!.toFixed(1)} h  •  In category: ${aw.itemsCount}`
            );
          } else if (hasP) {
            hText = t(
              `${item.pages} stron  •  W kategorii: ${aw.itemsCount} poz.`,
              `${item.pages} pages  •  In category: ${aw.itemsCount}`
            );
          } else if (hasH) {
            hText = t(
              `Czas: ${item.hours_spent!.toFixed(1)} h  •  W kategorii: ${aw.itemsCount} poz. (${aw.totalCategoryHours}h)`,
              `Time: ${item.hours_spent!.toFixed(1)} h  •  In category: ${aw.itemsCount} (${aw.totalCategoryHours}h)`
            );
          } else {
            hText = t(
              `W kategorii: ${aw.itemsCount} ocenionych pozycji`,
              `In category: ${aw.itemsCount} rated items`
            );
          }
          ctx.fillText(truncateText(hText, awW - 80, 'bold 14px "Segoe UI", Inter, sans-serif'), ax + 52, ay + 150);

          // Review Comment Quote
          if (item.comment) {
            ctx.fillStyle = '#c7d5e0';
            ctx.font = 'italic 14px "Segoe UI", Inter, sans-serif';
            const quote = `"${truncateText(item.comment, awW - 40, 'italic 14px "Segoe UI", Inter, sans-serif')}"`;
            ctx.fillText(quote, ax + 20, ay + 196);
          } else {
            ctx.fillStyle = '#67707b';
            ctx.font = 'italic 14px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Status: ${trStatus(item.status)} • Zapisano: ${item.date_logged || '—'}`,
                `Status: ${trStatus(item.status)} • Logged: ${item.date_logged || '—'}`
              ),
              ax + 20,
              ay + 196
            );
          }

          // Runner-up (#2) or Category Summary Footer
          ctx.strokeStyle = '#243547';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax + 20, ay + 225);
          ctx.lineTo(ax + awW - 20, ay + 225);
          ctx.stroke();

          if (aw.runnerUp) {
            drawMediaTypeIconOnCanvas(ctx, 'Award', ax + 28, ay + 245, 15, '#94a3b8', 2.2);
            ctx.fillStyle = '#8f98a0';
            ctx.font = 'bold 13px "Segoe UI", Inter, sans-serif';
            const runnerText = t(
              `2. miejsce: ${aw.runnerUp.title} (★ ${aw.runnerUp.rating.toFixed(1)})`,
              `Runner-up: ${aw.runnerUp.title} (★ ${aw.runnerUp.rating.toFixed(1)})`
            );
            ctx.fillText(truncateText(runnerText, awW - 60, 'bold 13px "Segoe UI", Inter, sans-serif'), ax + 40, ay + 250);
            ctx.fillStyle = '#67707b';
            ctx.font = '12px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Łącznie w kategorii ${trType(aw.category)}: ${aw.itemsCount} poz. (${aw.totalCategoryHours} h)`,
                `Total in ${trType(aw.category)}: ${aw.itemsCount} items (${aw.totalCategoryHours} h)`
              ),
              ax + 20,
              ay + 272
            );
          } else {
            drawMediaTypeIconOnCanvas(ctx, 'TrendingUp', ax + 28, ay + 253, 15, color, 2.2);
            ctx.fillStyle = color;
            ctx.font = 'bold 13px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Podsumowanie kategorii: ${aw.itemsCount} ${aw.itemsCount === 1 ? 'dzieło' : 'dzieła'} • ${aw.totalCategoryHours} h`,
                `Category total: ${aw.itemsCount} ${aw.itemsCount === 1 ? 'item' : 'items'} • ${aw.totalCategoryHours} h`
              ),
              ax + 40,
              ay + 258
            );
          }
        } else {
          // EX AEQUO: Up to 3 tied winners shown in properly aligned pill boxes
          const visibleWinners = aw.winners.slice(0, 3);
          const boxH = visibleWinners.length === 2 ? 64 : 52;
          const boxGap = visibleWinners.length === 2 ? 12 : 7;
          const startBoxY = ay + 56;

          visibleWinners.forEach((wItem, wIdx) => {
            const boxY = startBoxY + wIdx * (boxH + boxGap);

            // Pill Box Background & Border
            ctx.fillStyle = '#1b2838';
            ctx.strokeStyle = '#2a475e';
            ctx.lineWidth = 1.5;
            roundRect(ax + 16, boxY, awW - 32, boxH, 10);
            ctx.fill();
            ctx.stroke();

            // Left colored accent indicator inside each pill
            ctx.fillStyle = color;
            roundRect(ax + 16, boxY, 6, boxH, 3);
            ctx.fill();

            const titleOffsetY = visibleWinners.length === 2 ? 25 : 21;
            const metaOffsetY = visibleWinners.length === 2 ? 48 : 41;

            // Title inside pill box
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
            const wTitle = `#${wIdx + 1} ${truncateText(wItem.title, awW - 64, 'bold 16px "Segoe UI"')}`;
            ctx.fillText(wTitle, ax + 32, boxY + titleOffsetY);

            // Meta info inside pill box
            ctx.fillStyle = '#9aa5b1';
            ctx.font = '13px "Segoe UI", Inter, sans-serif';
            const wMeta = `${trPlatform(wItem.platform)} • ${trGenre(wItem.genre)}${wItem.creator ? ` • ${wItem.creator}` : ''}${wItem.hours_spent ? ` • ${wItem.hours_spent}h` : ''}${wItem.pages ? ` • ${wItem.pages} ${t('str.', 'p.')}` : ''}`;
            ctx.fillText(truncateText(wMeta, awW - 64, '13px "Segoe UI"'), ax + 32, boxY + metaOffsetY);
          });

          // Footer divider inside Ex Aequo card
          ctx.strokeStyle = '#243547';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax + 20, ay + 232);
          ctx.lineTo(ax + awW - 20, ay + 232);
          ctx.stroke();

          if (aw.winners.length > 3) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 13px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `+ ${aw.winners.length - 3} kolejne dzieła ex aequo z oceną ★ ${aw.maxRating.toFixed(1)}`,
                `+ ${aw.winners.length - 3} more tied items with ★ ${aw.maxRating.toFixed(1)}`
              ),
              ax + 20,
              ay + 254
            );
            ctx.fillStyle = '#8f98a0';
            ctx.font = '12px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Łącznie w kategorii ${trType(aw.category)}: ${aw.itemsCount} poz. (${aw.totalCategoryHours} h)`,
                `Total in ${trType(aw.category)}: ${aw.itemsCount} items (${aw.totalCategoryHours} h)`
              ),
              ax + 20,
              ay + 274
            );
          } else if (aw.runnerUp) {
            drawMediaTypeIconOnCanvas(ctx, 'Award', ax + 28, ay + 249, 15, '#94a3b8', 2.2);
            ctx.fillStyle = '#8f98a0';
            ctx.font = 'bold 13px "Segoe UI", Inter, sans-serif';
            const runnerText = t(
              `Kolejna ocena: ${aw.runnerUp.title} (★ ${aw.runnerUp.rating.toFixed(1)})`,
              `Next rating: ${aw.runnerUp.title} (★ ${aw.runnerUp.rating.toFixed(1)})`
            );
            ctx.fillText(truncateText(runnerText, awW - 60, 'bold 13px "Segoe UI"'), ax + 40, ay + 254);
            ctx.fillStyle = color;
            ctx.font = 'bold 12px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Łącznie w kategorii ${trType(aw.category)}: ${aw.itemsCount} poz. (${aw.totalCategoryHours} h)`,
                `Total in ${trType(aw.category)}: ${aw.itemsCount} items (${aw.totalCategoryHours} h)`
              ),
              ax + 20,
              ay + 274
            );
          } else {
            ctx.fillStyle = color;
            ctx.font = 'bold 13px "Segoe UI", Inter, sans-serif';
            ctx.fillText(
              t(
                `Łącznie w kategorii ${trType(aw.category)}: ${aw.itemsCount} poz. (${aw.totalCategoryHours} h)`,
                `Total in ${trType(aw.category)}: ${aw.itemsCount} items (${aw.totalCategoryHours} h)`
              ),
              ax + 20,
              ay + 264
            );
          }
        }
      } else {
        ctx.fillStyle = '#55677d';
        ctx.font = 'italic 17px "Segoe UI", Inter, sans-serif';
        ctx.fillText(
          t('Brak ocenionego tytułu w tej kategorii', 'No rated item in this category'),
          ax + 20,
          ay + 145
        );
      }
    };

    // Shared Helper: Draw Platform Card
    const drawPlatformCard = (
      px: number,
      py: number,
      platCardW: number,
      platCardH: number,
      p: { name: string; hours: number; count: number },
      idx: number,
      maxPlatH: number
    ) => {
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#2a475e';
      ctx.lineWidth = 1.5;
      roundRect(px, py, platCardW, platCardH, 14);
      ctx.fill();
      ctx.stroke();

      const pct = summaryData.totalHours > 0 ? Math.round((p.hours / summaryData.totalHours) * 100) : 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
      ctx.fillText(
        truncateText(`${idx + 1}. ${trPlatform(p.name)}`, platCardW - 150, 'bold 16px "Segoe UI"'),
        px + 16,
        py + 30
      );

      ctx.fillStyle = customAccent;
      ctx.font = 'bold 15px "Segoe UI", Inter, sans-serif';
      const pRight = `${p.hours.toFixed(1)} h (${pct}%)`;
      const pRightW = ctx.measureText(pRight).width;
      ctx.fillText(pRight, px + platCardW - pRightW - 16, py + 30);

      const barW = platCardW - 32;
      const fillW = Math.max((p.hours / maxPlatH) * barW, 24);
      ctx.fillStyle = '#0d131b';
      roundRect(px + 16, py + 46, barW, 16, 8);
      ctx.fill();

      const pGrad = ctx.createLinearGradient(px + 16, py + 46, px + 16 + fillW, py + 46);
      pGrad.addColorStop(0, '#2a475e');
      pGrad.addColorStop(1, customAccent);
      ctx.fillStyle = pGrad;
      roundRect(px + 16, py + 46, fillW, 16, 8);
      ctx.fill();
    };

    // Shared Helper: Draw Genre Row Card (with non-overlapping hours badge on the right)
    const drawGenreRowCard = (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      g: { name: string; hours: number; count: number },
      idx: number,
      maxGenreH: number,
      labelWidth = 235
    ) => {
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#243547';
      ctx.lineWidth = 1.5;
      roundRect(rx, ry, rw, rh, 12);
      ctx.fill();
      ctx.stroke();

      const textBaselineY = ry + Math.round(rh * 0.62);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", Inter, sans-serif';
      const itemLabel = t('poz.', 'it.');
      ctx.fillText(
        truncateText(`${idx + 1}. ${trGenre(g.name)} (${g.count} ${itemLabel})`, labelWidth - 15, 'bold 15px "Segoe UI"'),
        rx + 16,
        textBaselineY
      );

      const hoursBoxW = 116;
      const hoursBoxX = rx + rw - hoursBoxW - 14;
      const barStartX = rx + labelWidth + 10;
      const barMaxWidth = Math.max(hoursBoxX - barStartX - 14, 80);
      const barW = Math.max((g.hours / maxGenreH) * barMaxWidth, 30);
      const barY = ry + Math.round((rh - 18) / 2);

      // Bar background track
      ctx.fillStyle = '#0d131b';
      roundRect(barStartX, barY, barMaxWidth, 18, 9);
      ctx.fill();

      // Bar fill
      const grad = ctx.createLinearGradient(barStartX, barY, barStartX + barW, barY);
      grad.addColorStop(0, '#2a475e');
      grad.addColorStop(1, customAccent);
      ctx.fillStyle = grad;
      roundRect(barStartX, barY, barW, 18, 9);
      ctx.fill();

      // High-contrast badge box on the right for hours
      const badgeH = Math.min(rh - 12, 30);
      const badgeY = ry + Math.round((rh - badgeH) / 2);
      ctx.fillStyle = '#1b2838';
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 1;
      roundRect(hoursBoxX, badgeY, hoursBoxW, badgeH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", Inter, sans-serif';
      const gHoursText = `${g.hours.toFixed(1)} h`;
      const gHoursW = ctx.measureText(gHoursText).width;
      ctx.fillText(gHoursText, hoursBoxX + (hoursBoxW - gHoursW) / 2, badgeY + Math.round(badgeH * 0.68));
    };

    // Shared Header Texts (without emojis — drawn with vector icons via drawMediaTypeIconOnCanvas)
    const userTag = userName.trim() ? ` • ${userName.trim().toUpperCase()}` : '';
    const subHeader =
      summaryPeriod === 'yearly'
        ? t(`TWOJA PÓŁKA NA MEDIA${userTag} • PODSUMOWANIE ROCZNE`, `YOUR MEDIA SHELF${userTag} • ANNUAL SUMMARY`)
        : summaryPeriod === 'release_year'
        ? t(`TWOJA PÓŁKA NA MEDIA${userTag} • PODSUMOWANIE PREMIER ROKU`, `YOUR MEDIA SHELF${userTag} • RELEASE YEAR SUMMARY`)
        : t(`TWOJA PÓŁKA NA MEDIA${userTag} • PODSUMOWANIE MIESIĘCZNE`, `YOUR MEDIA SHELF${userTag} • MONTHLY SUMMARY`);

    const mainTitle =
      summaryPeriod === 'yearly'
        ? selectedYear === 'Wszystkie'
          ? t('PODSUMOWANIE BIBLIOTEKI', 'LIBRARY SUMMARY')
          : t(`PODSUMOWANIE ROKU ${selectedYear}`, `${selectedYear} YEAR IN REVIEW`)
        : summaryPeriod === 'release_year'
        ? selectedYear === 'Wszystkie'
          ? t('WSZYSTKIE PREMIERY', 'ALL RELEASES')
          : t(`PREMIERY ROKU ${selectedYear}`, `${selectedYear} RELEASES`)
        : `${selectedMonthObj.name.toUpperCase()} ${selectedYear}`;

    const topTitlesStr =
      summaryData.topRatedTitles.length > 0
        ? t(
            `Najwyższa ocena okresu (${summaryData.maxRating.toFixed(1)}/${ratingScale}): ${summaryData.topRatedTitles.map((it) => it.title).join(' • ')}`,
            `Highest rated in period (${summaryData.maxRating.toFixed(1)}/${ratingScale}): ${summaryData.topRatedTitles.map((it) => it.title).join(' • ')}`
          )
        : t(
            'Moje statystyki, ukończone dzieła, formaty i nagrody okresu',
            'My statistics, completed media, platforms, and period awards'
          );

    const periodAwardsLabel =
      summaryPeriod === 'yearly'
        ? t('DZIEŁA ROKU WG KATEGORII (TOP WYBORY)', 'WORKS OF THE YEAR BY CATEGORY (TOP PICKS)')
        : summaryPeriod === 'release_year'
        ? t('DZIEŁA Z ROKU WYJŚCIA WG KATEGORII (TOP WYBORY)', 'WORKS BY RELEASE YEAR (TOP PICKS)')
        : t('DZIEŁA MIESIĄCA WG KATEGORII (TOP WYBORY)', 'WORKS OF THE MONTH BY CATEGORY (TOP PICKS)');

    const platHeaderLabel = t('PODZIAŁ CZASU WG PLATFORMY / FORMATU', 'TIME BREAKDOWN BY PLATFORM / FORMAT');
    const genreHeaderLabel = t('NAJCHĘTNIEJ EKSPLOROWANE GATUNKI (TOP 5)', 'MOST EXPLORED GENRES (TOP 5)');

    if (aspectRatio === 'landscape') {
      // =========================================================================
      // FORMAT POZIOMY (16:9 — 1920x1080) — TA SAMA STYLISTYKA CO PIONOWY
      // =========================================================================
      const padX = 68;
      const contentW = width - padX * 2; // 1784px

      // 1. Header + Top-Rated Highlight Pill
      drawMediaTypeIconOnCanvas(ctx, 'Library', padX + 10, 75, 20, customAccent, 2.2);
      ctx.fillStyle = customAccent;
      ctx.font = 'bold 20px "Segoe UI", Inter, sans-serif';
      ctx.fillText(subHeader, padX + 28, 82);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px "Segoe UI", Inter, sans-serif';
      ctx.fillText(mainTitle, padX, 134);

      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 1.5;
      roundRect(padX, 148, contentW, 44, 12);
      ctx.fill();
      ctx.stroke();

      drawMediaTypeIconOnCanvas(ctx, 'Star', padX + 28, 170, 18, '#fbbf24', 2.2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 17px "Segoe UI", Inter, sans-serif';
      ctx.fillText(truncateText(topTitlesStr, contentW - 64, 'bold 17px "Segoe UI", Inter, sans-serif'), padX + 44, 176);

      // 2. 6 Metric Cards in 6x1 Row (y: 206 - 302)
      const gridStartY = 206;
      const gap = 16;
      const colW = (contentW - gap * 5) / 6; // ~284px
      const rowH = 96;

      unifiedMetrics.forEach((m, idx) => {
        const cx = padX + idx * (colW + gap);
        drawMetricCard(cx, gridStartY, colW, rowH, m);
      });

      // 3. Two-Column Main Body (y: 322 - 960)
      // Left Column: 4 Category Award Cards in 2x2 Grid (width: 964px)
      const leftColX = padX;
      const leftColW = 964;
      const awardsY = 344;

      drawMediaTypeIconOnCanvas(ctx, 'Trophy', leftColX + 11, awardsY - 8, 22, '#fbbf24', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px "Segoe UI", Inter, sans-serif';
      ctx.fillText(periodAwardsLabel, leftColX + 30, awardsY);

      const awW = (leftColW - 20) / 2; // 472px
      const awH = 290;

      summaryData.categoryAwards.forEach((aw, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const ax = leftColX + col * (awW + 20);
        const ay = awardsY + 18 + row * (awH + 18);
        drawCategoryAwardCard(ax, ay, awW, awH, aw);
      });

      // Right Column: Platforms (Top 4 in 2x2) + Genres (Top 5) (x: 1058, width: 794px)
      const rightColX = leftColX + leftColW + 26;
      const rightColW = width - padX - rightColX; // 794px

      // 4. Platforms Section (Top of Right Column)
      drawMediaTypeIconOnCanvas(ctx, 'Monitor', rightColX + 11, awardsY - 8, 22, customAccent, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px "Segoe UI", Inter, sans-serif';
      ctx.fillText(platHeaderLabel, rightColX + 30, awardsY);

      const platCardW = (rightColW - 18) / 2; // 388px
      const platCardH = 82;
      const maxPlatH = summaryData.topPlatforms[0]?.hours || 1;

      if (summaryData.topPlatforms.length === 0) {
        ctx.fillStyle = '#67707b';
        ctx.font = 'italic 16px "Segoe UI", Inter, sans-serif';
        ctx.fillText(t('Brak danych o platformach w wybranym okresie', 'No platform data in selected period'), rightColX, awardsY + 45);
      } else {
        summaryData.topPlatforms.slice(0, 4).forEach((p, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const px = rightColX + col * (platCardW + 18);
          const py = awardsY + 18 + row * (platCardH + 14);
          drawPlatformCard(px, py, platCardW, platCardH, p, idx, maxPlatH);
        });
      }

      // 5. Genres Section (Bottom of Right Column)
      const genresStartY = 588;
      drawMediaTypeIconOnCanvas(ctx, 'TrendingUp', rightColX + 11, genresStartY - 8, 22, '#a4d007', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px "Segoe UI", Inter, sans-serif';
      ctx.fillText(genreHeaderLabel, rightColX + 30, genresStartY);

      const maxGenreH = summaryData.topGenres[0]?.hours || 1;
      summaryData.topGenres.slice(0, 5).forEach((g, idx) => {
        const gy = genresStartY + 18 + idx * 70;
        drawGenreRowCard(rightColX, gy, rightColW, 56, g, idx, maxGenreH, 230);
      });
    } else if (aspectRatio === 'square') {
      // =========================================================================
      // FORMAT KWADRATOWY (1:1 — 1440x1440) — TA SAMA STYLISTYKA CO PIONOWY
      // =========================================================================
      const padX = 68;
      const contentW = width - padX * 2; // 1304px

      // 1. Header + Top-Rated Highlight Pill
      drawMediaTypeIconOnCanvas(ctx, 'Library', padX + 10, 81, 20, customAccent, 2.2);
      ctx.fillStyle = customAccent;
      ctx.font = 'bold 21px "Segoe UI", Inter, sans-serif';
      ctx.fillText(subHeader, padX + 28, 88);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 50px "Segoe UI", Inter, sans-serif';
      ctx.fillText(mainTitle, padX, 146);

      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 1.5;
      roundRect(padX, 166, contentW, 46, 12);
      ctx.fill();
      ctx.stroke();

      drawMediaTypeIconOnCanvas(ctx, 'Star', padX + 28, 189, 18, '#fbbf24', 2.2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 17px "Segoe UI", Inter, sans-serif';
      ctx.fillText(truncateText(topTitlesStr, contentW - 64, 'bold 17px "Segoe UI", Inter, sans-serif'), padX + 44, 195);

      // 2. 6 Metric Cards in 3x2 Grid (y: 230 - 442)
      const gridStartY = 230;
      const gap = 16;
      const colW = (contentW - gap * 2) / 3; // 424px
      const rowH = 98;

      unifiedMetrics.forEach((m, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = padX + col * (colW + gap);
        const cy = gridStartY + row * (rowH + gap);
        drawMetricCard(cx, cy, colW, rowH, m);
      });

      // 3. 4 Category Award Cards in 2x2 Grid (y: 472 - 1090)
      const awardsY = 472;
      drawMediaTypeIconOnCanvas(ctx, 'Trophy', padX + 12, awardsY - 8, 22, '#fbbf24', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Segoe UI", Inter, sans-serif';
      ctx.fillText(periodAwardsLabel, padX + 32, awardsY);

      const awW = (contentW - 24) / 2; // 640px
      const awH = 290;

      summaryData.categoryAwards.forEach((aw, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const ax = padX + col * (awW + 24);
        const ay = awardsY + 18 + row * (awH + 18);
        drawCategoryAwardCard(ax, ay, awW, awH, aw);
      });

      // 4 & 5. Bottom Two-Column Split: Platforms (Left) + Genres (Right) (y: 1126 - 1345)
      const bottomY = 1128;
      const halfW = (contentW - 24) / 2; // 640px

      // Left: Platforms (2x2)
      drawMediaTypeIconOnCanvas(ctx, 'Monitor', padX + 10, bottomY - 7, 20, customAccent, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px "Segoe UI", Inter, sans-serif';
      ctx.fillText(platHeaderLabel, padX + 28, bottomY);

      const platCardW = (halfW - 16) / 2; // 312px
      const platCardH = 82;
      const maxPlatH = summaryData.topPlatforms[0]?.hours || 1;

      summaryData.topPlatforms.slice(0, 4).forEach((p, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const px = padX + col * (platCardW + 16);
        const py = bottomY + 16 + row * (platCardH + 14);
        drawPlatformCard(px, py, platCardW, platCardH, p, idx, maxPlatH);
      });

      // Right: Genres (Top 4)
      const rightX = padX + halfW + 24;
      drawMediaTypeIconOnCanvas(ctx, 'TrendingUp', rightX + 10, bottomY - 7, 20, '#a4d007', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px "Segoe UI", Inter, sans-serif';
      ctx.fillText(t('NAJCHĘTNIEJ EKSPLOROWANE GATUNKI', 'MOST EXPLORED GENRES'), rightX + 28, bottomY);

      const maxGenreH = summaryData.topGenres[0]?.hours || 1;
      summaryData.topGenres.slice(0, 4).forEach((g, idx) => {
        const gy = bottomY + 16 + idx * 46;
        drawGenreRowCard(rightX, gy, halfW, 40, g, idx, maxGenreH, 210);
      });
    } else {
      // =========================================================================
      // FORMAT PIONOWY STORY (9:16 — 1080x1920)
      // =========================================================================
      // 1. Header Section (y: 80 - 235)
      drawMediaTypeIconOnCanvas(ctx, 'Library', 72 + 11, 88, 22, customAccent, 2.2);
      ctx.fillStyle = customAccent;
      ctx.font = 'bold 22px "Segoe UI", Inter, sans-serif';
      ctx.fillText(subHeader, 72 + 30, 96);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px "Segoe UI", Inter, sans-serif';
      ctx.fillText(mainTitle, 72, 162);

      // Top-rated highlight pill bar under title
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 1.5;
      roundRect(72, 185, width - 144, 52, 14);
      ctx.fill();
      ctx.stroke();

      drawMediaTypeIconOnCanvas(ctx, 'Star', 98, 211, 18, '#fbbf24', 2.2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px "Segoe UI", Inter, sans-serif';
      ctx.fillText(truncateText(topTitlesStr, width - 208, 'bold 18px "Segoe UI", Inter, sans-serif'), 116, 218);

      // 2. 6 Metric Cards in 3x2 Grid (y: 260 - 500)
      const gridStartY = 260;
      const colW = (width - 144 - 36) / 3; // 296px
      const rowH = 112;
      const gap = 18;

      unifiedMetrics.forEach((m, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = 72 + col * (colW + gap);
        const cy = gridStartY + row * (rowH + gap);
        drawMetricCard(cx, cy, colW, rowH, m);
      });

      // 3. Dzieła Okresu — 4 Duże Karty Nagród (y: 535 - 1185)
      const awardsY = 540;
      drawMediaTypeIconOnCanvas(ctx, 'Trophy', 72 + 12, awardsY - 9, 24, '#fbbf24', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Segoe UI", Inter, sans-serif';
      ctx.fillText(periodAwardsLabel, 72 + 32, awardsY);

      const awW = (width - 144 - 24) / 2; // 456px
      const awH = 290;

      summaryData.categoryAwards.forEach((aw, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const ax = 72 + col * (awW + 24);
        const ay = awardsY + 22 + row * (awH + 22);
        drawCategoryAwardCard(ax, ay, awW, awH, aw);
      });

      // 4. Podział czasu wg Platformy / Formatu (TOP 4 w układzie 2x2) (y: 1215 - 1445)
      const platSectionY = 1220;
      drawMediaTypeIconOnCanvas(ctx, 'Monitor', 72 + 12, platSectionY - 8, 22, customAccent, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Segoe UI", Inter, sans-serif';
      ctx.fillText(platHeaderLabel, 72 + 32, platSectionY);

      const platCardW = (width - 144 - 24) / 2;
      const platCardH = 82;
      const maxPlatH = summaryData.topPlatforms[0]?.hours || 1;

      if (summaryData.topPlatforms.length === 0) {
        ctx.fillStyle = '#67707b';
        ctx.font = 'italic 16px "Segoe UI", Inter, sans-serif';
        ctx.fillText(t('Brak danych o platformach w wybranym okresie', 'No platform data in selected period'), 72, platSectionY + 45);
      } else {
        summaryData.topPlatforms.slice(0, 4).forEach((p, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const px = 72 + col * (platCardW + 24);
          const py = platSectionY + 20 + row * (platCardH + 16);
          drawPlatformCard(px, py, platCardW, platCardH, p, idx, maxPlatH);
        });
      }

      // 5. Najchętniej eksplorowane Gatunki (TOP 5) (y: 1475 - 1805)
      const genresStartY = 1480;
      drawMediaTypeIconOnCanvas(ctx, 'TrendingUp', 72 + 12, genresStartY - 8, 22, '#a4d007', 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Segoe UI", Inter, sans-serif';
      ctx.fillText(genreHeaderLabel, 72 + 32, genresStartY);

      const maxGenreH = summaryData.topGenres[0]?.hours || 1;
      summaryData.topGenres.slice(0, 5).forEach((g, idx) => {
        const gy = genresStartY + 22 + idx * 58;
        drawGenreRowCard(72, gy, width - 144, 46, g, idx, maxGenreH, 255);
      });
    }

    // --- 7. Footer Stamp ---
    const footerY = height - 55;
    const footerPadX = aspectRatio === 'story' ? 72 : 68;

    ctx.fillStyle = customAccent;
    ctx.font = 'bold 15px "Segoe UI", Inter, sans-serif';
    const stampText = userName.trim()
      ? t(`${userName.trim()} • #ShelfMedia #Podsumowanie`, `${userName.trim()} • #ShelfMedia #Summary`)
      : t('#TwojaPółkaNaMedia #ShelfMedia #Podsumowanie', '#YourMediaShelf #ShelfMedia #Summary');
    const stampW = ctx.measureText(stampText).width;
    const stampX = width - footerPadX - stampW;
    drawMediaTypeIconOnCanvas(ctx, 'Library', stampX - 14, footerY - 5, 16, customAccent, 2.2);
    ctx.fillText(stampText, stampX, footerY);

  }, [
    isOpen,
    summaryPeriod,
    selectedYear,
    selectedMonth,
    selectedMonthObj,
    aspectRatio,
    summaryData,
    customStart,
    customMid,
    customEnd,
    customAccent,
    gradientDirection,
    typeConfigs,
    ratingScale,
    userName,
    lang,
  ]);

  if (!isOpen) return null;

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    const periodLabel = summaryPeriod === 'yearly' ? selectedYear : `${selectedYear}_${selectedMonth}`;
    link.download = `shelfmedia_podsumowanie_${periodLabel}_${aspectRatio}.png`;
    link.click();
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    } catch {
      alert(
        t(
          'Kopiowanie do schowka nie jest w pełni wspierane w tej przeglądarce. Skorzystaj z przycisku "Pobierz grafikę (PNG)"!',
          'Clipboard copy is not fully supported in this browser. Please use the "Download Image (PNG)" button!'
        )
      );
    }
  };

  const dimensionsLabel =
    aspectRatio === 'landscape'
      ? '1920x1080 px (16:9)'
      : aspectRatio === 'square'
      ? '1440x1440 px (1:1)'
      : '1080x1920 px (9:16)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#1b2838] border border-[#2a475e] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#66c0f4]/20 text-[#66c0f4]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                {t('Eksport podsumowania na Social Media', 'Export Social Media Summary Graphic')}
                <span className="text-xs bg-[#66c0f4]/20 text-[#66c0f4] px-2 py-0.5 rounded border border-[#66c0f4]/40 font-mono">
                  {summaryPeriod === 'yearly'
                    ? t('Podsumowanie Roczne', 'Annual Summary')
                    : t('Podsumowanie Miesięczne', 'Monthly Summary')}
                </span>
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Pobierz stylową grafikę ze statystykami i Dziełami Roku lub Miesiąca',
                  'Download a stylish graphic with your statistics and Works of the Year or Month'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8f98a0] hover:text-white p-1 rounded-lg hover:bg-[#2a475e]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector Tabs: Roczne vs Rok wyjścia vs Miesięczne */}
        <div className="bg-[#141b24] px-6 py-2.5 border-b border-[#243547] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8f98a0] font-semibold">
              {t('Tryb podsumowania:', 'Summary mode:')}
            </span>
            <div className="flex flex-wrap items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e] gap-1">
              <button
                onClick={() => setSummaryPeriod('yearly')}
                className={`px-3 py-1 text-xs rounded font-bold transition-all cursor-pointer ${
                  summaryPeriod === 'yearly'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Roczne (Ukończenie)', 'Yearly (Completed)')}
              </button>
              <button
                onClick={() => {
                  setSummaryPeriod('release_year');
                  if (availableReleaseYears.length > 0) setSelectedYear(availableReleaseYears[0]);
                }}
                className={`px-3 py-1 text-xs rounded font-bold transition-all cursor-pointer ${
                  summaryPeriod === 'release_year'
                    ? 'bg-[#a4d007] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Rok wyjścia dzieła', 'Release Year')}
              </button>
              <button
                onClick={() => setSummaryPeriod('monthly')}
                className={`px-3 py-1 text-xs rounded font-bold transition-all cursor-pointer ${
                  summaryPeriod === 'monthly'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Miesięczne', 'Monthly')}
              </button>
            </div>
          </div>

          {/* Aspect ratio selector: Poziomy (16:9), Pionowy (9:16), Kwadrat (1:1) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8f98a0] font-semibold">
              {t('Format grafiki:', 'Graphic format:')}
            </span>
            <div className="flex items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
              <button
                onClick={() => setAspectRatio('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-bold transition-colors cursor-pointer ${
                  aspectRatio === 'landscape'
                    ? 'bg-[#a4d007] text-[#171a21]'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                {t('Poziomy (16:9)', 'Horizontal (16:9)')}
              </button>
              <button
                onClick={() => setAspectRatio('story')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-bold transition-colors cursor-pointer ${
                  aspectRatio === 'story'
                    ? 'bg-[#a4d007] text-[#171a21]'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                {t('Pionowy (9:16)', 'Vertical (9:16)')}
              </button>
              <button
                onClick={() => setAspectRatio('square')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded font-bold transition-colors cursor-pointer ${
                  aspectRatio === 'square'
                    ? 'bg-[#a4d007] text-[#171a21]'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                {t('Kwadrat (1:1)', 'Square (1:1)')}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Filters (Year / Month) */}
        <div className="bg-[#171a21]/80 px-6 py-2.5 border-b border-[#243547] flex flex-wrap items-center justify-between gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#66c0f4]" />
            <span className="text-xs text-[#8f98a0] font-semibold">
              {summaryPeriod === 'release_year' ? t('Rok wyjścia:', 'Release year:') : t('Rok:', 'Year:')}
            </span>
            <div className="flex flex-wrap items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e] gap-1">
              {(summaryPeriod === 'yearly' || summaryPeriod === 'release_year') && (
                <button
                  onClick={() => setSelectedYear('Wszystkie')}
                  className={`px-2.5 py-0.5 text-xs rounded font-bold transition-colors cursor-pointer ${
                    selectedYear === 'Wszystkie'
                      ? 'bg-[#66c0f4] text-[#171a21]'
                      : 'text-[#8f98a0] hover:text-white'
                  }`}
                >
                  {t('Wszystkie lata', 'All years')}
                </button>
              )}
              {activeYearsList.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-0.5 text-xs rounded font-bold transition-colors cursor-pointer ${
                    selectedYear === yr
                      ? summaryPeriod === 'release_year'
                        ? 'bg-[#a4d007] text-[#171a21]'
                        : 'bg-[#66c0f4] text-[#171a21]'
                      : 'text-[#8f98a0] hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Month selector (only visible when summaryPeriod === 'monthly') */}
          {summaryPeriod === 'monthly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8f98a0] font-semibold">{t('Miesiąc:', 'Month:')}</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-[#171a21] text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2a475e] focus:outline-none focus:border-[#66c0f4]"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Toolbar: Category Selector (up to 4 categories on the card — synced with Library icons/colors) */}
        <div className="bg-[#141b24] px-6 py-2 border-b border-[#243547] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-bold">
              {t(`Kategorie na grafice (${selectedSummaryCategories.length}/4):`, `Categories on graphic (${selectedSummaryCategories.length}/4):`)}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {allAvailableTypes.map((cat) => {
                const isSelected = selectedSummaryCategories.includes(cat);
                const cfg = getMediaTypeConfig(cat, typeConfigs);
                const CatIcon = getMediaTypeIcon(cfg.icon);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#2a475e] text-white border-[#66c0f4] shadow-sm'
                        : 'bg-[#1b2838] text-[#8f98a0] hover:text-white border-transparent'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                    <span>{trType(cat)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <span className="text-[11px] text-[#8f98a0]">
            {t('Wybierz do 4 mediów (ikony zsynchronizowane z Biblioteką)', 'Select up to 4 media types (icons synced with Library)')}
          </span>
        </div>

        {/* Toolbar: Gradient & Background Customizer */}
        <div className="bg-[#101721] px-6 py-2.5 border-b border-[#243547] flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#66c0f4]" />
                {t('Gradient tła grafiki:', 'Background gradient:')}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {GRADIENT_PRESETS.map((p) => {
                  const isActive = selectedPresetId === p.id;
                  const displayName = lang === 'en' && p.nameEn ? p.nameEn : p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#2a475e] text-white border border-[#66c0f4] shadow'
                          : 'bg-[#171a21] text-[#8f98a0] hover:text-white border border-[#2a475e]/40'
                      }`}
                      title={displayName}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})`,
                        }}
                      />
                      <span>{displayName}</span>
                    </button>
                  );
                })}

                {/* Saved User Gradients */}
                {savedGradients.length > 0 && (
                  <>
                    <span className="text-[#2a475e] font-bold">|</span>
                    {savedGradients.map((p) => {
                      const isActive = selectedPresetId === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center rounded-lg text-xs font-semibold transition-all border ${
                            isActive
                              ? 'bg-[#2a475e] text-white border-[#a4d007] shadow'
                              : 'bg-[#171a21] text-[#8f98a0] hover:text-white border-[#2a475e]/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            className="flex items-center gap-1.5 px-2.5 py-1 cursor-pointer"
                            title={t(`Własny gradient: ${p.name}`, `Custom gradient: ${p.name}`)}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})`,
                              }}
                            />
                            <span>{p.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedGradient(p.id, e)}
                            className="pr-1.5 text-[#8f98a0] hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                            title={t('Usuń ten zapisany gradient', 'Delete this saved gradient')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowColorPickers(!showColorPickers)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-bold transition-all border cursor-pointer ${
                showColorPickers || selectedPresetId === 'custom'
                  ? 'bg-[#66c0f4]/20 text-[#66c0f4] border-[#66c0f4]'
                  : 'bg-[#171a21] text-[#8f98a0] hover:text-white border-[#2a475e]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {showColorPickers
                  ? t('Ukryj próbnik kolorów', 'Hide color pickers')
                  : t('Własny gradient / kolory', 'Custom gradient / colors')}
              </span>
            </button>
          </div>

          {/* Detailed custom color pickers, direction selector and Save Gradient Form */}
          {showColorPickers && (
            <div className="bg-[#171a21] p-3.5 rounded-lg border border-[#2a475e] flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[#8f98a0]">{t('Start:', 'Start:')}</span>
                    <input
                      type="color"
                      value={customStart}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setCustomStart(e.target.value);
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-[#c7d5e0]">{customStart}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[#8f98a0]">{t('Środek:', 'Middle:')}</span>
                    <input
                      type="color"
                      value={customMid}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setCustomMid(e.target.value);
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-[#c7d5e0]">{customMid}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[#8f98a0]">{t('Koniec:', 'End:')}</span>
                    <input
                      type="color"
                      value={customEnd}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setCustomEnd(e.target.value);
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-[#c7d5e0]">{customEnd}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[#8f98a0]">{t('Akcent & Poświata:', 'Accent & Glow:')}</span>
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => {
                        setSelectedPresetId('custom');
                        setCustomAccent(e.target.value);
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-[#c7d5e0]">{customAccent}</span>
                  </label>
                </div>

                {/* Direction selector */}
                <div className="flex items-center gap-1.5 bg-[#141b24] p-1 rounded-lg border border-[#2a475e]">
                  <span className="text-[11px] text-[#8f98a0] px-1">{t('Układ:', 'Direction:')}</span>
                  <button
                    type="button"
                    onClick={() => setGradientDirection('diagonal')}
                    className={`px-2 py-0.5 text-xs rounded font-medium transition-colors cursor-pointer ${
                      gradientDirection === 'diagonal'
                        ? 'bg-[#66c0f4] text-[#171a21] font-bold'
                        : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Przekątna', 'Diagonal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradientDirection('vertical')}
                    className={`px-2 py-0.5 text-xs rounded font-medium transition-colors cursor-pointer ${
                      gradientDirection === 'vertical'
                        ? 'bg-[#66c0f4] text-[#171a21] font-bold'
                        : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Pionowy', 'Vertical')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradientDirection('radial')}
                    className={`px-2 py-0.5 text-xs rounded font-medium transition-colors cursor-pointer ${
                      gradientDirection === 'radial'
                        ? 'bg-[#66c0f4] text-[#171a21] font-bold'
                        : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Promienisty', 'Radial')}
                  </button>
                </div>
              </div>

              {/* Save current gradient section */}
              <div className="pt-2.5 border-t border-[#243547] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <BookmarkPlus className="w-4 h-4 text-[#a4d007] shrink-0" />
                  <input
                    type="text"
                    value={newGradientName}
                    onChange={(e) => setNewGradientName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomGradient()}
                    placeholder={t('Wpisz nazwę własnego gradientu (np. Mój Zmierzch)...', 'Enter custom gradient name (e.g. My Dusk)...')}
                    className="flex-1 bg-[#141b24] text-xs text-white px-3 py-1.5 rounded-lg border border-[#2a475e] focus:outline-none focus:border-[#a4d007] placeholder:text-[#8f98a0]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomGradient}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('Zapisz gradient', 'Save gradient')}</span>
                  </button>
                </div>

                {savedFeedback && (
                  <span className="text-xs text-[#a4d007] font-semibold animate-in fade-in flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {savedFeedback}
                  </span>
                )}

                <div className="text-[11px] text-[#8f98a0]">
                  {t(
                    `Zapisane gradienty trafiają do stałej palety na górze (${savedGradients.length} zapisanych).`,
                    `Saved gradients are added to the palette bar above (${savedGradients.length} saved).`
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Canvas Preview */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#0d131b]">
          <div className="relative shadow-2xl rounded-xl overflow-hidden border border-[#2a475e]/60 max-w-full">
            <canvas
              ref={canvasRef}
              className="max-h-[50vh] w-auto object-contain block"
            />
          </div>
          <p className="text-xs text-[#8f98a0] mt-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#66c0f4]" />
            {t('Wygenerowano dla:', 'Generated for:')}{' '}
            <strong className="text-white">
              {summaryPeriod === 'yearly'
                ? selectedYear === 'Wszystkie'
                  ? t('Wszystkich lat', 'All years')
                  : t(`Rocznika ${selectedYear}`, `Year ${selectedYear}`)
                : `${selectedMonthObj.name} ${selectedYear}`}
            </strong>{' '}
            ({summaryData.totalCount} {t('pozycji', 'items')}, {summaryData.totalHours} h).
          </p>
        </div>

        {/* Footer actions */}
        <div className="bg-[#171a21] px-6 py-4 border-t border-[#2a475e] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8f98a0]">
            {t('Wymiary:', 'Dimensions:')}{' '}
            <strong className="text-white">PNG {dimensionsLabel}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2a475e] hover:bg-[#385c7c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">{t('Skopiowano!', 'Copied!')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#66c0f4]" />
                  {t('Kopiuj obrazek', 'Copy Image')}
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#a4d007] to-[#79a313] hover:from-[#b5e608] hover:to-[#8dbf16] text-[#171a21] text-xs font-black rounded-lg shadow-lg hover:shadow-[#a4d007]/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              {t('Pobierz grafikę (PNG)', 'Download Image (PNG)')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

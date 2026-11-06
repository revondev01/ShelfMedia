import React, { useState, useMemo, useEffect } from 'react';
import { MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, RatingScale } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Trophy, 
  Calendar, 
  Share2, 
  Layers 
} from 'lucide-react';
import { getMediaTypeConfig, getMediaTypeIcon, hexToRgba } from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface StatsTabProps {
  items: MediaItem[];
  availableTypes?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  ratingScale?: RatingScale;
  userName?: string;
  onOpenSocialModal?: () => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({ 
  items, 
  availableTypes, 
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  ratingScale = 10,
  userName = '',
  onOpenSocialModal 
}) => {
  const { lang, t, trType, trPlatform, trGenre, months } = useLanguage();

  // Top-level Stats Scope Filter (All vs Release Year vs Completion Year + Media Type)
  const [statsYearMode, setStatsYearMode] = useState<'all' | 'release' | 'completion'>('all');
  const [statsSelectedYear, setStatsSelectedYear] = useState<string>('Wszystkie');
  const [statsSelectedType, setStatsSelectedType] = useState<string>('Wszystkie');

  const [periodType, setPeriodType] = useState<'yearly' | 'release_year' | 'monthly'>('yearly');
  const [activeYearFilter, setActiveYearFilter] = useState<string>('2026');
  const [activeReleaseYearFilter, setActiveReleaseYearFilter] = useState<string>('2026');
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>('10');

  // Independent filters for charts (Year Mode + Year + Month)
  const [platformYearMode, setPlatformYearMode] = useState<'completion' | 'release'>('completion');
  const [platformYearFilter, setPlatformYearFilter] = useState<string>('Wszystkie');
  const [platformMonthFilter, setPlatformMonthFilter] = useState<string>('Wszystkie');

  const [genreYearMode, setGenreYearMode] = useState<'completion' | 'release'>('completion');
  const [genreTypeFilter, setGenreTypeFilter] = useState<string>('Wszystkie');
  const [genreYearFilter, setGenreYearFilter] = useState<string>('Wszystkie');
  const [genreMonthFilter, setGenreMonthFilter] = useState<string>('Wszystkie');

  // 1. Distinct completion years list - appears when there is a completed item with date_logged
  const distinctYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      const isCompleted = i.status === 'Ukończone';
      if (isCompleted && i.date_logged && i.date_logged.length >= 4) {
        const y = i.date_logged.substring(0, 4);
        if (/^\d{4}$/.test(y)) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // 2. Distinct release years list (rok wyjścia / wydania dzieła, np. 2026)
  const distinctReleaseYears = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.year && i.year > 0) {
        set.add(String(i.year));
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  // Keep activeYearFilter, activeReleaseYearFilter, platformYearFilter and genreYearFilter synchronized
  useEffect(() => {
    if (distinctYears.length > 0) {
      if (!distinctYears.includes(activeYearFilter)) {
        setActiveYearFilter(distinctYears[0]);
      }
      if (platformYearMode === 'completion' && (platformYearFilter === 'Wszystkie' || !distinctYears.includes(platformYearFilter))) {
        setPlatformYearFilter(distinctYears[0]);
      }
      if (genreYearMode === 'completion' && (genreYearFilter === 'Wszystkie' || !distinctYears.includes(genreYearFilter))) {
        setGenreYearFilter(distinctYears[0]);
      }
    }
  }, [distinctYears]);

  useEffect(() => {
    if (distinctReleaseYears.length > 0) {
      if (!distinctReleaseYears.includes(activeReleaseYearFilter)) {
        setActiveReleaseYearFilter(distinctReleaseYears[0]);
      }
    }
  }, [distinctReleaseYears]);

  // Helper to select a release year or completion year from the top stats tabs and sync sections
  const handleSelectTopStatsYear = (mode: 'all' | 'release' | 'completion', yr: string) => {
    setStatsYearMode(mode);
    setStatsSelectedYear(yr);

    if (mode === 'release' && yr !== 'Wszystkie') {
      setPeriodType('release_year');
      setActiveReleaseYearFilter(yr);
      setPlatformYearMode('release');
      setPlatformYearFilter(yr);
      setPlatformMonthFilter('Wszystkie');
      setGenreYearMode('release');
      setGenreYearFilter(yr);
      setGenreMonthFilter('Wszystkie');
    } else if (mode === 'completion' && yr !== 'Wszystkie') {
      setPeriodType('yearly');
      setActiveYearFilter(yr);
      setPlatformYearMode('completion');
      setPlatformYearFilter(yr);
      setGenreYearMode('completion');
      setGenreYearFilter(yr);
    } else if (mode === 'all') {
      setStatsSelectedType('Wszystkie');
    }
  };

  // Available months for Platform chart based on selected platformYearFilter
  const platformAvailableMonths = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const y = platformYearMode === 'release'
        ? (i.year && i.year > 0 ? String(i.year) : '')
        : (i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || ''));
      if (platformYearFilter !== 'Wszystkie' && y !== platformYearFilter) return;
      if (i.date_logged && i.date_logged.length >= 7) {
        const m = i.date_logged.substring(5, 7);
        if (/^\d{2}$/.test(m)) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    });
    const monthsWithItems = months.filter((m) => counts[m.id] > 0).map((m) => ({
      ...m,
      count: counts[m.id] || 0,
    }));
    return monthsWithItems.length > 0 ? monthsWithItems : months.map((m) => ({ ...m, count: 0 }));
  }, [items, platformYearFilter, platformYearMode, months]);

  useEffect(() => {
    if (platformMonthFilter !== 'Wszystkie' && !platformAvailableMonths.some((m) => m.id === platformMonthFilter)) {
      setPlatformMonthFilter('Wszystkie');
    }
  }, [platformAvailableMonths, platformMonthFilter]);

  // Available months for Genre chart based on selected genreYearFilter and genreTypeFilter
  const genreAvailableMonths = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const matchesType = genreTypeFilter === 'Wszystkie' || i.item_type === genreTypeFilter;
      if (!matchesType) return;
      const y = genreYearMode === 'release'
        ? (i.year && i.year > 0 ? String(i.year) : '')
        : (i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || ''));
      if (genreYearFilter !== 'Wszystkie' && y !== genreYearFilter) return;
      if (i.date_logged && i.date_logged.length >= 7) {
        const m = i.date_logged.substring(5, 7);
        if (/^\d{2}$/.test(m)) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    });
    const monthsWithItems = months.filter((m) => counts[m.id] > 0).map((m) => ({
      ...m,
      count: counts[m.id] || 0,
    }));
    return monthsWithItems.length > 0 ? monthsWithItems : months.map((m) => ({ ...m, count: 0 }));
  }, [items, genreYearFilter, genreYearMode, genreTypeFilter, months]);

  useEffect(() => {
    if (genreMonthFilter !== 'Wszystkie' && !genreAvailableMonths.some((m) => m.id === genreMonthFilter)) {
      setGenreMonthFilter('Wszystkie');
    }
  }, [genreAvailableMonths, genreMonthFilter]);

  // Dynamic available categories for summary selection
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

  // User-selected up to 4 categories for Podsumowanie
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

  const handleToggleSummaryCategory = (cat: string) => {
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

  // Items matching the top-level Stats Year filter (before type filter, for type count badges)
  const scopedItemsBeforeType = useMemo(() => {
    if (statsYearMode === 'all' || statsSelectedYear === 'Wszystkie') {
      return items;
    }
    return items.filter((i) => {
      if (statsYearMode === 'release') {
        return i.year && i.year > 0 ? String(i.year) === statsSelectedYear : false;
      } else {
        const y = i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || '');
        return y === statsSelectedYear;
      }
    });
  }, [items, statsYearMode, statsSelectedYear]);

  // Final scoped items for top metric cards & release year preview list
  const scopedStatsItems = useMemo(() => {
    if (statsSelectedType === 'Wszystkie') return scopedItemsBeforeType;
    return scopedItemsBeforeType.filter((i) => i.item_type === statsSelectedType);
  }, [scopedItemsBeforeType, statsSelectedType]);

  const stats = useMemo(() => {
    const sourceItems = scopedStatsItems;
    const totalCount = sourceItems.length;
    const totalHours = sourceItems.reduce((sum, item) => sum + (item.hours_spent || 0), 0);
    const totalPages = sourceItems.reduce((sum, item) => sum + (item.pages || 0), 0);
    const avgRating = totalCount > 0 ? sourceItems.reduce((sum, item) => sum + item.rating, 0) / totalCount : 0;
    const completedCount = sourceItems.filter((i) => i.status === 'Ukończone').length;
    const inProgressCount = sourceItems.filter((i) => i.status === 'W trakcie').length;

    const gameHours = sourceItems.filter((i) => i.item_type === 'Gra').reduce((sum, i) => sum + (i.hours_spent || 0), 0);
    const bookItems = sourceItems.filter((i) => i.item_type.toLowerCase().includes('książk') || i.item_type.toLowerCase().includes('ksiazk'));
    const bookHours = bookItems.reduce((sum, i) => sum + (i.hours_spent || 0), 0);
    const bookPages = bookItems.reduce((sum, i) => sum + (i.pages || 0), 0);
    const movieHours = sourceItems.filter((i) => i.item_type === 'Film').reduce((sum, i) => sum + (i.hours_spent || 0), 0);
    const seriesHours = sourceItems.filter((i) => i.item_type === 'Serial').reduce((sum, i) => sum + (i.hours_spent || 0), 0);

    const bookCount = bookItems.length;
    const gameCount = sourceItems.filter((i) => i.item_type === 'Gra').length;

    const maxRating = totalCount > 0 ? Math.max(...sourceItems.map((i) => i.rating)) : 0;
    const topRatedItems = totalCount > 0
      ? sourceItems
          .filter((i) => i.rating === maxRating)
          .sort((a, b) => (b.hours_spent || 0) - (a.hours_spent || 0) || (b.pages || 0) - (a.pages || 0))
      : [];

    return {
      totalCount,
      totalHours: Number(totalHours.toFixed(1)),
      totalPages,
      avgRating: Number(avgRating.toFixed(1)),
      completedCount,
      inProgressCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      gameHours: Number(gameHours.toFixed(1)),
      bookHours: Number(bookHours.toFixed(1)),
      bookPages,
      bookCount,
      gameCount,
      movieHours: Number(movieHours.toFixed(1)),
      seriesHours: Number(seriesHours.toFixed(1)),
      maxRating,
      topRatedItems,
    };
  }, [scopedStatsItems]);

  // Platform distribution filtered by platformYearMode, platformYearFilter AND platformMonthFilter
  const platformFilteredData = useMemo(() => {
    const eligibleItems = items.filter((i) => {
      const y = platformYearMode === 'release'
        ? (i.year && i.year > 0 ? String(i.year) : '')
        : (i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || ''));
      const matchesYear = platformYearFilter === 'Wszystkie' || y === platformYearFilter;
      const m = i.date_logged && i.date_logged.length >= 7 ? i.date_logged.substring(5, 7) : '';
      const matchesMonth = platformMonthFilter === 'Wszystkie' || m === platformMonthFilter;
      const matchesTopType = statsSelectedType === 'Wszystkie' || i.item_type === statsSelectedType;
      return matchesYear && matchesMonth && matchesTopType;
    });

    const totalH = eligibleItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
    const totalCount = eligibleItems.length;
    const totalPages = eligibleItems.reduce((acc, curr) => acc + (curr.pages || 0), 0);

    const map: Record<string, { hours: number; count: number; pages: number }> = {};
    eligibleItems.forEach((i) => {
      const p = i.platform || 'Inna / Domyślna';
      if (!map[p]) map[p] = { hours: 0, count: 0, pages: 0 };
      map[p].hours += (i.hours_spent || 0);
      map[p].count += 1;
      map[p].pages += (i.pages || 0);
    });

    const list = Object.entries(map)
      .map(([platform, data]) => ({
        platform,
        hours: Number(data.hours.toFixed(1)),
        count: data.count,
        pages: data.pages,
      }))
      .sort((a, b) => b.hours - a.hours || b.count - a.count);

    return {
      totalH: Number(totalH.toFixed(1)),
      totalCount,
      totalPages,
      list,
    };
  }, [items, platformYearMode, platformYearFilter, platformMonthFilter, statsSelectedType]);

  // Genre distribution filtered by genreTypeFilter, genreYearMode, genreYearFilter AND genreMonthFilter
  const genreFilteredData = useMemo(() => {
    const eligibleItems = items.filter((i) => {
      const matchesType = genreTypeFilter === 'Wszystkie' || i.item_type === genreTypeFilter;
      const y = genreYearMode === 'release'
        ? (i.year && i.year > 0 ? String(i.year) : '')
        : (i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || ''));
      const matchesYear = genreYearFilter === 'Wszystkie' || y === genreYearFilter;
      const m = i.date_logged && i.date_logged.length >= 7 ? i.date_logged.substring(5, 7) : '';
      const matchesMonth = genreMonthFilter === 'Wszystkie' || m === genreMonthFilter;
      return matchesType && matchesYear && matchesMonth;
    });

    const totalH = eligibleItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
    const totalCount = eligibleItems.length;

    const map: Record<string, { hours: number; count: number; pages: number }> = {};
    eligibleItems.forEach((i) => {
      const g = i.genre || 'Inny / Niesklasyfikowany';
      if (!map[g]) map[g] = { hours: 0, count: 0, pages: 0 };
      map[g].hours += (i.hours_spent || 0);
      map[g].count += 1;
      map[g].pages += (i.pages || 0);
    });

    const list = Object.entries(map)
      .map(([genre, data]) => ({
        genre,
        hours: Number(data.hours.toFixed(1)),
        count: data.count,
        pages: data.pages,
      }))
      .sort((a, b) => b.hours - a.hours || b.count - a.count);

    const maxH = Math.max(...list.map((g) => g.hours), 1);

    return { list, maxH, totalH: Number(totalH.toFixed(1)), totalCount };
  }, [items, genreTypeFilter, genreYearMode, genreYearFilter, genreMonthFilter]);

  // Period Replay & Dynamic Category Awards with EX AEQUO grouping
  const yearInReview = useMemo(() => {
    const periodItems = items.filter((i) => {
      if (periodType === 'yearly') {
        const y = i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || '');
        return y === activeYearFilter;
      } else if (periodType === 'release_year') {
        const ry = i.year && i.year > 0 ? String(i.year) : '';
        return ry === activeReleaseYearFilter;
      } else {
        if (!i.date_logged) return false;
        return i.date_logged.startsWith(`${activeYearFilter}-${activeMonthFilter}`);
      }
    });

    const count = periodItems.length;
    const avgRating = count > 0 ? periodItems.reduce((acc, curr) => acc + curr.rating, 0) / count : 0;
    const hours = periodItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);

    const sortFn = (a: MediaItem, b: MediaItem) =>
      b.rating - a.rating || (b.hours_spent || 0) - (a.hours_spent || 0) || (b.pages || 0) - (a.pages || 0);

    const categoryAwards = selectedSummaryCategories.map((cat) => {
      const catLower = cat.toLowerCase();
      const catItems = periodItems.filter((i) => {
        const itemTypeLower = (i.item_type || '').toLowerCase();
        if (catLower.includes('książk') || catLower.includes('ksiazk')) {
          return itemTypeLower.includes('książk') || itemTypeLower.includes('ksiazk');
        }
        return itemTypeLower === catLower;
      });

      if (catItems.length === 0) {
        return {
          category: cat,
          itemsCount: 0,
          maxRating: 0,
          winners: [] as MediaItem[],
          isExAequo: false,
        };
      }

      const maxRating = Math.max(...catItems.map((i) => i.rating));
      const winners = catItems.filter((i) => i.rating === maxRating).sort(sortFn);

      return {
        category: cat,
        itemsCount: catItems.length,
        maxRating,
        winners,
        isExAequo: winners.length > 1,
      };
    });

    const monthObj = months.find((m) => m.id === activeMonthFilter);

    const maxPeriodRating = count > 0 ? Math.max(...periodItems.map((i) => i.rating)) : 0;
    const bestOverallItems = count > 0 ? periodItems.filter((i) => i.rating === maxPeriodRating).sort(sortFn) : [];
    const bestOverall = bestOverallItems[0] || null;

    return {
      periodType,
      year: periodType === 'release_year' ? activeReleaseYearFilter : activeYearFilter,
      month: monthObj?.name || t('Miesiąc', 'Month'),
      periodLabel:
        periodType === 'yearly'
          ? t(`Rocznika ${activeYearFilter}`, `Year ${activeYearFilter}`)
          : periodType === 'release_year'
          ? t(`Roku wyjścia ${activeReleaseYearFilter}`, `Release Year ${activeReleaseYearFilter}`)
          : `${monthObj?.name} ${activeYearFilter}`,
      count,
      avgRating: Number(avgRating.toFixed(1)),
      hours: Number(hours.toFixed(1)),
      maxPeriodRating,
      bestOverall,
      bestOverallItems,
      categoryAwards,
      items: [...periodItems].sort(sortFn),
    };
  }, [items, periodType, activeYearFilter, activeReleaseYearFilter, activeMonthFilter, selectedSummaryCategories, months, lang]);

  // Helper for category styling & icons — directly synced with Library typeConfigs
  const getCategoryMeta = (cat: string) => {
    const config = getMediaTypeConfig(cat, typeConfigs);
    const IconC = getMediaTypeIcon(config.icon);
    return {
      color: config.color,
      borderColor: hexToRgba(config.color, 0.45),
      badgeBg: hexToRgba(config.color, 0.15),
      badgeText: config.color,
      icon: IconC,
      label: trType(cat),
    };
  };

  const chartColors = [
    '#66c0f4',
    '#e0a96d',
    '#a4d007',
    '#9b59b6',
    '#e58e26',
    '#3498db',
  ];

  const platformMonthName = platformMonthFilter === 'Wszystkie'
    ? t('Wszystkie miesiące', 'All months')
    : (months.find((m) => m.id === platformMonthFilter)?.name || platformMonthFilter);

  const genreMonthName = genreMonthFilter === 'Wszystkie'
    ? t('Wszystkie miesiące', 'All months')
    : (months.find((m) => m.id === genreMonthFilter)?.name || genreMonthFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner: ShelfMedia Social Graphic Export */}
      {onOpenSocialModal && (
        <div className="bg-gradient-to-r from-[#171a21] via-[#1b2838] to-[#212b3b] p-4 rounded-xl border border-[#2a475e] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#66c0f4] to-[#1a5d8c] text-white shadow-md">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {t('ShelfMedia • Eksport grafiki na Sociale', 'ShelfMedia • Social Media Graphic Export')}
                {userName && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#a4d007]/20 text-[#a4d007] border border-[#a4d007]/40 font-bold flex items-center gap-1">
                    👤 {userName}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40 font-mono">
                  {t('Podsumowanie Roczne & Miesięczne', 'Yearly & Monthly Summary')}
                </span>
              </h3>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Wygeneruj gotową grafikę z Dziełami Roku lub Miesiąca, łącznym czasem i gatunkami na Instagram, Facebook i X.',
                  'Generate a ready-to-share graphic with your Works of the Year or Month, total time, and top genres for Instagram, Facebook, and X.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSocialModal}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#66c0f4] to-[#4198cc] hover:from-[#7ad0ff] hover:to-[#4fa9df] text-[#171a21] font-black text-xs rounded-lg shadow-md hover:shadow-[#66c0f4]/20 transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Share2 className="w-4 h-4 text-[#171a21]" />
            <span>{t('Generuj grafikę na Sociale', 'Generate Social Graphic')}</span>
          </button>
        </div>
      )}

      {/* Top Filter Bar: Zakładki Statystyk wg Roku Wyjścia Dzieła (np. 2026) lub Rocznika Ukończenia */}
      <div className="bg-[#1b2838] p-4 rounded-xl border border-[#2a475e] shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border-b border-[#243547] pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a4d007]">
              <span>{t('ZAKŁADKI STATYSTYK WG ROKU:', 'STATS YEAR TABS:')}</span>
            </div>

            <div className="flex flex-wrap items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e] gap-1">
              <button
                type="button"
                onClick={() => handleSelectTopStatsYear('all', 'Wszystkie')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  statsYearMode === 'all'
                    ? 'bg-[#2a475e] text-white border border-[#66c0f4]/60 shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t(`Cała baza (${items.length})`, `Entire DB (${items.length})`)}
              </button>

              <button
                type="button"
                onClick={() => {
                  const defaultYr = distinctReleaseYears[0] || 'Wszystkie';
                  handleSelectTopStatsYear('release', defaultYr);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statsYearMode === 'release'
                    ? 'bg-[#a4d007] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <span>{t('Rok wyjścia dzieła', 'Release Year')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const defaultYr = distinctYears[0] || 'Wszystkie';
                  handleSelectTopStatsYear('completion', defaultYr);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statsYearMode === 'completion'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <span>{t('Rok ukończenia', 'Completion Year')}</span>
              </button>
            </div>
          </div>

          {statsYearMode !== 'all' && (
            <span className="text-xs text-[#8f98a0]">
              {statsYearMode === 'release'
                ? t(
                    'Podgląd statystyk wyłącznie dla dzieł (gier, książek...), które wyszły w wybranym roku',
                    'Viewing statistics exclusively for works (games, books...) released in the selected year'
                  )
                : t(
                    'Podgląd statystyk dla dzieł ukończonych / ocenionych w wybranym roczniku',
                    'Viewing statistics for works completed / rated in the selected year'
                  )}
            </span>
          )}
        </div>

        {/* Year buttons when Release Year or Completion Year mode is active */}
        {statsYearMode !== 'all' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#8f98a0] mr-1">
                {statsYearMode === 'release'
                  ? t('Wybierz rok wyjścia dzieła:', 'Select release year:')
                  : t('Wybierz rocznik ukończenia:', 'Select completion year:')}
              </span>

              {(statsYearMode === 'release' ? distinctReleaseYears : distinctYears).length > 0 ? (
                (statsYearMode === 'release' ? distinctReleaseYears : distinctYears).map((yr) => {
                  const countInYr = items.filter((i) =>
                    statsYearMode === 'release'
                      ? i.year && i.year > 0 && String(i.year) === yr
                      : (i.date_logged ? i.date_logged.substring(0, 4) : String(i.year || '')) === yr
                  ).length;
                  const isSelected = statsSelectedYear === yr;
                  const activeStyle =
                    statsYearMode === 'release'
                      ? 'bg-[#2a475e] text-[#a4d007] border-[#a4d007]'
                      : 'bg-[#2a475e] text-[#66c0f4] border-[#66c0f4]';
                  const badgeStyle =
                    statsYearMode === 'release'
                      ? 'bg-[#a4d007] text-[#171a21]'
                      : 'bg-[#66c0f4] text-[#171a21]';

                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectTopStatsYear(statsYearMode, yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? `${activeStyle} shadow`
                          : 'bg-[#171a21] text-[#c7d5e0] hover:text-white border-[#2a475e]/60'
                      }`}
                    >
                      <span>{yr}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? badgeStyle : 'bg-[#2a475e] text-[#8f98a0]'}`}>
                        {countInYr}
                      </span>
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-[#8f98a0] italic">
                  {statsYearMode === 'release'
                    ? t('Brak pozycji z wpisanym rokiem wydania (np. 2026)', 'No items with a release year entered (e.g. 2026)')
                    : t('Brak ukończonych pozycji z datą', 'No completed items with a date')}
                </span>
              )}
            </div>

            {/* Media Type Filter Pills (bez emotek - sam napis danego medium) */}
            <div className="pt-2 border-t border-[#243547]/70 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#8f98a0] mr-1">
                {statsYearMode === 'release'
                  ? t(`Filtruj dzieła wydane w ${statsSelectedYear}:`, `Filter works released in ${statsSelectedYear}:`)
                  : t(`Filtruj dzieła z rocznika ${statsSelectedYear}:`, `Filter works from ${statsSelectedYear}:`)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStatsSelectedType('Wszystkie');
                  setGenreTypeFilter('Wszystkie');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  statsSelectedType === 'Wszystkie'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'bg-[#171a21] text-[#c7d5e0] hover:text-white border border-[#2a475e]/60'
                }`}
              >
                {t('Wszystkie media', 'All media')} ({scopedItemsBeforeType.length})
              </button>
              {allAvailableTypes.map((tItem) => {
                const countOfType = scopedItemsBeforeType.filter((i) => i.item_type === tItem).length;
                const isTypeSelected = statsSelectedType === tItem;
                return (
                  <button
                    key={tItem}
                    type="button"
                    onClick={() => {
                      const next = isTypeSelected ? 'Wszystkie' : tItem;
                      setStatsSelectedType(next);
                      setGenreTypeFilter(next);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isTypeSelected
                        ? 'bg-[#2a475e] text-white border-[#66c0f4] shadow'
                        : 'bg-[#171a21] text-[#8f98a0] hover:text-white border-[#2a475e]/50'
                    }`}
                  >
                    <span>{trType(tItem)}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#243547] text-[#c7d5e0]">
                      {countOfType}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3 Metric Cards: Total Time, Completed Items, Average Rating */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Hours */}
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8f98a0]">
                {t('ŁĄCZNY CZAS', 'TOTAL TIME')}
              </span>
              <div className="p-2 rounded-lg bg-[#172535] text-[#66c0f4]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#66c0f4] font-mono">
                {stats.totalHours} <span className="text-lg font-normal text-[#8f98a0]">{t('godzin', 'hours')}</span>
              </div>
              <p className="text-xs text-[#8f98a0] mt-1">
                {statsYearMode === 'release' && statsSelectedYear !== 'Wszystkie'
                  ? t(
                      `Z ${stats.totalCount} dzieł wydanych w ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` (${trType(statsSelectedType)})` : ''}`,
                      `Across ${stats.totalCount} works released in ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` (${trType(statsSelectedType)})` : ''}`
                    )
                  : statsYearMode === 'completion' && statsSelectedYear !== 'Wszystkie'
                  ? t(
                      `Z ${stats.totalCount} dzieł z rocznika ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` (${trType(statsSelectedType)})` : ''}`,
                      `Across ${stats.totalCount} works from ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` (${trType(statsSelectedType)})` : ''}`
                    )
                  : t(`Ze wszystkich ${stats.totalCount} dzieł w bazie`, `Across all ${stats.totalCount} items in database`)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#243547] text-xs text-[#8f98a0] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {stats.totalPages > 0 ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-[#e0a96d] shrink-0" />
                  <span>{t(`Przeczytano: ${stats.totalPages} str.`, `Read: ${stats.totalPages} pages`)}</span>
                </>
              ) : (
                t('Łączny czas wybranych mediów', 'Total time of selected media')
              )}
            </span>
            {statsYearMode !== 'all' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a475e] text-[#66c0f4] font-bold">
                {statsSelectedYear}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Completed Titles */}
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8f98a0]">
                {t('UKOŃCZONE POZYCJE', 'COMPLETED ITEMS')}
              </span>
              <div className="p-2 rounded-lg bg-[#193319] text-[#a4d007]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#a4d007] font-mono">
                {stats.completedCount}{' '}
                <span className="text-lg font-normal text-[#8f98a0]">/ {stats.totalCount}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-[#171a21] h-2 rounded-full overflow-hidden border border-[#2a475e]/50">
                  <div
                    className="bg-[#a4d007] h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#a4d007]">{stats.completionRate}%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#243547] text-xs text-[#8f98a0]">
            {t('W trakcie:', 'In Progress:')} <span className="text-[#f39c12] font-semibold">{stats.inProgressCount}</span> {t('tytułów', 'titles')}
          </div>
        </div>

        {/* Card 3: Average Rating & ALL Highest Rated Titles */}
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8f98a0]">
                {t('ŚREDNIA OCENA', 'AVERAGE RATING')}
              </span>
              <div className="p-2 rounded-lg bg-[#332512] text-[#f39c12]">
                <Star className="w-5 h-5 fill-[#f39c12]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#f39c12] font-mono flex items-baseline gap-1">
                {stats.avgRating}{' '}
                <span className="text-lg font-normal text-[#8f98a0]">/ {ratingScale}</span>
              </div>
              <p className="text-xs text-[#8f98a0] mt-1">
                {statsYearMode === 'release' && statsSelectedYear !== 'Wszystkie'
                  ? t(`Średnia ocena dzieł wydanych w ${statsSelectedYear}`, `Average rating of works released in ${statsSelectedYear}`)
                  : t('Ocena wybranych mediów w bibliotece', 'Overall rating of selected media')}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#243547] text-xs text-[#c7d5e0]">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[#8f98a0] font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span>{t('Najwyższa ocena:', 'Highest rating:')}</span>
              </span>
              <span className="text-amber-400 font-mono font-bold">
                {stats.maxRating > 0 ? `${stats.maxRating.toFixed(1)} / ${ratingScale}` : '—'}
                {stats.topRatedItems.length > 1 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {stats.topRatedItems.length} {t('dzieła', 'items')}
                  </span>
                )}
              </span>
            </div>
            {stats.topRatedItems.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-0.5 mt-1">
                {stats.topRatedItems.map((topItem) => {
                  const meta = getCategoryMeta(topItem.item_type);
                  const TopIcon = meta.icon;
                  return (
                    <span
                      key={topItem.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#171a21] border border-[#2a475e] text-[11px] text-white font-medium"
                      title={`${topItem.title} (${trType(topItem.item_type)}) — ★ ${topItem.rating.toFixed(1)}`}
                    >
                      <TopIcon className="w-3 h-3 shrink-0" style={{ color: meta.color }} />
                      <span className="truncate max-w-[150px]">{topItem.title}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[#8f98a0] italic">{t('Brak ocenionych pozycji', 'No rated items')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Podgląd listy dzieł z wybranego roku wyjścia (np. gry, książki z 2026) w Statystykach */}
      {statsYearMode !== 'all' && statsSelectedYear !== 'Wszystkie' && (
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#a4d007]/40 shadow-lg space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243547] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-[#a4d007] text-[#171a21]">
                {statsYearMode === 'release'
                  ? t(`Premiery ${statsSelectedYear}`, `Releases ${statsSelectedYear}`)
                  : t(`Rocznik ${statsSelectedYear}`, `Year ${statsSelectedYear}`)}
              </span>
              <h4 className="text-sm font-bold text-white">
                {statsYearMode === 'release'
                  ? t(
                      `Dzieła wydane w roku ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` — ${trType(statsSelectedType)}` : ''} (${scopedStatsItems.length})`,
                      `Works released in ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` — ${trType(statsSelectedType)}` : ''} (${scopedStatsItems.length})`
                    )
                  : t(
                      `Dzieła z rocznika ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` — ${trType(statsSelectedType)}` : ''} (${scopedStatsItems.length})`,
                      `Works from ${statsSelectedYear}${statsSelectedType !== 'Wszystkie' ? ` — ${trType(statsSelectedType)}` : ''} (${scopedStatsItems.length})`
                    )}
              </h4>
            </div>
            <span className="text-xs text-[#8f98a0]">
              {t('Kliknij typ powyżej (np. Gra, Książka), aby zawęzić widok', 'Click a media type above (e.g. Game, Book) to narrow down')}
            </span>
          </div>

          {scopedStatsItems.length === 0 ? (
            <p className="text-xs text-[#8f98a0] italic py-4 text-center">
              {t('Brak pozycji spełniających wybrane kryteria roku i typu.', 'No items matching the selected year and media type.')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {[...scopedStatsItems]
                .sort((a, b) => b.rating - a.rating || (b.hours_spent || 0) - (a.hours_spent || 0))
                .map((it) => {
                  const meta = getCategoryMeta(it.item_type);
                  const ItIcon = meta.icon;
                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-lg bg-[#171a21] border border-[#2a475e]/70 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <ItIcon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                          <span className="font-bold text-white text-xs truncate">{it.title}</span>
                        </div>
                        <div className="text-[11px] text-[#8f98a0] mt-1 truncate">
                          {trType(it.item_type)} • {trPlatform(it.platform)} • {trGenre(it.genre)}{it.creator ? ` • ${it.creator}` : ''}
                        </div>
                        <div className="text-[10px] text-[#66c0f4] font-mono mt-1 flex items-center gap-2">
                          {it.year && <span>{t('Wydano:', 'Released:')} {it.year}</span>}
                          {it.hours_spent ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              {it.hours_spent}h
                            </span>
                          ) : null}
                          {it.pages ? (
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              {it.pages} {t('str.', 'p.')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold shrink-0">
                        ★ {it.rating.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* SHELFMEDIA PODSUMOWANIE */}
      <div className="bg-[#1b2838] p-6 rounded-xl border border-[#2a475e] shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-5 border-b border-[#243547] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-[#66c0f4] text-[#171a21]">
                {t('SHELFMEDIA • PODSUMOWANIE & NAGRODY', 'SHELFMEDIA • SUMMARY & AWARDS')}
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                {periodType === 'yearly'
                  ? t(`Dzieła Roku (${activeYearFilter || 'Wszystkie'})`, `Works of the Year (${activeYearFilter || 'All'})`)
                  : periodType === 'release_year'
                  ? t(`Dzieła z Roku Wyjścia (${activeReleaseYearFilter || 'Wszystkie'})`, `Works by Release Year (${activeReleaseYearFilter || 'All'})`)
                  : t(`Dzieła Miesiąca (${yearInReview.month} ${activeYearFilter})`, `Works of the Month (${yearInReview.month} ${activeYearFilter})`)}
              </h3>
            </div>
            <p className="text-xs text-[#8f98a0] mt-1">
              {t(
                'Wybór do 4 kategorii mediów z automatycznym wyróżnieniem miejsc ex aequo przy tej samej najwyższej ocenie.',
                'Select up to 4 media categories with automatic ex aequo tie highlights for items sharing the highest rating.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle: Roczne (Ukończenie) vs Rok wyjścia dzieła vs Miesięczne */}
            <div className="flex flex-wrap items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e] gap-1">
              <button
                onClick={() => setPeriodType('yearly')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  periodType === 'yearly'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Roczne (Ukończenie)', 'Yearly (Completed)')}
              </button>
              <button
                onClick={() => setPeriodType('release_year')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  periodType === 'release_year'
                    ? 'bg-[#a4d007] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Rok wyjścia dzieła', 'Release Year')}
              </button>
              <button
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  periodType === 'monthly'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                {t('Miesięczne', 'Monthly')}
              </button>
            </div>

            {/* Year Selector depending on periodType */}
            {periodType === 'release_year' ? (
              distinctReleaseYears.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
                  {distinctReleaseYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setActiveReleaseYearFilter(yr)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        activeReleaseYearFilter === yr
                          ? 'bg-[#2a475e] text-[#a4d007] shadow border border-[#a4d007]/50'
                          : 'text-[#8f98a0] hover:text-white'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#8f98a0] italic px-2">{t('Brak lat wyjścia', 'No release years')}</span>
              )
            ) : distinctYears.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
                {distinctYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setActiveYearFilter(yr)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      activeYearFilter === yr
                        ? 'bg-[#2a475e] text-[#66c0f4] shadow'
                        : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[#8f98a0] italic px-2">{t('Brak ukończonych roczników', 'No completed years')}</span>
            )}

            {/* Month Selector (only if monthly) */}
            {periodType === 'monthly' && (
              <select
                value={activeMonthFilter}
                onChange={(e) => setActiveMonthFilter(e.target.value)}
                className="bg-[#171a21] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#2a475e] focus:outline-none focus:border-[#66c0f4]"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {onOpenSocialModal && (
              <button
                onClick={onOpenSocialModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2a475e] to-[#1e3448] hover:from-[#375e7d] hover:to-[#25435c] text-white text-xs font-bold rounded-lg border border-[#66c0f4]/50 shadow transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#66c0f4]" />
                <span>{t('Grafika na Sociale', 'Social Graphic')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ELASTYCZNY WYBÓR DO 4 KATEGORII MEDIÓW */}
        <div className="mb-5 p-3.5 rounded-xl bg-[#141b24] border border-[#243547] space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#66c0f4]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {t('Kategorie w Podsumowaniu (wybierz do 4):', 'Categories in Summary (select up to 4):')}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded font-mono font-bold bg-[#2a475e] text-[#66c0f4]">
                {selectedSummaryCategories.length} / 4 {t('aktywne', 'active')}
              </span>
            </div>
            <span className="text-[11px] text-[#8f98a0]">
              {t(
                'Kliknij kategorię, aby włączyć lub zamienić (ikony i kolory zsynchronizowane z Biblioteką)',
                'Click a category to toggle or swap (icons and colors synced with Library)'
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {allAvailableTypes.map((cat) => {
              const isSelected = selectedSummaryCategories.includes(cat);
              const meta = getCategoryMeta(cat);
              const CatIcon = meta.icon;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleToggleSummaryCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2a475e] text-white border-2 border-[#66c0f4] shadow-md shadow-[#66c0f4]/20'
                      : 'bg-[#171a21] text-[#8f98a0] hover:text-[#c7d5e0] hover:bg-[#202937] border border-[#243547]'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                  <span>{trType(cat)}</span>
                  {isSelected && (
                    <span className="text-[10px] text-[#66c0f4] font-black">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {yearInReview.count === 0 ? (
          <div className="py-10 text-center text-[#8f98a0]">
            <Calendar className="w-10 h-10 mx-auto text-[#2a475e] mb-2" />
            <p className="text-sm font-medium text-[#c7d5e0]">
              {t(
                `Brak ocenionych pozycji w wybranym okresie (${yearInReview.periodLabel})`,
                `No rated items in the selected period (${yearInReview.periodLabel})`
              )}
            </p>
            <p className="text-xs text-[#8f98a0] mt-1">
              {periodType === 'release_year'
                ? t(
                    'Dodaj pozycje z tym rokiem wydania (np. 2026), aby zobaczyć wyróżnienia.',
                    'Add items with this release year (e.g. 2026) to see awards.'
                  )
                : t(
                    'Dodaj ukończone pozycje z datą w tym okresie, aby wyłonić nagrody.',
                    'Add completed items with a date in this period to see awards.'
                  )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dynamiczne karty dla wybranych do 4 kategorii z podziałem ex aequo */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(yearInReview.categoryAwards.length, 4)} gap-3.5`}>
              {yearInReview.categoryAwards.map((award) => {
                const meta = getCategoryMeta(award.category);
                const CatIcon = meta.icon;

                return (
                  <div
                    key={award.category}
                    className="bg-[#171a21] p-4 rounded-xl border shadow-md flex flex-col justify-between"
                    style={{ borderColor: meta.borderColor }}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-2 pb-1.5 border-b border-[#243547]/60">
                        <span className="flex items-center gap-1.5 uppercase tracking-wide" style={{ color: meta.color }}>
                          <CatIcon className="w-4 h-4 shrink-0" />
                          {lang === 'en'
                            ? `${trType(award.category)} of ${periodType === 'monthly' ? 'the Month' : periodType === 'release_year' ? activeReleaseYearFilter : 'the Year'}`
                            : `${trType(award.category)} ${periodType === 'monthly' ? 'Miesiąca' : periodType === 'release_year' ? `Roku ${activeReleaseYearFilter}` : 'Roku'}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {award.isExAequo && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                              <Trophy className="w-3 h-3 text-amber-400" /> Ex aequo ({award.winners.length})
                            </span>
                          )}
                          {award.maxRating > 0 && (
                            <span className="text-amber-400 font-mono font-bold flex items-center gap-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400" /> {award.maxRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {award.winners.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-xs text-[#8f98a0] italic">
                            {t(
                              `Brak ocenionej pozycji w kategorii "${trType(award.category)}" w tym okresie`,
                              `No rated item in category "${trType(award.category)}" in this period`
                            )}
                          </p>
                        </div>
                      ) : award.winners.length === 1 ? (
                        (() => {
                          const item = award.winners[0];
                          return (
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-xs text-[#8f98a0]">
                                {trPlatform(item.platform)} • {trGenre(item.genre)}{item.creator ? ` • ${item.creator}` : ''}
                              </p>
                              {item.comment && (
                                <p className="text-[11px] text-[#c7d5e0] italic mt-2 line-clamp-3 bg-[#131b24] p-2 rounded border border-[#243547]">
                                  "{item.comment}"
                                </p>
                              )}
                              <div className="mt-3 pt-2 border-t border-[#243547] text-xs font-mono flex items-center justify-between" style={{ color: meta.color }}>
                                <span className="inline-flex items-center gap-1">
                                  {item.pages ? (
                                    <>
                                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                      <span>{item.pages} {t('str.', 'p.')}</span>
                                    </>
                                  ) : (
                                    trType(award.category)
                                  )}
                                </span>
                                {item.hours_spent !== null && item.hours_spent !== undefined ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    <span>{item.hours_spent.toFixed(1)} h</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#8f98a0]">{t('czas opcjonalny', 'optional time')}</span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>
                              {t(
                                `Remis punktowy (${award.maxRating.toFixed(1)} ★) — miejsca ex aequo:`,
                                `Tied score (${award.maxRating.toFixed(1)} ★) — ex aequo winners:`
                              )}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {award.winners.map((item, idx) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-lg bg-[#131b24] border border-amber-500/30 hover:border-amber-400/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-amber-500/30 text-amber-200 shrink-0">
                                      #{idx + 1} ex aequo
                                    </span>
                                    <h5 className="font-bold text-white text-xs sm:text-sm leading-tight">
                                      {item.title}
                                    </h5>
                                  </div>
                                  <span className="text-amber-400 font-mono text-xs font-bold shrink-0">
                                    ★ {item.rating.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-[#8f98a0] mt-1">
                                  <span>{trPlatform(item.platform)} • {trGenre(item.genre)}{item.creator ? ` • ${item.creator}` : ''}</span>
                                  <span className="font-mono text-white/90 inline-flex items-center gap-1.5">
                                    {item.pages ? (
                                      <span className="inline-flex items-center gap-1">
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                        {item.pages} {t('str.', 'p.')}
                                      </span>
                                    ) : null}
                                    {item.pages && item.hours_spent ? <span>•</span> : null}
                                    {item.hours_spent !== null && item.hours_spent !== undefined ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3 shrink-0" />
                                        {item.hours_spent}h
                                      </span>
                                    ) : null}
                                  </span>
                                </div>
                                {item.comment && (
                                  <p className="text-[10.5px] text-[#c7d5e0] italic mt-1 line-clamp-2">
                                    "{item.comment}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Period stats summary line */}
            <div className="p-3 bg-[#171a21] rounded-lg border border-[#2a475e] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#c7d5e0] gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span>
                  {yearInReview.periodLabel}: {t('Średnia ocen:', 'Avg rating:')}{' '}
                  <strong className="text-amber-400 font-mono">{yearInReview.avgRating} / {ratingScale} ★</strong>
                </span>
                <span>•</span>
                <span>
                  {t('Oceniono:', 'Rated:')} <strong className="text-white">{yearInReview.count}</strong> {t('pozycji', 'items')} ({yearInReview.hours}h)
                </span>
                {yearInReview.bestOverallItems.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 flex-wrap">
                      <span>
                        {t('Najwyższa w okresie', 'Highest in period')} (<strong className="text-amber-400 font-mono">{yearInReview.maxPeriodRating.toFixed(1)} ★</strong>):
                      </span>
                      <strong className="text-white">
                        {yearInReview.bestOverallItems.map((i) => i.title).join(', ')}
                      </strong>
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[#8f98a0]">
                {yearInReview.categoryAwards.map((a) => (
                  <span key={a.category}>
                    {trType(a.category)}: <strong className="text-white">{a.itemsCount}</strong>
                    {a.isExAequo && <span className="text-amber-400 text-[10px] ml-0.5 font-bold">(ex aequo)</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMICZNE WYKRESY Z FILTRAMI ROCZNIKA / ROKU WYJŚCIA, MIESIĄCA ORAZ TYPU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Platform Distribution FILTERED BY YEAR & MONTH */}
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {t('Podział czasu wg Platformy / Formatu', 'Time Breakdown by Platform / Format')}
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t('Filtrowane po roku wyjścia dzieła lub roczniku ukończenia', 'Filtered by release year or completion year')}
                </p>
              </div>

              {/* Year Mode, Year & Month filter selectors for platform chart */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
                  <button
                    type="button"
                    onClick={() => {
                      setPlatformYearMode('completion');
                      setPlatformYearFilter('Wszystkie');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      platformYearMode === 'completion' ? 'bg-[#66c0f4] text-[#171a21]' : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Rocznik', 'Completed')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlatformYearMode('release');
                      setPlatformYearFilter(distinctReleaseYears[0] || 'Wszystkie');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      platformYearMode === 'release' ? 'bg-[#a4d007] text-[#171a21]' : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Rok wyjścia', 'Release')}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-[#171a21] px-2.5 py-1 rounded-lg border border-[#2a475e]">
                  <select
                    value={platformYearFilter}
                    onChange={(e) => setPlatformYearFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie lata', 'All years')}</option>
                    {(platformYearMode === 'release' ? distinctReleaseYears : distinctYears).map((yr) => (
                      <option key={yr} value={yr} className="bg-[#171a21]">{yr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#171a21] px-2.5 py-1 rounded-lg border border-[#2a475e]">
                  <span className="text-[11px] text-[#8f98a0]">{t('Miesiąc:', 'Month:')}</span>
                  <select
                    value={platformMonthFilter}
                    onChange={(e) => setPlatformMonthFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie miesiące', 'All months')}</option>
                    {platformAvailableMonths.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#171a21]">
                        {m.name}{m.count > 0 ? ` (${m.count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {platformFilteredData.list.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#8f98a0]">
                {t(
                  `Brak danych o platformach dla: Rocznik ${platformYearFilter === 'Wszystkie' ? 'Wszystkie lata' : platformYearFilter}, Miesiąc: ${platformMonthName}`,
                  `No platform data for: Year ${platformYearFilter === 'Wszystkie' ? 'All years' : platformYearFilter}, Month: ${platformMonthName}`
                )}
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto pr-1.5 space-y-3">
                {platformFilteredData.list.map((item, idx) => {
                  const percent = platformFilteredData.totalH > 0
                    ? Math.round((item.hours / platformFilteredData.totalH) * 100)
                    : 0;
                  const color = chartColors[idx % chartColors.length];
                  return (
                    <div key={item.platform} className="space-y-1 bg-[#16202d]/60 p-2 rounded-lg border border-[#243547]/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#e5e9f0] font-medium flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-white">{trPlatform(item.platform)}</span>
                          <span className="text-[11px] text-[#8f98a0] bg-[#171a21] px-1.5 py-0.5 rounded border border-[#2a475e]/40">
                            {item.count} {t(item.count === 1 ? 'dzieło' : 'dzieł', item.count === 1 ? 'item' : 'items')}
                            {item.pages > 0 && ` • ${item.pages} ${t('str.', 'p.')}`}
                          </span>
                        </span>
                        <span className="font-mono text-[#c7d5e0]">
                          <strong className="text-white">{item.hours.toFixed(1)} h</strong> ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#171a21] h-3 rounded-full overflow-hidden border border-[#2a475e]/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#243547] flex flex-wrap justify-between items-center gap-2 text-xs text-[#8f98a0]">
            <span>
              {t('Okres:', 'Period:')}{' '}
              <strong className="text-white">
                {platformYearFilter === 'Wszystkie' ? t('Wszystkie lata', 'All years') : platformYearFilter}
              </strong>{' '}
              ({platformMonthName}) • {t('Platform:', 'Platforms:')}{' '}
              <strong className="text-white">{platformFilteredData.list.length}</strong>
            </span>
            <span>
              {t('Łącznie:', 'Total:')}{' '}
              <strong className="text-[#66c0f4] font-mono">{platformFilteredData.totalH} h</strong> ({platformFilteredData.totalCount} {t('poz.', 'items')})
            </span>
          </div>
        </div>

        {/* Right: Genre Breakdown FILTERED BY TYPE, YEAR AND MONTH */}
        <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {t('Najchętniej eksplorowane Gatunki', 'Most Explored Genres')}
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t('Wszystkie gatunki wg medium, roku wyjścia lub rocznika oraz miesiąca', 'All genres by media type, release/completion year, and month')}
                </p>
              </div>

              {/* Filter: Type, Year Mode (Completion/Release), Year & Month */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#171a21] px-2 py-1 rounded-lg border border-[#2a475e]">
                  <span className="text-[11px] text-[#8f98a0]">{t('Medium:', 'Media:')}</span>
                  <select
                    value={genreTypeFilter}
                    onChange={(e) => setGenreTypeFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie media', 'All media')}</option>
                    {allAvailableTypes.map((tItem) => (
                      <option key={tItem} value={tItem} className="bg-[#171a21]">
                        {trType(tItem)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
                  <button
                    type="button"
                    onClick={() => {
                      setGenreYearMode('completion');
                      setGenreYearFilter('Wszystkie');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      genreYearMode === 'completion' ? 'bg-[#66c0f4] text-[#171a21]' : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Rocznik', 'Completed')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGenreYearMode('release');
                      setGenreYearFilter(distinctReleaseYears[0] || 'Wszystkie');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      genreYearMode === 'release' ? 'bg-[#a4d007] text-[#171a21]' : 'text-[#8f98a0] hover:text-white'
                    }`}
                  >
                    {t('Rok wyjścia', 'Release')}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-[#171a21] px-2 py-1 rounded-lg border border-[#2a475e]">
                  <select
                    value={genreYearFilter}
                    onChange={(e) => setGenreYearFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie lata', 'All years')}</option>
                    {(genreYearMode === 'release' ? distinctReleaseYears : distinctYears).map((yr) => (
                      <option key={yr} value={yr} className="bg-[#171a21]">{yr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#171a21] px-2 py-1 rounded-lg border border-[#2a475e]">
                  <span className="text-[11px] text-[#8f98a0]">{t('Miesiąc:', 'Month:')}</span>
                  <select
                    value={genreMonthFilter}
                    onChange={(e) => setGenreMonthFilter(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie miesiące', 'All months')}</option>
                    {genreAvailableMonths.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#171a21]">
                        {m.name}{m.count > 0 ? ` (${m.count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {genreFilteredData.list.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#8f98a0]">
                {t(
                  `Brak danych dla: Medium: ${trType(genreTypeFilter)}, Rok: ${genreYearFilter}, Miesiąc: ${genreMonthName}`,
                  `No data for: Media: ${trType(genreTypeFilter)}, Year: ${genreYearFilter}, Month: ${genreMonthName}`
                )}
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto pr-1.5 space-y-2.5">
                {genreFilteredData.list.map((g) => {
                  const widthPercent = Math.max(Math.round((g.hours / genreFilteredData.maxH) * 100), 4);
                  return (
                    <div key={g.genre} className="space-y-1 bg-[#16202d]/50 p-2 rounded-lg border border-[#243547]/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#e5e9f0] font-medium flex items-center gap-1.5">
                          <span className="font-semibold text-white">{trGenre(g.genre)}</span>
                          <span className="text-[11px] text-[#8f98a0]">
                            ({g.count} {t('poz.', 'items')}{g.pages > 0 ? `, ${g.pages} ${t('str.', 'p.')}` : ''})
                          </span>
                        </span>
                        <span className="font-mono text-xs text-[#66c0f4] font-semibold">
                          {g.hours.toFixed(1)} h
                        </span>
                      </div>
                      <div className="w-full bg-[#171a21] h-3.5 rounded-md overflow-hidden border border-[#2a475e]/50 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#2a475e] via-[#4b79a1] to-[#66c0f4] rounded transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#243547] flex flex-wrap justify-between items-center gap-2 text-xs text-[#8f98a0]">
            <span>
              {t('Medium:', 'Media:')} <strong className="text-white">{trType(genreTypeFilter)}</strong> •{' '}
              <strong className="text-white">
                {genreYearFilter === 'Wszystkie' ? t('Wszystkie lata', 'All years') : genreYearFilter}
              </strong>{' '}
              ({genreMonthName})
            </span>
            <span>
              {t('Gatunków:', 'Genres:')} <strong className="text-[#a4d007] font-bold">{genreFilteredData.list.length}</strong> ({genreFilteredData.totalH} h)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

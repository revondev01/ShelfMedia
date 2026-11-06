import React, { useState, useMemo } from 'react';
import { MediaItem, ItemStatus, SortField, SortOrder, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, DEFAULT_PLATFORM_COLORS, RatingScale, Collection } from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  FileText, 
  Star, 
  BookOpen,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  X,
  CalendarDays,
  CheckSquare,
  Square,
  AlertTriangle,
  Table as TableIcon,
  Library,
  Sparkles,
  Layers
} from 'lucide-react';
import { VirtualShelfView } from './VirtualShelfView';
import { ItemDetailModal } from './ItemDetailModal';
import { BulkEditModal } from './BulkEditModal';
import { AddToCollectionModal } from './AddToCollectionModal';
import { getMediaTypeConfig, getMediaTypeIcon, getTableBadgeStyle, getPlatformColor, hexToRgba } from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface LibraryTabProps {
  items: MediaItem[];
  availableTypes?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  platforms?: string[];
  platformColors?: Record<string, string>;
  genres?: string[];
  ratingScale?: RatingScale;
  collections?: Collection[];
  userName?: string;
  onEditItem: (item: MediaItem) => void;
  onDeleteItem: (id: number) => void;
  onDeleteMultiple?: (ids: number[]) => void;
  onBulkEdit?: (ids: number[], updates: Partial<MediaItem>) => void;
  onAddToExistingCollection?: (collectionId: string, itemIds: number[]) => void;
  onCreateCollectionWithItems?: (
    title: string, 
    description: string, 
    accentColor: string, 
    bannerEmoji: string, 
    itemIds: number[],
    styleConfig?: { icon: string; iconColor: string; bgColor: string }
  ) => void;
  onViewComment: (item: MediaItem) => void;
  onAddNew: () => void;
  onOpenOptionsManager?: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  items,
  availableTypes,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  platforms = [],
  platformColors = DEFAULT_PLATFORM_COLORS,
  genres = [],
  ratingScale = 10,
  collections = [],
  userName = '',
  onEditItem,
  onDeleteItem,
  onDeleteMultiple,
  onBulkEdit,
  onAddToExistingCollection,
  onCreateCollectionWithItems,
  onViewComment,
  onAddNew,
  onOpenOptionsManager,
}) => {
  const { t, trType, trStatus, trPlatform, trGenre } = useLanguage();

  const [viewMode, setViewMode] = useState<'table' | 'shelf'>('table');
  const [inspectedItem, setInspectedItem] = useState<MediaItem | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Wszystkie');
  const [statusFilter, setStatusFilter] = useState<string>('Wszystkie');
  const [yearFilterMode, setYearFilterMode] = useState<'completion' | 'release'>('completion');
  const [selectedYear, setSelectedYear] = useState<string>('Wszystkie');
  const [sortField, setSortField] = useState<SortField>('date_logged');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Multi-selection state for batch deletion
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [itemToDeleteDirectly, setItemToDeleteDirectly] = useState<MediaItem | null>(null);

  // Distinct available types from configured types and items (empty if DB is empty)
  const allAvailableTypes = useMemo(() => {
    const set = new Set<string>();
    if (availableTypes && availableTypes.length > 0) {
      availableTypes.forEach((tItem) => set.add(tItem));
    }
    items.forEach((i) => {
      if (i.item_type) set.add(i.item_type);
    });
    return Array.from(set);
  }, [items, availableTypes]);

  // Distinct creators from items
  const allAvailableCreators = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.creator && i.creator.trim()) set.add(i.creator.trim());
    });
    return Array.from(set);
  }, [items]);

  // 1. Distinct completion years - appears when there is a completed item with date_logged
  const availableCompletionYears = useMemo(() => {
    const yearSet = new Set<string>();
    items.forEach((item) => {
      const isCompleted = item.status === 'Ukończone';
      if (isCompleted && item.date_logged && item.date_logged.length >= 4) {
        const y = item.date_logged.substring(0, 4);
        if (/^\d{4}$/.test(y)) {
          yearSet.add(y);
        }
      }
    });

    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [items]);

  // 2. Distinct release years (rok wyjścia / wydania dzieła)
  const availableReleaseYears = useMemo(() => {
    const yearSet = new Set<string>();
    items.forEach((item) => {
      if (item.year && item.year > 0) {
        yearSet.add(String(item.year));
      }
    });

    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const availableYears = yearFilterMode === 'completion' ? availableCompletionYears : availableReleaseYears;

  const getItemMatchingYear = (item: MediaItem, mode: 'completion' | 'release') => {
    if (mode === 'release') {
      return item.year && item.year > 0 ? String(item.year) : '';
    }
    return item.date_logged ? item.date_logged.substring(0, 4) : String(item.year || '');
  };

  // Fallback to "Wszystkie" if selected year has no items in current mode
  React.useEffect(() => {
    if (selectedYear !== 'Wszystkie' && !availableYears.includes(selectedYear)) {
      setSelectedYear('Wszystkie');
    }
  }, [availableYears, selectedYear]);

  // Year item counts for quick media type filter pills
  const yearSummary = useMemo(() => {
    if (selectedYear === 'Wszystkie') return null;

    const yearItems = items.filter((item) => {
      const itemYear = getItemMatchingYear(item, yearFilterMode);
      return itemYear === selectedYear;
    });

    const typeCounts: Record<string, number> = {};
    yearItems.forEach((i) => {
      if (i.item_type) {
        typeCounts[i.item_type] = (typeCounts[i.item_type] || 0) + 1;
      }
    });

    return {
      count: yearItems.length,
      typeCounts,
    };
  }, [items, selectedYear, yearFilterMode]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        const q = search.toLowerCase();
        const matchesSearch =
          search.trim() === '' ||
          item.title.toLowerCase().includes(q) ||
          (item.creator || '').toLowerCase().includes(q) ||
          item.genre.toLowerCase().includes(q) ||
          item.platform.toLowerCase().includes(q) ||
          item.comment.toLowerCase().includes(q);

        const matchesType = typeFilter === 'Wszystkie' || item.item_type === typeFilter;
        const matchesStatus = statusFilter === 'Wszystkie' || item.status === statusFilter;

        const itemYear = getItemMatchingYear(item, yearFilterMode);
        const matchesYear = selectedYear === 'Wszystkie' || itemYear === selectedYear;

        return matchesSearch && matchesType && matchesStatus && matchesYear;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField] ?? '';
        let valB: string | number = b[sortField] ?? '';

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [items, search, typeFilter, statusFilter, selectedYear, yearFilterMode, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedItems.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultiple) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
    } else {
      selectedIds.forEach((id) => onDeleteItem(id));
      setSelectedIds([]);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#54687d] opacity-50 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#66c0f4]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#66c0f4]" />
    );
  };

  const getItemTypeBadge = (type: string) => {
    const config = getMediaTypeConfig(type, typeConfigs);
    const IconC = getMediaTypeIcon(config.icon);
    const bStyle = getTableBadgeStyle(config.color);
    const iconBg = config.bgColor || hexToRgba(config.color, 0.22);
    const iconGlyphColor = config.iconColor || config.color;
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-sm transition-all whitespace-nowrap leading-none"
        style={bStyle}
      >
        <span
          className="w-4 h-4 rounded flex items-center justify-center p-0.5 shrink-0"
          style={{
            backgroundColor: iconBg,
            color: iconGlyphColor,
          }}
        >
          <IconC className="w-3 h-3 shrink-0" />
        </span>
        <span>{trType(type)}</span>
      </span>
    );
  };

  const getStatusBadge = (status: ItemStatus) => {
    const label = trStatus(status);
    switch (status) {
      case 'Ukończone':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1a3d16] text-[#a4d007] border border-[#2b5d25] whitespace-nowrap leading-none">
            ● {label}
          </span>
        );
      case 'W trakcie':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3d2c14] text-[#f39c12] border border-[#684a1e] whitespace-nowrap leading-none">
            ● {label}
          </span>
        );
      case 'Porzucone':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3d1919] text-[#e74c3c] border border-[#632727] whitespace-nowrap leading-none">
            ● {label}
          </span>
        );
      case 'Planowane':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#212b3b] text-[#8f98a0] border border-[#314159] whitespace-nowrap leading-none">
            ● {label}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Year Tabs Navigation Bar (Completion Year vs Release Year) */}
      <div className="bg-[#1b2838] p-3.5 rounded-xl border border-[#2a475e] shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 border-b border-[#243547] pb-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#66c0f4]">
              <CalendarDays className="w-4 h-4 text-[#66c0f4]" />
              <span>{t('ZAKŁADKI ROCZNIKÓW:', 'YEAR TABS:')}</span>
            </div>

            {/* Mode Switcher: Rok ukończenia vs Rok wyjścia dzieła */}
            <div className="flex items-center bg-[#171a21] p-1 rounded-lg border border-[#2a475e]">
              <button
                type="button"
                onClick={() => {
                  setYearFilterMode('completion');
                  setSelectedYear('Wszystkie');
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  yearFilterMode === 'completion'
                    ? 'bg-[#66c0f4] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <span>{t('Rok ukończenia', 'Completion Year')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearFilterMode('release');
                  setSelectedYear('Wszystkie');
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  yearFilterMode === 'release'
                    ? 'bg-[#a4d007] text-[#171a21] shadow'
                    : 'text-[#8f98a0] hover:text-white'
                }`}
              >
                <span>{t('Rok wyjścia dzieła', 'Release Year')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Year buttons row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedYear('Wszystkie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedYear === 'Wszystkie'
                ? 'bg-[#2a475e] text-white shadow border border-[#66c0f4]/50 font-bold'
                : 'bg-[#171a21] text-[#8f98a0] hover:text-white hover:bg-[#212b3b] border border-transparent'
            }`}
          >
            {t(`Wszystkie lata (${items.length})`, `All years (${items.length})`)}
          </button>

          {availableYears.length > 0 ? (
            availableYears.map((yr) => {
              const countInYear = items.filter((i) => getItemMatchingYear(i, yearFilterMode) === yr).length;
              const isSelected = selectedYear === yr;
              const activeBorderColor = yearFilterMode === 'release' ? 'border-[#a4d007] text-[#a4d007]' : 'border-[#66c0f4] text-[#66c0f4]';
              const activeBadgeColor = yearFilterMode === 'release' ? 'bg-[#a4d007] text-[#171a21]' : 'bg-[#66c0f4] text-[#171a21]';

              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? `bg-[#2a475e] shadow border ${activeBorderColor}`
                      : 'bg-[#171a21] text-[#c7d5e0] hover:text-white hover:bg-[#212b3b] border border-[#2a475e]/60'
                  }`}
                >
                  <span>{yr}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? activeBadgeColor : 'bg-[#2a475e] text-[#8f98a0]'}`}>
                    {countInYear}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-[#8f98a0] italic py-1 px-2">
              {yearFilterMode === 'completion'
                ? t(
                    '(Zakładki roczników ukończenia pojawią się po dodaniu pozycji ze statusem "Ukończone" i datą)',
                    '(Completion year tabs will appear after adding an item with "Completed" status and a date)'
                  )
                : t(
                    '(Zakładki roku wyjścia pojawią się po wpisaniu roku wydania dzieła)',
                    '(Release year tabs will appear after entering a release year for an item)'
                  )}
            </span>
          )}
        </div>

        {/* Quick Media Type Pills when a specific year is selected (plain text without emojis) */}
        {selectedYear !== 'Wszystkie' && yearSummary && (
          <div className="pt-2 border-t border-[#243547]/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#8f98a0] mr-1">
              {yearFilterMode === 'release'
                ? t(`Pokaż dzieła wydane w ${selectedYear}:`, `Show works released in ${selectedYear}:`)
                : t(`Pokaż dzieła z rocznika ${selectedYear}:`, `Show works from ${selectedYear}:`)}
            </span>
            <button
              type="button"
              onClick={() => setTypeFilter('Wszystkie')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'Wszystkie'
                  ? 'bg-[#66c0f4] text-[#171a21] shadow'
                  : 'bg-[#171a21] text-[#c7d5e0] hover:text-white border border-[#2a475e]/60'
              }`}
            >
              {t('Wszystkie', 'All')} ({yearSummary.count})
            </button>
            {allAvailableTypes.map((tItem) => {
              const c = yearSummary.typeCounts[tItem] || 0;
              const isTypeActive = typeFilter === tItem;
              return (
                <button
                  key={tItem}
                  type="button"
                  onClick={() => setTypeFilter(isTypeActive ? 'Wszystkie' : tItem)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isTypeActive
                      ? 'bg-[#2a475e] text-white border-[#66c0f4] shadow'
                      : 'bg-[#171a21] text-[#8f98a0] hover:text-white border-[#2a475e]/50'
                  }`}
                >
                  <span>{trType(tItem)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#243547] text-[#c7d5e0]">
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Filter and Search Bar with Batch Delete Action */}
      <div className="bg-[#1b2838] p-4 rounded-xl border border-[#2a475e] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8f98a0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t(
              'Szukaj po tytule, twórcy, gatunku, platformie lub notatce...',
              'Search by title, creator, genre, platform, or review note...'
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-[#e5e9f0] placeholder-[#8f98a0] focus:outline-none focus:border-[#66c0f4] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8f98a0] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns & Batch Delete */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#171a21] px-2.5 py-1.5 rounded-lg border border-[#2a475e]">
            <span className="text-xs text-[#8f98a0] font-medium">{t('Typ:', 'Type:')}</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-[#e5e9f0] focus:outline-none cursor-pointer font-medium"
            >
              <option value="Wszystkie" className="bg-[#171a21]">
                {t('Wszystkie media', 'All media')}
              </option>
              {allAvailableTypes.map((tItem) => (
                <option key={tItem} value={tItem} className="bg-[#171a21]">
                  {trType(tItem)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#171a21] px-2.5 py-1.5 rounded-lg border border-[#2a475e]">
            <span className="text-xs text-[#8f98a0] font-medium">{t('Status:', 'Status:')}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#e5e9f0] focus:outline-none cursor-pointer font-medium"
            >
              <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie statusy', 'All statuses')}</option>
              <option value="Ukończone" className="bg-[#171a21]">{t('Ukończone', 'Completed')}</option>
              <option value="W trakcie" className="bg-[#171a21]">{t('W trakcie', 'In Progress')}</option>
              <option value="Porzucone" className="bg-[#171a21]">{t('Porzucone', 'Dropped')}</option>
              <option value="Planowane" className="bg-[#171a21]">{t('Planowane', 'Planned')}</option>
            </select>
          </div>

          {/* Batch action buttons if items are selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 animate-in zoom-in-95">
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1999e3] to-[#125688] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                title={t('Edytuj zaznaczone pozycje na raz', 'Bulk edit selected items')}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t(`Edytuj (${selectedIds.length})`, `Bulk Edit (${selectedIds.length})`)}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddToCollectionOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                title={t('Dodaj zaznaczone do kolekcji', 'Add selected items to collection')}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('Do kolekcji', 'To Collection')}</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c23838] hover:bg-[#e04848] text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t(`Usuń (${selectedIds.length})`, `Delete (${selectedIds.length})`)}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="p-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#8f98a0] hover:text-white rounded-lg text-xs transition-colors"
                title={t('Odznacz wszystkie', 'Deselect all')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {(search || typeFilter !== 'Wszystkie' || statusFilter !== 'Wszystkie' || selectedYear !== 'Wszystkie') && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('Wszystkie');
                setStatusFilter('Wszystkie');
                setSelectedYear('Wszystkie');
              }}
              className="text-xs text-[#66c0f4] hover:text-[#91d5fa] underline px-2 py-1 cursor-pointer"
            >
              {t('Wyczyść filtry', 'Clear filters')}
            </button>
          )}

          {/* View Switcher: Tabela / Wirtualna Półka */}
          <div className="flex items-center p-1 bg-[#171a21] rounded-lg border border-[#2a475e]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                  : 'text-[#8f98a0] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{t('Tabela', 'Table')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('shelf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'shelf'
                  ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                  : 'text-[#8f98a0] hover:text-white'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>{t('Wirtualna Półka', 'Virtual Shelf')}</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-[#8f98a0] pl-2 border-l border-[#2a475e]">
            {t('Pozycji:', 'Items:')} <span className="text-[#66c0f4]">{filteredAndSortedItems.length}</span> / {items.length}
          </div>
        </div>
      </div>

      {/* 4. Main Table / Shelf Container */}
      {viewMode === 'table' ? (
      <div className="bg-[#1b2838] rounded-xl border border-[#2a475e] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#141b24] border-b border-[#2a475e] text-xs font-bold text-[#66c0f4] uppercase tracking-wider select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    title={t('Zaznacz/odznacz wszystkie widoczne', 'Select/deselect all visible')}
                    className="text-[#8f98a0] hover:text-[#66c0f4]"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredAndSortedItems.length ? (
                      <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-2 w-10 text-center text-[#8f98a0]">#</th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#1f2b3a] transition-colors"
                >
                  <div className="flex items-center gap-1.5 group">
                    <span>{t('Tytuł / Dzieło', 'Title / Work')}</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('year')}
                  className="py-3 px-3 cursor-pointer hover:bg-[#1f2b3a] transition-colors w-20 text-center"
                >
                  <div className="flex items-center justify-center gap-1 group">
                    <span>{t('Rok', 'Year')}</span>
                    {getSortIcon('year')}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-center whitespace-nowrap">{t('Typ', 'Type')}</th>
                <th className="py-3 px-3 whitespace-nowrap">{t('Platforma / Format', 'Platform / Format')}</th>
                <th className="py-3 px-3 whitespace-nowrap">{t('Gatunek', 'Genre')}</th>
                <th
                  onClick={() => handleSort('creator')}
                  className="py-3 px-3 cursor-pointer hover:bg-[#1f2b3a] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1 group">
                    <span>{t('Twórca / Twórcy', 'Creator / Creators')}</span>
                    {getSortIcon('creator')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rating')}
                  className="py-3 px-3 cursor-pointer hover:bg-[#1f2b3a] transition-colors w-24 text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1 group">
                    <span>{t('Ocena', 'Rating')}</span>
                    {getSortIcon('rating')}
                  </div>
                </th>
                <th className="py-3 px-3 w-32 text-center whitespace-nowrap">{t('Status', 'Status')}</th>
                <th
                  onClick={() => handleSort('hours_spent')}
                  className="py-3 px-3 cursor-pointer hover:bg-[#1f2b3a] transition-colors w-32 text-right whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1 group">
                    <span>{t('Czas / Strony', 'Time / Pages')}</span>
                    {getSortIcon('hours_spent')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date_logged')}
                  className="py-3 px-3 cursor-pointer hover:bg-[#1f2b3a] transition-colors w-28 text-center hidden md:table-cell whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1 group">
                    <span>{t('Data oceny', 'Date Logged')}</span>
                    {getSortIcon('date_logged')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right w-28 whitespace-nowrap">{t('Usuń / Edytuj', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243547]">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-[#8f98a0]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-10 h-10 text-[#2a475e]" />
                      <p className="text-base font-medium text-[#c7d5e0]">
                        {t('Brak pozycji spełniających kryteria', 'No items matching your criteria')}
                      </p>
                      <p className="text-xs text-[#8f98a0]">
                        {selectedYear !== 'Wszystkie'
                          ? t(
                              `Brak pozycji z oceną w roczniku ${selectedYear}. Zmień rocznik lub dodaj nowe dzieło.`,
                              `No rated items in year ${selectedYear}. Change the year tab or add a new item.`
                            )
                          : t(
                              'Zmień filtry lub dodaj nową pozycję (książkę, grę, film lub serial).',
                              'Adjust your filters or add a new item (book, game, movie, or series).'
                            )}
                      </p>
                      <button
                        onClick={onAddNew}
                        className="mt-3 px-4 py-1.5 bg-[#5c7e10] hover:bg-[#79a313] text-white text-xs font-semibold rounded shadow cursor-pointer"
                      >
                        {t('+ Dodaj pozycję', '+ Add Item')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item, index) => {
                  const isChecked = selectedIds.includes(item.id);
                  const hasHours = item.hours_spent !== undefined && item.hours_spent !== null;
                  const hasPages = item.pages !== undefined && item.pages !== null && item.pages > 0;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#212f42] transition-colors group ${isChecked ? 'bg-[#1e2f42]' : ''}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(item.id)}
                          className="text-[#8f98a0] hover:text-[#66c0f4]"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center text-xs text-[#8f98a0] font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-[#66c0f4] transition-colors flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.comment && (
                            <button
                              onClick={() => onViewComment(item)}
                              title={t('Kliknij, aby przeczytać recenzję/notatkę', 'Click to read full review/note')}
                              className="text-[#8f98a0] hover:text-[#66c0f4] transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {item.comment && (
                          <p className="text-xs text-[#8f98a0] truncate max-w-xs mt-0.5">
                            "{item.comment}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-[#c7d5e0] font-mono">
                        {item.year || '—'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getItemTypeBadge(item.item_type)}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#c7d5e0] whitespace-nowrap">
                        {(() => {
                          const pCol = getPlatformColor(item.platform || 'Inna', platformColors);
                          return (
                            <span
                              className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-md border font-medium leading-none shadow-sm"
                              style={{
                                backgroundColor: hexToRgba(pCol, 0.14),
                                borderColor: hexToRgba(pCol, 0.45),
                                color: '#e5e9f0',
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: pCol }}
                              />
                              <span>{trPlatform(item.platform || 'Inna')}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#8f98a0] whitespace-nowrap">
                        {trGenre(item.genre || 'Inny')}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#c7d5e0] whitespace-nowrap">
                        {item.creator ? item.creator : <span className="text-[#8f98a0]">—</span>}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs">
                        {hasHours ? (
                          <div>
                            <span className="font-semibold text-[#66c0f4]">{item.hours_spent!.toFixed(1)} h</span>
                            {hasPages && (
                              <span className="block text-[11px] text-[#e0a96d] font-normal">
                                📖 {item.pages} {t('str.', 'p.')}
                              </span>
                            )}
                          </div>
                        ) : hasPages ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#3d2b14]/70 border border-[#6e4c1e]/60 text-[#e0a96d] font-semibold text-xs">
                            <BookOpen className="w-3 h-3 text-[#e0a96d]" />
                            <span>{item.pages} {t('str.', 'p.')}</span>
                          </div>
                        ) : (
                          <span className="text-[#8f98a0] font-normal text-xs">{t('— (opcjonalny)', '— (optional)')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-[#8f98a0] font-mono hidden md:table-cell">
                        {item.date_logged || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditItem(item)}
                            title={t('Edytuj pozycję', 'Edit item')}
                            className="p-1.5 bg-[#2a475e]/50 hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDeleteDirectly(item)}
                            title={t('Usuń z bazy danych', 'Delete from database')}
                            className="p-1.5 bg-[#3d1919]/60 hover:bg-[#c23838] text-[#e74c3c] hover:text-white rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <VirtualShelfView
          items={filteredAndSortedItems}
          typeConfigs={typeConfigs}
          platformColors={platformColors}
          userName={userName}
          shelfTitle={t('Biblioteka', 'Library')}
          onSelectItem={(item) => setInspectedItem(item)}
          onAddNew={onAddNew}
          onOpenOptionsManager={onOpenOptionsManager}
        />
      )}

      {/* Item Detail Modal for Virtual Shelf Spine Inspection */}
      {inspectedItem && (
        <ItemDetailModal
          item={inspectedItem}
          typeConfigs={typeConfigs}
          ratingScale={ratingScale}
          onClose={() => setInspectedItem(null)}
          onEdit={(item) => {
            onEditItem(item);
            setInspectedItem(null);
          }}
          onDelete={(item) => {
            setItemToDeleteDirectly(item);
            setInspectedItem(null);
          }}
        />
      )}

      {/* Direct Delete Confirmation Modal */}
      {itemToDeleteDirectly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1b2838] border border-[#c23838] rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#3d1919] text-[#e74c3c] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              {t('Usunąć pozycję z bazy danych?', 'Delete item from database?')}
            </h3>
            <p className="text-xs text-[#c7d5e0] mt-2">
              {t('Czy na pewno chcesz bezpowrotnie usunąć z bazy:', 'Are you sure you want to permanently delete:')}
            </p>
            <div className="my-3 p-2.5 bg-[#171a21] rounded-lg border border-[#2a475e] text-sm font-semibold text-[#66c0f4]">
              {itemToDeleteDirectly.title} ({trType(itemToDeleteDirectly.item_type)})
            </div>
            <p className="text-[11px] text-[#8f98a0]">
              {t(
                'Po usunięciu wpis zniknie z lokalnej bazy oraz ze wszystkich rocznych podsumowań i statystyk.',
                'Once deleted, this entry will be removed from your local database and all summaries and statistics.'
              )}
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setItemToDeleteDirectly(null)}
                className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('Anuluj', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  onDeleteItem(itemToDeleteDirectly.id);
                  setItemToDeleteDirectly(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#c23838] hover:bg-[#e04848] text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('Tak, usuń z bazy', 'Yes, delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditOpen && selectedIds.length > 0 && onBulkEdit && (
        <BulkEditModal
          isOpen={isBulkEditOpen}
          onClose={() => setIsBulkEditOpen(false)}
          selectedItems={items.filter((i) => selectedIds.includes(i.id))}
          availableTypes={allAvailableTypes}
          typeConfigs={typeConfigs}
          platforms={platforms}
          genres={genres}
          creators={allAvailableCreators}
          ratingScale={ratingScale}
          onApplyBulkEdit={(ids, updates) => {
            onBulkEdit(ids, updates);
            setSelectedIds([]);
          }}
        />
      )}

      {/* Add To Collection Modal */}
      {isAddToCollectionOpen && selectedIds.length > 0 && onAddToExistingCollection && onCreateCollectionWithItems && (
        <AddToCollectionModal
          isOpen={isAddToCollectionOpen}
          onClose={() => setIsAddToCollectionOpen(false)}
          selectedItems={items.filter((i) => selectedIds.includes(i.id))}
          collections={collections}
          onAddToExistingCollection={(collectionId, itemIds) => {
            onAddToExistingCollection(collectionId, itemIds);
            setSelectedIds([]);
          }}
          onCreateCollectionWithItems={(title, desc, color, emoji, itemIds, styleConfig) => {
            onCreateCollectionWithItems(title, desc, color, emoji, itemIds, styleConfig);
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
};

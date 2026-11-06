import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Share2, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  X, 
  Star, 
  Check, 
  ArrowLeft,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  Table as TableIcon,
  Library
} from 'lucide-react';
import { Collection, MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, DEFAULT_PLATFORM_COLORS, RatingScale } from '../types';
import { 
  AVAILABLE_ICONS, 
  COLOR_PRESETS, 
  ICON_TO_EMOJI_MAP, 
  getMediaTypeConfig, 
  getMediaTypeEmoji, 
  getMediaTypeIcon, 
  getPlatformColor,
  hexToRgba 
} from '../utils/mediaTypeUtils';
import { CollectionSocialModal } from './CollectionSocialModal';
import { VirtualShelfView } from './VirtualShelfView';
import { ItemDetailModal } from './ItemDetailModal';
import { useLanguage } from '../i18n';

interface CollectionsTabProps {
  collections: Collection[];
  items: MediaItem[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  platformColors?: Record<string, string>;
  ratingScale?: RatingScale;
  userName?: string;
  onCreateCollection: (
    title: string,
    description: string,
    accentColor: string,
    bannerEmoji: string,
    initialItemIds?: number[],
    styleConfig?: { icon: string; iconColor: string; bgColor: string }
  ) => void;
  onUpdateCollection: (collection: Collection) => void;
  onDeleteCollection: (id: string) => void;
  onAddItemToCollection: (collectionId: string, itemId: number) => void;
  onAddMultipleToCollection: (collectionId: string, itemIds: number[]) => void;
  onRemoveItemFromCollection: (collectionId: string, itemId: number) => void;
  onReorderCollectionItems: (collectionId: string, newItemIds: number[]) => void;
  onEditItem?: (item: MediaItem) => void;
  onDeleteItem?: (id: number) => void;
  onOpenOptionsManager?: () => void;
}

export const CollectionsTab: React.FC<CollectionsTabProps> = ({
  collections,
  items,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  platformColors = DEFAULT_PLATFORM_COLORS,
  ratingScale = 10,
  userName = '',
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onAddMultipleToCollection,
  onRemoveItemFromCollection,
  onReorderCollectionItems,
  onEditItem,
  onDeleteItem,
  onOpenOptionsManager,
}) => {
  const { t, trType, trPlatform, trGenre } = useLanguage();

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [collectionViewMode, setCollectionViewMode] = useState<'list' | 'shelf'>('list');
  const [inspectedItem, setInspectedItem] = useState<MediaItem | null>(null);
  const [socialModalCollection, setSocialModalCollection] = useState<Collection | null>(null);

  // Create Collection Modal state (matching Media Types icon & color options)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#66c0f4');
  const [newIcon, setNewIcon] = useState('Layers');
  const [newIconColor, setNewIconColor] = useState('#60a5fa');
  const [newBgColor, setNewBgColor] = useState('rgba(102, 192, 244, 0.2)');

  // Edit Collection Modal state
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#66c0f4');
  const [editIcon, setEditIcon] = useState('Layers');
  const [editIconColor, setEditIconColor] = useState('#60a5fa');
  const [editBgColor, setEditBgColor] = useState('rgba(102, 192, 244, 0.2)');

  // Add Items Picker Modal state
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState('Wszystkie');
  const [pickerSelectedIds, setPickerSelectedIds] = useState<number[]>([]);

  // Fast items map
  const itemsMap = useMemo(() => {
    const map = new Map<number, MediaItem>();
    items.forEach((i) => map.set(i.id, i));
    return map;
  }, [items]);

  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null;
    return collections.find((c) => c.id === activeCollectionId) || null;
  }, [collections, activeCollectionId]);

  const activeCollectionItems = useMemo(() => {
    if (!activeCollection) return [];
    const list: MediaItem[] = [];
    activeCollection.itemIds.forEach((id) => {
      const it = itemsMap.get(id);
      if (it) list.push(it);
    });
    return list;
  }, [activeCollection, itemsMap]);

  // Handle Create Collection submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const emoji = ICON_TO_EMOJI_MAP[newIcon] || '⭐';
    onCreateCollection(title, newDesc.trim(), newColor, emoji, [], {
      icon: newIcon,
      iconColor: newIconColor || newColor,
      bgColor: newBgColor || hexToRgba(newColor, 0.2),
    });
    setNewTitle('');
    setNewDesc('');
    setIsCreateModalOpen(false);
  };

  // Handle Edit Collection submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;
    const title = editTitle.trim();
    if (!title) return;
    const emoji = ICON_TO_EMOJI_MAP[editIcon] || editingCollection.bannerEmoji || '⭐';
    onUpdateCollection({
      ...editingCollection,
      title,
      description: editDesc.trim(),
      accentColor: editColor,
      icon: editIcon,
      iconColor: editIconColor || editColor,
      bgColor: editBgColor || hexToRgba(editColor, 0.2),
      bannerEmoji: emoji,
      updatedAt: new Date().toISOString(),
    });
    setEditingCollection(null);
  };

  const handleOpenEdit = (col: Collection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cColor = col.accentColor || '#66c0f4';
    setEditingCollection(col);
    setEditTitle(col.title);
    setEditDesc(col.description || '');
    setEditColor(cColor);
    setEditIcon(col.icon || 'Layers');
    setEditIconColor(col.iconColor || cColor);
    setEditBgColor(col.bgColor || hexToRgba(cColor, 0.2));
  };

  const handleDelete = (col: Collection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(t(`Czy na pewno chcesz usunąć kolekcję "${col.title}"?`, `Delete collection "${col.title}"?`))) {
      onDeleteCollection(col.id);
      if (activeCollectionId === col.id) {
        setActiveCollectionId(null);
      }
    }
  };

  // Reorder items inside active collection
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!activeCollection) return;
    const itemIds = [...activeCollection.itemIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= itemIds.length) return;

    const temp = itemIds[index];
    itemIds[index] = itemIds[targetIdx];
    itemIds[targetIdx] = temp;

    onReorderCollectionItems(activeCollection.id, itemIds);
  };

  // Add Items Picker handlers
  const handleOpenPicker = () => {
    setPickerSearch('');
    setPickerTypeFilter('Wszystkie');
    setPickerSelectedIds([]);
    setIsItemPickerOpen(true);
  };

  const handleApplyPicker = () => {
    if (!activeCollection || pickerSelectedIds.length === 0) return;
    onAddMultipleToCollection(activeCollection.id, pickerSelectedIds);
    setIsItemPickerOpen(false);
  };

  const filteredPickerItems = useMemo(() => {
    if (!activeCollection) return [];
    const existingSet = new Set(activeCollection.itemIds);
    return items.filter((item) => {
      if (existingSet.has(item.id)) return false;
      const matchesSearch =
        pickerSearch.trim() === '' ||
        item.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        item.genre.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (item.creator || '').toLowerCase().includes(pickerSearch.toLowerCase()) ||
        item.platform.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchesType = pickerTypeFilter === 'Wszystkie' || item.item_type === pickerTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, activeCollection, pickerSearch, pickerTypeFilter]);

  const renderCollectionBadge = (col: Collection, size: 'sm' | 'md' | 'lg' = 'md') => {
    const accent = col.accentColor || '#66c0f4';
    const IconComp = getMediaTypeIcon(col.icon || 'Layers');
    const bg = col.bgColor || hexToRgba(accent, 0.22);
    const glyphColor = col.iconColor || accent;

    const dims = size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-11 h-11 rounded-xl' : 'w-10 h-10 rounded-xl';
    const iconDims = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    return (
      <div
        className={`${dims} flex items-center justify-center border shrink-0 shadow-sm`}
        style={{
          backgroundColor: bg,
          borderColor: hexToRgba(accent, 0.5),
          color: glyphColor,
        }}
      >
        <IconComp className={iconDims} />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-[#1b2838] p-5 rounded-xl border border-[#2a475e] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {activeCollection ? (
            renderCollectionBadge(activeCollection, 'lg')
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#d946ef] to-[#8b5cf6] flex items-center justify-center text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {activeCollection ? activeCollection.title : t('Twoje Kolekcje & Serie', 'Your Collections & Series')}
              </h2>
              {userName && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#141d27] border border-[#2a475e] text-[#66c0f4] font-semibold hidden sm:inline">
                  👤 {userName}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8f98a0]">
              {activeCollection
                ? activeCollection.description || t('Zarządzaj pozycjami w tej kolekcji, przełączaj na wirtualną półkę i generuj grafikę na sociale', 'Manage items in this collection, switch to the virtual shelf, and generate social graphics')
                : t(
                    'Twórz tematyczne zestawy z własną ikoną i kolorem, oglądaj je na wirtualnej półce i generuj grafiki na sociale.',
                    'Create themed sets with custom icons and colors, view them on the virtual shelf, and generate social graphics.'
                  )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {activeCollection ? (
            <>
              <button
                type="button"
                onClick={() => setActiveCollectionId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold border border-[#2a475e] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('Wszystkie kolekcje', 'All Collections')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalCollection(activeCollection)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#66c0f4] to-[#2575fc] text-white rounded-lg text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('Grafika na Sociale', 'Social Graphic')}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Nowa Kolekcja', 'New Collection')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Collection Detail View OR Grid of All Collections */}
      {activeCollection ? (
        /* DETAIL VIEW */
        <div className="space-y-5">
          {/* Collection Stat Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1b2838] p-3.5 rounded-xl border border-[#2a475e] shadow">
              <span className="text-[11px] font-bold text-[#8f98a0] block uppercase">{t('Liczba pozycji', 'Total Items')}</span>
              <span className="text-xl font-bold text-white mt-1 block">{activeCollectionItems.length}</span>
            </div>

            <div className="bg-[#1b2838] p-3.5 rounded-xl border border-[#2a475e] shadow">
              <span className="text-[11px] font-bold text-[#8f98a0] block uppercase">{t('Średnia ocen', 'Avg Rating')}</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">
                {activeCollectionItems.length > 0
                  ? `★ ${(activeCollectionItems.reduce((a, b) => a + b.rating, 0) / activeCollectionItems.length).toFixed(1)} / ${ratingScale}`
                  : '—'}
              </span>
            </div>

            <div className="bg-[#1b2838] p-3.5 rounded-xl border border-[#2a475e] shadow">
              <span className="text-[11px] font-bold text-[#8f98a0] block uppercase">{t('Łączny czas', 'Total Time')}</span>
              <span className="text-xl font-bold text-[#66c0f4] mt-1 block">
                {activeCollectionItems.reduce((a, b) => a + (b.hours_spent || 0), 0).toFixed(1)} h
              </span>
            </div>

            <div className="bg-[#1b2838] p-3.5 rounded-xl border border-[#2a475e] shadow">
              <span className="text-[11px] font-bold text-[#8f98a0] block uppercase">{t('Przeczytane strony', 'Pages Read')}</span>
              <span className="text-xl font-bold text-[#a4d007] mt-1 block">
                {activeCollectionItems.reduce((a, b) => a + (b.pages || 0), 0)} {t('str.', 'p.')}
              </span>
            </div>
          </div>

          {/* Collection Items Action & View Switcher Bar (Tabela vs Wirtualna Półka) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#172230] p-3 rounded-xl border border-[#2a475e]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {renderCollectionBadge(activeCollection, 'sm')}
                <span className="text-sm font-bold text-white">{activeCollection.title}</span>
                <span className="text-xs text-[#8f98a0]">
                  ({activeCollectionItems.length} {t('pozycji', 'items')})
                </span>
              </div>

              {/* View Mode Toggle: Tabela / Wirtualna Półka (matching Biblioteka) */}
              <div className="flex items-center p-1 bg-[#171a21] rounded-lg border border-[#2a475e]">
                <button
                  type="button"
                  onClick={() => setCollectionViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    collectionViewMode === 'list'
                      ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                      : 'text-[#8f98a0] hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{t('Tabela', 'Table')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollectionViewMode('shelf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    collectionViewMode === 'shelf'
                      ? 'bg-[#66c0f4] text-[#171a21] shadow-md'
                      : 'text-[#8f98a0] hover:text-white'
                  }`}
                >
                  <Library className="w-3.5 h-3.5" />
                  <span>{t('Wirtualna Półka', 'Virtual Shelf')}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPicker}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5c7e10] hover:bg-[#79a313] text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Dodaj pozycje z bazy', 'Add items from database')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleOpenEdit(activeCollection, e)}
                className="p-1.5 text-[#8f98a0] hover:text-white rounded-lg hover:bg-[#212b3b] border border-[#2a475e] transition-colors cursor-pointer"
                title={t('Edytuj szczegóły i ikonę kolekcji', 'Edit collection details and icon')}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => handleDelete(activeCollection, e)}
                className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg border border-rose-900/50 transition-colors cursor-pointer"
                title={t('Usuń kolekcję', 'Delete collection')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collection Content: either Virtual Shelf OR Table/Ordered List */}
          {collectionViewMode === 'shelf' ? (
            <VirtualShelfView
              items={activeCollectionItems}
              typeConfigs={typeConfigs}
              platformColors={platformColors}
              userName={userName}
              shelfTitle={activeCollection.title}
              onSelectItem={(item) => setInspectedItem(item)}
              onAddNew={handleOpenPicker}
              onOpenOptionsManager={onOpenOptionsManager}
            />
          ) : activeCollectionItems.length === 0 ? (
            <div className="bg-[#1b2838] rounded-xl border border-[#2a475e] p-10 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-[#2a475e] mx-auto" />
              <h3 className="text-base font-bold text-white">
                {t('Kolekcja jest pusta', 'Collection is empty')}
              </h3>
              <p className="text-xs text-[#8f98a0] max-w-md mx-auto">
                {t(
                  'Dodaj swoje ulubione filmy, gry lub książki z bazy danych, aby ułożyć je w wybranej kolejności lub obejrzeć na Wirtualnej Półce.',
                  'Add your favorite movies, games, or books from the database to curate them in your preferred order or view on the Virtual Shelf.'
                )}
              </p>
              <button
                type="button"
                onClick={handleOpenPicker}
                className="mt-2 px-4 py-2 bg-[#66c0f4] text-[#141d27] font-bold rounded-lg text-xs shadow cursor-pointer"
              >
                {t('+ Wybierz dzieła z bazy', '+ Pick items from database')}
              </button>
            </div>
          ) : (
            <div className="bg-[#1b2838] rounded-xl border border-[#2a475e] overflow-hidden shadow-lg divide-y divide-[#243547]">
              {activeCollectionItems.map((item, idx) => {
                const typeCfg = getMediaTypeConfig(item.item_type, typeConfigs);
                const TypeIcon = getMediaTypeIcon(typeCfg.icon);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 hover:bg-[#212f42] transition-colors flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Reorder arrows & Rank */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className={`p-1 rounded text-xs transition-colors ${
                            idx === 0
                              ? 'text-[#324354] cursor-not-allowed'
                              : 'text-[#8f98a0] hover:text-[#66c0f4] hover:bg-[#172230] cursor-pointer'
                          }`}
                          title={t('Przesuń wyżej', 'Move up')}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === activeCollectionItems.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className={`p-1 rounded text-xs transition-colors ${
                            idx === activeCollectionItems.length - 1
                              ? 'text-[#324354] cursor-not-allowed'
                              : 'text-[#8f98a0] hover:text-[#66c0f4] hover:bg-[#172230] cursor-pointer'
                          }`}
                          title={t('Przesuń niżej', 'Move down')}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-xs text-[#8f98a0] w-6 text-center">
                        #{idx + 1}
                      </span>

                      {/* Media Type Icon Badge with custom iconColor and bgColor */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: typeCfg.bgColor || hexToRgba(typeCfg.color, 0.2),
                          borderColor: hexToRgba(typeCfg.color, 0.4),
                          color: typeCfg.iconColor || typeCfg.color,
                        }}
                        title={trType(item.item_type)}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </div>

                      {/* Title & Metadata */}
                      <div
                        onClick={() => setInspectedItem(item)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm group-hover:text-[#66c0f4] transition-colors">
                            {item.title}
                          </h4>
                          {item.year && (
                            <span className="text-xs text-[#8f98a0] font-mono">({item.year})</span>
                          )}
                        </div>
                        <p className="text-xs text-[#8f98a0] mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: getPlatformColor(item.platform, platformColors) }}
                            />
                            <span>{trPlatform(item.platform)}</span>
                          </span>
                          <span>• {trGenre(item.genre)}</span>
                          {item.creator ? <span className="text-[#c7d5e0]">• {item.creator}</span> : null}
                          {item.hours_spent ? <span>• {item.hours_spent}h</span> : null}
                          {item.pages ? <span>• {item.pages} {t('str.', 'p.')}</span> : null}
                        </p>
                      </div>
                    </div>

                    {/* Right: Rating & Remove button */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-[#131b24] px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItemFromCollection(activeCollection.id, item.id)}
                        className="p-1.5 text-[#8f98a0] hover:text-rose-400 hover:bg-[#172230] rounded-lg transition-colors cursor-pointer"
                        title={t('Usuń z tej kolekcji', 'Remove from collection')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ALL COLLECTIONS GRID */
        <div>
          {collections.length === 0 ? (
            <div className="bg-[#1b2838] rounded-xl border border-[#2a475e] p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d946ef] to-[#8b5cf6] flex items-center justify-center text-white mx-auto shadow-lg">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('Nie utworzono jeszcze żadnej kolekcji', 'No collections created yet')}
              </h3>
              <p className="text-xs text-[#8f98a0] max-w-md mx-auto">
                {t(
                  'Utwórz swoją pierwszą kolekcję, np. "Top horrory", "Ulubione Gry ever" lub "Top książki fantasy", wybierz ikonę i kolor, podejrzyj na wirtualnej półce i wygeneruj grafikę na sociale!',
                  'Create your first collection, e.g. "Top Horrors", "Favorite Games Ever", or "Top Fantasy Books", choose an icon and color, preview on the virtual shelf, and generate a social graphic!'
                )}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white font-bold rounded-lg text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t('+ Utwórz pierwszą kolekcję', '+ Create First Collection')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((col) => {
                const colItems: MediaItem[] = [];
                col.itemIds.forEach((id) => {
                  const it = itemsMap.get(id);
                  if (it) colItems.push(it);
                });

                const count = colItems.length;
                const avg = count > 0 ? (colItems.reduce((a, b) => a + b.rating, 0) / count).toFixed(1) : '—';
                const accent = col.accentColor || '#66c0f4';

                return (
                  <div
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className="bg-[#1b2838] border border-[#2a475e] hover:border-[#66c0f4]/80 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top colored accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: accent }}
                    />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          {renderCollectionBadge(col, 'sm')}
                          <h3 className="font-bold text-white text-base group-hover:text-[#66c0f4] transition-colors">
                            {col.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCollectionId(col.id);
                              setCollectionViewMode('shelf');
                            }}
                            className="p-1.5 text-[#a4d007] hover:text-white hover:bg-[#212b3b] rounded-lg transition-colors cursor-pointer"
                            title={t('Otwórz na Wirtualnej Półce', 'Open in Virtual Shelf')}
                          >
                            <Library className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSocialModalCollection(col);
                            }}
                            className="p-1.5 text-[#66c0f4] hover:text-white hover:bg-[#212b3b] rounded-lg transition-colors cursor-pointer"
                            title={t('Generuj grafikę na sociale', 'Generate social graphic')}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(col, e)}
                            className="p-1.5 text-[#8f98a0] hover:text-white hover:bg-[#212b3b] rounded-lg transition-colors cursor-pointer"
                            title={t('Edytuj', 'Edit')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(col, e)}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-lg transition-colors cursor-pointer"
                            title={t('Usuń', 'Delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {col.description && (
                        <p className="text-xs text-[#8f98a0] line-clamp-2 mb-3">
                          {col.description}
                        </p>
                      )}

                      {/* Items previews pill */}
                      <div className="space-y-1.5 my-3">
                        {colItems.slice(0, 3).map((it, iIdx) => (
                          <div
                            key={it.id}
                            className="px-2.5 py-1 rounded bg-[#131b24] border border-[#243547] text-xs flex items-center justify-between"
                          >
                            <span className="truncate text-white font-medium text-[11px]">
                              #{iIdx + 1} {it.title}
                            </span>
                            <span className="text-amber-400 font-mono text-[10px] font-bold shrink-0 ml-1">
                              ★ {it.rating.toFixed(1)}
                            </span>
                          </div>
                        ))}
                        {count > 3 && (
                          <span className="text-[10px] text-[#8f98a0] italic block pl-1">
                            + {count - 3} {t('więcej pozycji...', 'more items...')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-[#243547] flex items-center justify-between text-xs">
                      <span className="text-[#8f98a0] font-semibold">
                        {count} {t('pozycji', 'items')}
                      </span>
                      <div className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{avg}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Create Collection Modal (Same Icon & Color options as Media Types) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#243547] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('Nowa Kolekcja / Seria', 'New Collection / Series')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8f98a0] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1">
                  {t('Tytuł kolekcji (wymagany):', 'Title (required):')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="np. Ulubione Soulslike, Trylogia Władcy Pierścieni"
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1">
                  {t('Krótki opis / notatka:', 'Description / note:')}
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="np. Najlepsze gry z tego gatunku"
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>

              {/* Colors & Icons matching Media Types */}
              <div className="space-y-3 bg-[#141d27] p-4 rounded-xl border border-[#243547]">
                <div>
                  <label className="block text-xs font-bold text-[#c7d5e0] uppercase mb-1.5">
                    {t('1. Kolor główny / akcentu kolekcji:', '1. Main / Accent Color:')}
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setNewColor(c.hex);
                          setNewIconColor(c.hex);
                          setNewBgColor(hexToRgba(c.hex, 0.2));
                        }}
                        title={c.label}
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                          newColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'ring-2 ring-white scale-110 shadow'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={newColor.startsWith('#') ? newColor : '#66c0f4'}
                      onChange={(e) => {
                        setNewColor(e.target.value);
                        setNewIconColor(e.target.value);
                        setNewBgColor(hexToRgba(e.target.value, 0.2));
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer ml-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#243547]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c7d5e0] mb-1">
                      {t('Kolor samej ikony (symbolu):', 'Icon Glyph Color:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newIconColor.startsWith('#') ? newIconColor : '#ffffff'}
                        onChange={(e) => setNewIconColor(e.target.value)}
                        className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newIconColor}
                        onChange={(e) => setNewIconColor(e.target.value)}
                        className="flex-1 bg-[#111720] border border-[#2a475e] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#c7d5e0] mb-1">
                      {t('Kolor tła ikonki:', 'Icon Background Color:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBgColor.startsWith('#') ? newBgColor : '#1e293b'}
                        onChange={(e) => setNewBgColor(e.target.value)}
                        className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newBgColor}
                        onChange={(e) => setNewBgColor(e.target.value)}
                        className="flex-1 bg-[#111720] border border-[#2a475e] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#c7d5e0] uppercase mb-1.5">
                    {t('2. Wybierz ikonę kolekcji (jak w Typach mediów):', '2. Choose Collection Icon (same as Media Types):')}
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-[#111720] rounded-lg border border-[#2a475e]">
                    {AVAILABLE_ICONS.map((ic) => {
                      const IconComp = ic.icon;
                      const isSelected = newIcon === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setNewIcon(ic.id)}
                          title={ic.label}
                          className={`p-2 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2a475e] border-[#66c0f4] text-white scale-105 shadow'
                              : 'border-transparent text-[#8f98a0] hover:text-white hover:bg-[#172230]'
                          }`}
                        >
                          <IconComp className="w-4 h-4" style={{ color: isSelected ? newIconColor : undefined }} />
                          <span className="text-[9px] mt-1 truncate w-full text-center">
                            {ic.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-[#243547]">
                  <span className="text-[11px] text-[#8f98a0] font-semibold">
                    {t('Podgląd na żywo:', 'Live preview:')}
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const PIcon = getMediaTypeIcon(newIcon);
                      return (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center border shadow-sm"
                          style={{
                            backgroundColor: newBgColor || hexToRgba(newColor, 0.2),
                            borderColor: hexToRgba(newColor, 0.5),
                            color: newIconColor || newColor,
                          }}
                        >
                          <PIcon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <span className="text-xs font-bold text-white">
                      {newTitle.trim() || t('Nazwa kolekcji', 'Collection name')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#243547] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('Anuluj', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white font-bold rounded-lg text-xs shadow cursor-pointer"
                >
                  {t('Utwórz kolekcję', 'Create Collection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Collection Modal (Same Icon & Color options as Media Types) */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#243547] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#66c0f4]" />
                <span>{t('Edytuj Kolekcję', 'Edit Collection')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="text-[#8f98a0] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1">
                  {t('Tytuł kolekcji:', 'Title:')}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1">
                  {t('Opis / notatka:', 'Description:')}
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>

              <div className="space-y-3 bg-[#141d27] p-4 rounded-xl border border-[#243547]">
                <div>
                  <label className="block text-xs font-bold text-[#c7d5e0] uppercase mb-1.5">
                    {t('1. Kolor główny / akcentu kolekcji:', '1. Main / Accent Color:')}
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setEditColor(c.hex);
                          setEditIconColor(c.hex);
                          setEditBgColor(hexToRgba(c.hex, 0.2));
                        }}
                        title={c.label}
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                          editColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'ring-2 ring-white scale-110 shadow'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={editColor.startsWith('#') ? editColor : '#66c0f4'}
                      onChange={(e) => {
                        setEditColor(e.target.value);
                        setEditIconColor(e.target.value);
                        setEditBgColor(hexToRgba(e.target.value, 0.2));
                      }}
                      className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer ml-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#243547]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#c7d5e0] mb-1">
                      {t('Kolor samej ikony (symbolu):', 'Icon Glyph Color:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editIconColor.startsWith('#') ? editIconColor : '#ffffff'}
                        onChange={(e) => setEditIconColor(e.target.value)}
                        className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editIconColor}
                        onChange={(e) => setEditIconColor(e.target.value)}
                        className="flex-1 bg-[#111720] border border-[#2a475e] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#c7d5e0] mb-1">
                      {t('Kolor tła ikonki:', 'Icon Background Color:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editBgColor.startsWith('#') ? editBgColor : '#1e293b'}
                        onChange={(e) => setEditBgColor(e.target.value)}
                        className="w-7 h-7 rounded border border-[#2a475e] bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editBgColor}
                        onChange={(e) => setEditBgColor(e.target.value)}
                        className="flex-1 bg-[#111720] border border-[#2a475e] rounded px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#c7d5e0] uppercase mb-1.5">
                    {t('2. Wybierz ikonę kolekcji (jak w Typach mediów):', '2. Choose Collection Icon (same as Media Types):')}
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-[#111720] rounded-lg border border-[#2a475e]">
                    {AVAILABLE_ICONS.map((ic) => {
                      const IconComp = ic.icon;
                      const isSelected = editIcon === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setEditIcon(ic.id)}
                          title={ic.label}
                          className={`p-2 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2a475e] border-[#66c0f4] text-white scale-105 shadow'
                              : 'border-transparent text-[#8f98a0] hover:text-white hover:bg-[#172230]'
                          }`}
                        >
                          <IconComp className="w-4 h-4" style={{ color: isSelected ? editIconColor : undefined }} />
                          <span className="text-[9px] mt-1 truncate w-full text-center">
                            {ic.label.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-[#243547]">
                  <span className="text-[11px] text-[#8f98a0] font-semibold">
                    {t('Podgląd na żywo:', 'Live preview:')}
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const PIcon = getMediaTypeIcon(editIcon);
                      return (
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center border shadow-sm"
                          style={{
                            backgroundColor: editBgColor || hexToRgba(editColor, 0.2),
                            borderColor: hexToRgba(editColor, 0.5),
                            color: editIconColor || editColor,
                          }}
                        >
                          <PIcon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <span className="text-xs font-bold text-white">
                      {editTitle.trim() || t('Nazwa kolekcji', 'Collection name')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#243547] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('Anuluj', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#66c0f4] text-[#141d27] font-bold rounded-lg text-xs shadow cursor-pointer"
                >
                  {t('Zapisz zmiany', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Items Picker Modal */}
      {isItemPickerOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-[#2a475e] flex items-center justify-between bg-[#141d27]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#a4d007]" />
                  <span>{t(`Dodaj pozycje do "${activeCollection.title}"`, `Add items to "${activeCollection.title}"`)}</span>
                </h3>
                <p className="text-xs text-[#8f98a0]">
                  {t('Wyszukaj i zaznacz pozycje, które chcesz dodać do kolekcji', 'Search and select items to add to the collection')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsItemPickerOpen(false)}
                className="text-[#8f98a0] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-3 bg-[#172230] border-b border-[#243547] flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#8f98a0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('Szukaj po tytule, twórcy, gatunku...', 'Search by title, creator, genre...')}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#111720] border border-[#2a475e] rounded-lg text-xs text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#111720] px-2.5 py-1 rounded-lg border border-[#2a475e]">
                <Filter className="w-3.5 h-3.5 text-[#66c0f4]" />
                <select
                  value={pickerTypeFilter}
                  onChange={(e) => setPickerTypeFilter(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Wszystkie" className="bg-[#171a21]">{t('Wszystkie typy', 'All types')}</option>
                  {Object.keys(typeConfigs).map((tp) => (
                    <option key={tp} value={tp} className="bg-[#171a21]">{trType(tp)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Picker Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-[#243547]/40">
              {filteredPickerItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#8f98a0]">
                  {t('Brak pozycji do dodania spełniających kryteria', 'No matching items to add')}
                </div>
              ) : (
                filteredPickerItems.map((item) => {
                  const isChecked = pickerSelectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isChecked) {
                          setPickerSelectedIds((prev) => prev.filter((id) => id !== item.id));
                        } else {
                          setPickerSelectedIds((prev) => [...prev, item.id]);
                        }
                      }}
                      className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#1e2f42] border border-[#66c0f4]/50' : 'hover:bg-[#141d27]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#8f98a0]" />
                        )}
                        <span className="text-sm">{getMediaTypeEmoji(item.item_type, typeConfigs)}</span>
                        <div>
                          <div className="font-semibold text-white text-xs">
                            {item.title} {item.year ? `(${item.year})` : ''}
                          </div>
                          <div className="text-[11px] text-[#8f98a0]">
                            {trType(item.item_type)} • {trPlatform(item.platform)} • {trGenre(item.genre)}{item.creator ? ` • ${item.creator}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-xs font-bold">
                          ★ {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Picker Footer */}
            <div className="p-3 border-t border-[#2a475e] bg-[#141d27] flex items-center justify-between">
              <span className="text-xs text-[#8f98a0]">
                {t(`Zaznaczono: ${pickerSelectedIds.length} pozycji`, `Selected: ${pickerSelectedIds.length} items`)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemPickerOpen(false)}
                  className="px-4 py-1.5 bg-[#212b3b] text-[#c7d5e0] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('Anuluj', 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={pickerSelectedIds.length === 0}
                  onClick={handleApplyPicker}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pickerSelectedIds.length > 0
                      ? 'bg-[#a4d007] text-[#141d27] shadow cursor-pointer'
                      : 'bg-[#2a3847] text-[#8f98a0] cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t(`Dodaj zaznaczone (${pickerSelectedIds.length})`, `Add selected (${pickerSelectedIds.length})`)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Inspected Item Detail Modal (from Virtual Shelf or List) */}
      {inspectedItem && (
        <ItemDetailModal
          item={inspectedItem}
          typeConfigs={typeConfigs}
          ratingScale={ratingScale}
          onClose={() => setInspectedItem(null)}
          onEdit={(item) => {
            setInspectedItem(null);
            if (onEditItem) onEditItem(item);
          }}
          onDelete={(item) => {
            setInspectedItem(null);
            if (onDeleteItem) onDeleteItem(item.id);
          }}
        />
      )}

      {/* 7. Social Graphics Modal */}
      {socialModalCollection && (
        <CollectionSocialModal
          isOpen={true}
          onClose={() => setSocialModalCollection(null)}
          collection={socialModalCollection}
          items={items}
          typeConfigs={typeConfigs}
          ratingScale={ratingScale}
          userName={userName}
        />
      )}
    </div>
  );
};

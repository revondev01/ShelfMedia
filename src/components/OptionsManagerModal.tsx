import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Tag, 
  AlertCircle, 
  Shapes, 
  Palette, 
  Check, 
  Edit2
} from 'lucide-react';
import { MediaItem, DEFAULT_ITEM_TYPES, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, DEFAULT_PLATFORM_COLORS } from '../types';
import { 
  AVAILABLE_ICONS, 
  COLOR_PRESETS, 
  getMediaTypeConfig, 
  getMediaTypeIcon, 
  getTableBadgeStyle, 
  getSpineStyle,
  getPlatformColor,
  getRandomPresetColor,
  hexToRgba 
} from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface OptionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'full' | 'shelf';
  platforms: string[];
  platformColors?: Record<string, string>;
  genres: string[];
  types?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  items: MediaItem[];
  onAddPlatform: (name: string, color?: string) => void;
  onUpdatePlatformColor?: (name: string, color: string) => void;
  onDeletePlatform: (name: string) => void;
  onResetPlatforms: () => void;
  onAddGenre: (name: string) => void;
  onDeleteGenre: (name: string) => void;
  onResetGenres: () => void;
  onAddType?: (name: string, config?: { color: string; icon: string; iconColor?: string; bgColor?: string }) => void;
  onUpdateTypeConfig?: (typeName: string, updatedConfig: MediaTypeConfig, oldName?: string) => void;
  onDeleteType?: (name: string) => void;
  onResetTypes?: () => void;
}

export const OptionsManagerModal: React.FC<OptionsManagerModalProps> = ({
  isOpen,
  onClose,
  mode = 'full',
  platforms,
  platformColors = DEFAULT_PLATFORM_COLORS,
  genres,
  types = DEFAULT_ITEM_TYPES,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  items,
  onAddPlatform,
  onUpdatePlatformColor,
  onDeletePlatform,
  onResetPlatforms,
  onAddGenre,
  onDeleteGenre,
  onResetGenres,
  onAddType,
  onUpdateTypeConfig,
  onDeleteType,
  onResetTypes,
}) => {
  const { t, trType, trPlatform, trGenre } = useLanguage();
  const [activeTab, setActiveTab] = useState<'types' | 'platforms' | 'genres'>('types');
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState(() => getRandomPresetColor());
  const [editingPlatformColorFor, setEditingPlatformColorFor] = useState<string | null>(null);
  const [newGenreInput, setNewGenreInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Type Creation state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(() => getRandomPresetColor());
  const [newTypeIcon, setNewTypeIcon] = useState('Sparkles');
  const [newTypeIconColor, setNewTypeIconColor] = useState('#60a5fa');
  const [newTypeBgColor, setNewTypeBgColor] = useState('rgba(59, 130, 246, 0.2)');

  // Editing existing type state
  const [editingTypeName, setEditingTypeName] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editIconColor, setEditIconColor] = useState('');
  const [editBgColor, setEditBgColor] = useState('');

  useEffect(() => {
    if (mode === 'shelf' && activeTab === 'genres') {
      setActiveTab('types');
    }
  }, [mode, activeTab]);

  if (!isOpen) return null;

  // Usage counts
  const platformUsage = (pName: string) => items.filter((i) => i.platform === pName).length;
  const genreUsage = (gName: string) => items.filter((i) => i.genre === gName).length;
  const typeUsage = (tName: string) => items.filter((i) => i.item_type === tName).length;

  const handleStartEdit = (tName: string) => {
    const config = getMediaTypeConfig(tName, typeConfigs);
    setEditingTypeName(tName);
    setEditName(tName);
    setEditColor(config.color);
    setEditIcon(config.icon);
    setEditIconColor(config.iconColor || config.color);
    setEditBgColor(config.bgColor || 'rgba(59, 130, 246, 0.2)');
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingTypeName(null);
    setEditName('');
    setEditColor('');
    setEditIcon('');
    setEditIconColor('');
    setEditBgColor('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTypeName) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setErrorMsg(t('Nazwa typu medium nie może być pusta!', 'Media type name cannot be empty!'));
      return;
    }

    // Check collision if name changed
    if (
      trimmed.toLowerCase() !== editingTypeName.toLowerCase() &&
      types.some((tp) => tp.toLowerCase() === trimmed.toLowerCase())
    ) {
      setErrorMsg(t(`Typ "${trimmed}" już istnieje!`, `Type "${trimmed}" already exists!`));
      return;
    }

    if (onUpdateTypeConfig) {
      onUpdateTypeConfig(
        trimmed,
        {
          name: trimmed,
          color: editColor || '#3b82f6',
          icon: editIcon || 'Sparkles',
          iconColor: editIconColor || editColor || '#ffffff',
          bgColor: editBgColor || 'rgba(59, 130, 246, 0.2)',
        },
        editingTypeName !== trimmed ? editingTypeName : undefined
      );
    }
    handleCancelEdit();
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (types.some((tp) => tp.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(t(`Typ medium "${trimmed}" już istnieje na liście!`, `Media type "${trimmed}" already exists in the list!`));
      return;
    }
    if (onAddType) {
      onAddType(trimmed, {
        color: newTypeColor,
        icon: newTypeIcon,
        iconColor: newTypeIconColor || newTypeColor,
        bgColor: newTypeBgColor || hexToRgba(newTypeColor, 0.2),
      });
    }
    const nextRand = getRandomPresetColor([...Object.values(typeConfigs).map((c) => c.color), newTypeColor]);
    setNewTypeName('');
    setNewTypeColor(nextRand);
    setNewTypeIcon('Sparkles');
    setNewTypeIconColor(nextRand);
    setNewTypeBgColor(hexToRgba(nextRand, 0.2));
  };

  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = newPlatformInput.trim();
    if (!trimmed) return;
    if (platforms.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(t(`Platforma / Format "${trimmed}" już istnieje na liście!`, `Platform / Format "${trimmed}" already exists in the list!`));
      return;
    }
    onAddPlatform(trimmed, newPlatformColor);
    const nextRand = getRandomPresetColor([...Object.values(platformColors), newPlatformColor]);
    setNewPlatformInput('');
    setNewPlatformColor(nextRand);
  };

  const handleAddGenre = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = newGenreInput.trim();
    if (!trimmed) return;
    if (genres.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(t(`Gatunek "${trimmed}" już istnieje na liście!`, `Genre "${trimmed}" already exists in the list!`));
      return;
    }
    onAddGenre(trimmed);
    setNewGenreInput('');
  };

  const handleDeleteTypeItem = (tName: string) => {
    const count = typeUsage(tName);
    if (count > 0) {
      const ok = window.confirm(
        t(
          `Uwaga: Na liście biblioteki znajduje się ${count} pozycji o typie "${tName}". Czy na pewno chcesz usunąć ten typ z listy wyboru? (Wpisy w bibliotece zachowają ten typ).`,
          `Warning: There are ${count} items in the library with type "${tName}". Are you sure you want to remove this type from the selection list? (Existing library entries will keep this type).`
        )
      );
      if (!ok) return;
    }
    if (onDeleteType) {
      onDeleteType(tName);
    }
  };

  const handleDeletePlatformItem = (pName: string) => {
    const count = platformUsage(pName);
    if (count > 0) {
      const ok = window.confirm(
        t(
          `Uwaga: Na liście biblioteki znajduje się ${count} pozycji przypisanych do "${pName}". Czy na pewno chcesz usunąć tę opcję z listy wyboru? (Wpisy w bibliotece nie zostaną skasowane).`,
          `Warning: There are ${count} items in the library assigned to "${pName}". Are you sure you want to remove this option from the list? (Existing library entries will not be deleted).`
        )
      );
      if (!ok) return;
    }
    onDeletePlatform(pName);
  };

  const handleDeleteGenreItem = (gName: string) => {
    const count = genreUsage(gName);
    if (count > 0) {
      const ok = window.confirm(
        t(
          `Uwaga: Na liście biblioteki znajduje się ${count} pozycji przypisanych do "${gName}". Czy na pewno chcesz usunąć ten gatunek z listy wyboru? (Wpisy w bibliotece zachowają swoją nazwę).`,
          `Warning: There are ${count} items in the library assigned to "${gName}". Are you sure you want to remove this genre from the list? (Existing library entries will keep their genre).`
        )
      );
      if (!ok) return;
    }
    onDeleteGenre(gName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#1b2838] border border-[#2a475e] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2a475e]/40 text-[#66c0f4]">
              <Shapes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {mode === 'shelf'
                  ? t('Zarządzaj kolorami i ikonami grzbietów', 'Manage Spine Colors & Icons')
                  : t('Zarządzaj listami wyboru, kolorami i ikonami', 'Manage Selection Lists, Colors & Icons')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {mode === 'shelf'
                  ? t(
                      'Dostosuj ikony i kolory dla tabeli i grzbietów półki.',
                      'Customize icons and colors for table badges and shelf spines.'
                    )
                  : t(
                      'Dostosuj nazwy, ikony i kolory dla typów mediów, platform i formatów oraz nazwy gatunków.',
                      'Customize names, icons, and colors for media types, platforms and formats, and genre names.'
                    )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8f98a0] hover:text-white p-1 rounded-lg hover:bg-[#2a475e]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#171a21]/60 px-6 pt-3 border-b border-[#243547] flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab('types'); setErrorMsg(null); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'types'
                ? 'bg-[#1b2838] text-amber-400 border-[#2a475e]'
                : 'text-[#8f98a0] hover:text-[#c7d5e0] border-transparent hover:bg-[#1b2838]/40'
            }`}
          >
            <Palette className="w-4 h-4" />
            {t('Typy mediów, Kolory i Ikony', 'Media Types, Colors & Icons')} ({types.length})
          </button>

          <button
            onClick={() => { setActiveTab('platforms'); setErrorMsg(null); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
              activeTab === 'platforms'
                ? 'bg-[#1b2838] text-[#66c0f4] border-[#2a475e]'
                : 'text-[#8f98a0] hover:text-[#c7d5e0] border-transparent hover:bg-[#1b2838]/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            {t('Platformy i Formaty', 'Platforms & Formats')} ({platforms.length})
          </button>

          {mode !== 'shelf' && (
            <button
              onClick={() => { setActiveTab('genres'); setErrorMsg(null); handleCancelEdit(); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
                activeTab === 'genres'
                  ? 'bg-[#1b2838] text-[#a4d007] border-[#2a475e]'
                  : 'text-[#8f98a0] hover:text-[#c7d5e0] border-transparent hover:bg-[#1b2838]/40'
              }`}
            >
              <Tag className="w-4 h-4" />
              {t('Gatunki', 'Genres')} ({genres.length})
            </button>
          )}
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'types' && (
            <div className="space-y-6">
              {/* EDIT EXISTING TYPE MODAL / INLINE CARD */}
              {editingTypeName && (
                <div className="bg-[#14202e] border-2 border-amber-500/80 rounded-xl p-5 shadow-2xl relative animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#243547] mb-4">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">
                        {t('Edycja typu:', 'Editing type:')} <span className="text-amber-400">{trType(editingTypeName)}</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-[#8f98a0] hover:text-white px-2 py-1 rounded bg-[#1f2d3d]"
                    >
                      {t('Anuluj', 'Cancel')}
                    </button>
                  </div>

                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#c7d5e0] mb-1">
                        {t('NAZWA TYPU MEDIUM', 'MEDIA TYPE NAME')}
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#101722] border border-[#2a475e] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    {/* Color selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#c7d5e0]">
                          {t('KOLOR MEDIUM (DLA TABELI I GRZBIETU PÓŁKI)', 'MEDIA COLOR (FOR TABLE & SHELF SPINE)')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-7 h-7 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                            title={t('Wybierz dowolny kolor z próbnika', 'Pick any custom color')}
                          />
                          <span className="font-mono text-xs text-[#8f98a0]">{editColor}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                        {COLOR_PRESETS.map((p) => {
                          const isSel = editColor.toLowerCase() === p.hex.toLowerCase();
                          return (
                            <button
                              key={p.hex}
                              type="button"
                              onClick={() => setEditColor(p.hex)}
                              title={p.label}
                              className={`h-7 rounded-md transition-all relative flex items-center justify-center cursor-pointer border ${
                                isSel ? 'scale-110 border-white shadow-lg ring-2 ring-white/50 z-10' : 'border-black/30 hover:scale-105'
                              }`}
                              style={{ backgroundColor: p.hex }}
                            >
                              {isSel && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Icon selection */}
                    <div>
                      <label className="block text-xs font-bold text-[#c7d5e0] mb-1.5">
                        {t('IKONKA DLA TABELI I GRZBIETU REGAŁU', 'ICON FOR TABLE & SHELF SPINE')}
                      </label>
                      <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#101722] rounded-lg border border-[#243547]">
                        {AVAILABLE_ICONS.map((opt) => {
                          const IconComp = opt.icon;
                          const isSel = editIcon === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditIcon(opt.id)}
                              title={opt.label}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-all border ${
                                isSel
                                  ? 'bg-[#2a475e] text-white border-amber-400 font-bold shadow'
                                  : 'text-[#8f98a0] hover:text-white hover:bg-[#1a2636] border-transparent'
                              }`}
                            >
                              <IconComp className="w-4 h-4 mb-1" style={{ color: isSel ? editColor : undefined }} />
                              <span className="text-[10px] truncate max-w-full">{opt.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Icon Glyph Color & Icon Container Background Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#101722] rounded-lg border border-[#243547]">
                      <div>
                        <label className="block text-xs font-bold text-[#c7d5e0] mb-1">
                          {t('KOLOR SAMEJ IKONY (SYMBOLU)', 'ICON GLYPH COLOR')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editIconColor.startsWith('#') ? editIconColor : (editColor.startsWith('#') ? editColor : '#ffffff')}
                            onChange={(e) => setEditIconColor(e.target.value)}
                            className="w-8 h-8 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                            title={t('Kolor ikony', 'Icon Color')}
                          />
                          <input
                            type="text"
                            value={editIconColor}
                            onChange={(e) => setEditIconColor(e.target.value)}
                            placeholder="#60a5fa"
                            className="flex-1 bg-[#172230] border border-[#2a475e] rounded px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setEditIconColor(editColor)}
                            className="text-[10px] px-2 py-1 bg-[#243547] text-[#c7d5e0] rounded hover:text-white"
                          >
                            {t('Dopasuj', 'Match')}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#c7d5e0] mb-1">
                          {t('KOLOR TŁA IKONKI / PLAKIETKI', 'ICON BACKGROUND COLOR')}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editBgColor.startsWith('#') ? editBgColor : '#1e293b'}
                            onChange={(e) => setEditBgColor(e.target.value)}
                            className="w-8 h-8 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                            title={t('Kolor tła ikony', 'Icon Background Color')}
                          />
                          <input
                            type="text"
                            value={editBgColor}
                            onChange={(e) => setEditBgColor(e.target.value)}
                            placeholder="rgba(59, 130, 246, 0.2)"
                            className="flex-1 bg-[#172230] border border-[#2a475e] rounded px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setEditBgColor('rgba(30, 41, 59, 0.8)')}
                            className="text-[10px] px-2 py-1 bg-[#243547] text-[#c7d5e0] rounded hover:text-white"
                          >
                            {t('Ciemne', 'Dark')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Panel */}
                    <div className="bg-[#101722] p-3 rounded-lg border border-[#243547] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold text-[#8f98a0] uppercase tracking-wider mb-1.5">
                          {t('Podgląd odznaki w tabeli:', 'Table badge preview:')}
                        </div>
                        {(() => {
                          const PreviewIcon = getMediaTypeIcon(editIcon);
                          const bStyle = getTableBadgeStyle(editColor || '#3b82f6');
                          const iconBg = editBgColor || hexToRgba(editColor || '#3b82f6', 0.2);
                          const iconGlyphColor = editIconColor || editColor || '#ffffff';
                          return (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm"
                                style={{
                                  backgroundColor: iconBg,
                                  borderColor: hexToRgba(editColor || '#3b82f6', 0.5),
                                  color: iconGlyphColor,
                                }}
                              >
                                <PreviewIcon className="w-4 h-4" />
                              </div>
                              <span 
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold border"
                                style={bStyle}
                              >
                                <span>{trType(editName) || t('Nazwa typu', 'Type name')}</span>
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-[11px] font-bold text-[#8f98a0] uppercase tracking-wider">
                          {t('Podgląd na półce:', 'Shelf preview:')}
                        </div>
                        {(() => {
                          const PreviewIcon = getMediaTypeIcon(editIcon);
                          const spStyle = getSpineStyle(editColor || '#3b82f6');
                          const iconGlyphColor = editIconColor || editColor || '#ffffff';
                          return (
                            <div 
                              className="w-10 h-16 rounded border flex flex-col items-center justify-between p-1 shadow-md"
                              style={spStyle}
                            >
                              <PreviewIcon className="w-3.5 h-3.5" style={{ color: iconGlyphColor }} />
                              <div className="text-[8px] font-bold text-white tracking-tighter truncate w-full text-center">
                                ★ 9.5
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg bg-[#1f2d3d] hover:bg-[#2a3f55] text-white text-xs font-bold transition-colors"
                      >
                        {t('Anuluj', 'Cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
                      >
                        {t('Zapisz zmiany w typie', 'Save type changes')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add New Type Section */}
              <div className="bg-[#171a21] p-4 rounded-xl border border-[#243547]">
                <h3 className="text-xs font-bold text-[#66c0f4] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('Dodaj nowy typ medium ze swoją ikoną i kolorem', 'Add a new media type with custom icon & color')}
                </h3>

                <form onSubmit={handleAddType} className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder={t('np. Kurs, Dokument, Fanfik, Prelekcja...', 'e.g. Course, Documentary, Fanfic, Lecture...')}
                      className="flex-1 bg-[#101722] border border-[#2a475e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-[#8f98a0] focus:outline-none focus:border-[#66c0f4]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="w-9 h-9 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                        title={t('Wybierz kolor z próbnika', 'Pick color')}
                      />
                      <button
                        type="submit"
                        disabled={!newTypeName.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6c9313] hover:to-[#8bb817] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        {t('Dodaj typ', 'Add type')}
                      </button>
                    </div>
                  </div>

                  {/* Color presets chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] text-[#8f98a0] shrink-0">{t('Kolor:', 'Color:')}</span>
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setNewTypeColor(p.hex)}
                        title={p.label}
                        className={`w-5 h-5 rounded shrink-0 transition-transform ${
                          newTypeColor.toLowerCase() === p.hex.toLowerCase()
                            ? 'scale-125 ring-2 ring-white z-10'
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>

                  {/* Icon selection row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] text-[#8f98a0] shrink-0">{t('Ikona:', 'Icon:')}</span>
                    {AVAILABLE_ICONS.map((opt) => {
                      const IconComp = opt.icon;
                      const isSel = newTypeIcon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewTypeIcon(opt.id)}
                          title={opt.label}
                          className={`p-1.5 rounded shrink-0 border transition-all ${
                            isSel
                              ? 'bg-[#2a475e] text-white border-amber-400 font-bold scale-110 shadow'
                              : 'bg-[#101722] text-[#8f98a0] hover:text-white border-[#243547]'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" style={{ color: isSel ? newTypeColor : undefined }} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick preview */}
                  {newTypeName.trim() && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[11px] text-[#8f98a0]">{t('Podgląd:', 'Preview:')}</span>
                      {(() => {
                        const IconC = getMediaTypeIcon(newTypeIcon);
                        const bStyle = getTableBadgeStyle(newTypeColor);
                        return (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border"
                            style={bStyle}
                          >
                            <IconC className="w-3 h-3" />
                            <span>{newTypeName}</span>
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </form>
              </div>

              {/* Types List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#8f98a0] uppercase tracking-wider">
                    {t('Wszystkie skonfigurowane typy mediów', 'All configured media types')} ({types.length}):
                  </h3>
                  <span className="text-[11px] text-[#8f98a0]">
                    {t('Kliknij "Edytuj", aby zmienić kolor lub ikonę', 'Click "Edit" to change color or icon')}
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {types.map((tp) => {
                    const usage = typeUsage(tp);
                    const config = getMediaTypeConfig(tp, typeConfigs);
                    const IconComponent = getMediaTypeIcon(config.icon);
                    const badgeStyle = getTableBadgeStyle(config.color);
                    const spineStyle = getSpineStyle(config.color);

                    return (
                      <div
                        key={tp}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#171a21] hover:bg-[#1a2533] rounded-xl border border-[#243547] group transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* Miniature Shelf Spine */}
                          <div
                            className="w-7 h-11 rounded border flex flex-col items-center justify-between p-1 shrink-0 shadow"
                            style={spineStyle}
                            title={t('Podgląd grzbietu na wirtualnej półce', 'Shelf spine preview')}
                          >
                            <IconComponent className="w-3 h-3" style={{ color: config.color }} />
                            <div className="text-[7px] font-bold text-white">★</div>
                          </div>

                          {/* Table Badge Preview */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border"
                                style={badgeStyle}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                                <span>{trType(tp)}</span>
                              </span>
                              <span 
                                className="w-3 h-3 rounded-full border border-black/40"
                                style={{ backgroundColor: config.color }}
                                title={`HEX: ${config.color}`}
                              />
                            </div>
                            <div className="text-[11px] text-[#8f98a0] mt-0.5 flex items-center gap-2">
                              <span>{t('Ikona:', 'Icon:')} <strong className="text-white">{config.icon}</strong></span>
                              <span>•</span>
                              <span>{t('Kolor:', 'Color:')} <strong className="text-white font-mono">{config.color}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Usage & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              usage > 0
                                ? 'bg-[#2a475e]/60 text-[#66c0f4]'
                                : 'bg-[#1b2838] text-[#8f98a0]'
                            }`}
                          >
                            {usage} {usage === 1 ? t('dzieło', 'item') : t('dzieł', 'items')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(tp)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#213247] hover:bg-[#2b4461] text-amber-300 hover:text-amber-200 text-xs font-semibold transition-colors"
                            title={t('Zmień kolor i ikonkę dla tego typu', 'Change color and icon for this type')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{t('Edytuj', 'Edit')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTypeItem(tp)}
                            className="p-1.5 text-[#8f98a0] hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                            title={t('Usuń ten typ', 'Delete this type')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset to defaults button */}
              {onResetTypes && (
                <div className="pt-2 border-t border-[#243547] flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            'Czy na pewno chcesz przywrócić domyślne typy mediów, kolory i ikony?',
                            'Are you sure you want to restore default media types, colors, and icons?'
                          )
                        )
                      ) {
                        onResetTypes();
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-[#8f98a0] hover:text-amber-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('Przywróć domyślne typy mediów, kolory i ikony', 'Restore default media types, colors & icons')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="space-y-5">
              {/* Add Platform Form with Color Only */}
              <div className="bg-[#171a21] p-4 rounded-xl border border-[#243547]">
                <h3 className="text-xs font-bold text-[#66c0f4] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('Dodaj nową platformę / format ze swoim kolorem', 'Add a new platform / format with its color')}
                </h3>
                <form onSubmit={handleAddPlatform} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newPlatformInput}
                      onChange={(e) => setNewPlatformInput(e.target.value)}
                      placeholder={t('np. Epic Games, Apple TV, Storytel, VOD...', 'e.g. Epic Games, Apple TV, Audible, VOD...')}
                      className="flex-1 bg-[#101722] border border-[#2a475e] rounded-lg px-3.5 py-2 text-sm text-white placeholder-[#8f98a0] focus:outline-none focus:border-[#66c0f4]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newPlatformColor}
                        onChange={(e) => setNewPlatformColor(e.target.value)}
                        className="w-9 h-9 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                        title={t('Wybierz kolor dla tej platformy', 'Pick color for this platform')}
                      />
                      <button
                        type="submit"
                        disabled={!newPlatformInput.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1999e3] to-[#007cc2] hover:from-[#21a4f0] hover:to-[#0089d7] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        {t('Dodaj platformę', 'Add platform')}
                      </button>
                    </div>
                  </div>

                  {/* Quick color presets for new platform */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] text-[#8f98a0] shrink-0">{t('Kolor:', 'Color:')}</span>
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setNewPlatformColor(p.hex)}
                        title={p.label}
                        className={`w-5 h-5 rounded shrink-0 transition-transform cursor-pointer ${
                          newPlatformColor.toLowerCase() === p.hex.toLowerCase()
                            ? 'scale-125 ring-2 ring-white z-10'
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                </form>
              </div>

              {/* Platforms List with Color-Only Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#8f98a0] uppercase tracking-wider">
                    {t('Skonfigurowane platformy i formaty (zmiana koloru)', 'Configured platforms & formats (color customization)')} ({platforms.length}):
                  </h3>
                  <span className="text-[11px] text-[#8f98a0]">
                    {t('Kliknij próbnik lub "Kolor", aby zmienić kolor grzbietu i plakietki', 'Click color swatch or "Color" to change spine & badge color')}
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {platforms.map((p) => {
                    const usage = platformUsage(p);
                    const pColor = getPlatformColor(p, platformColors);
                    const spineStyle = getSpineStyle(pColor);
                    const isEditingThisColor = editingPlatformColorFor === p;

                    return (
                      <div
                        key={p}
                        className="p-3 bg-[#171a21] hover:bg-[#1a2533] rounded-xl border border-[#243547] transition-colors space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Miniature Shelf Spine Preview */}
                            <div
                              className="w-6 h-10 rounded border flex flex-col items-center justify-between p-1 shrink-0 shadow"
                              style={spineStyle}
                              title={t('Podgląd koloru grzbietu na wirtualnej półce', 'Shelf spine color preview')}
                            >
                              <span className="w-3 h-1 rounded-full" style={{ backgroundColor: pColor }} />
                              <div className="text-[7px] font-bold text-white">★</div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border leading-none shadow-sm"
                                  style={{
                                    backgroundColor: hexToRgba(pColor, 0.14),
                                    borderColor: hexToRgba(pColor, 0.45),
                                    color: '#e5e9f0',
                                  }}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: pColor }}
                                  />
                                  <span>{trPlatform(p)}</span>
                                </span>
                                <span className="font-mono text-[11px] text-[#8f98a0]">{pColor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                usage > 0
                                  ? 'bg-[#2a475e]/60 text-[#66c0f4]'
                                  : 'bg-[#1b2838] text-[#8f98a0]'
                              }`}
                            >
                              {usage} {usage === 1 ? t('pozycja', 'item') : t('pozycji', 'items')}
                            </span>

                            {/* Direct Color Picker Input */}
                            <input
                              type="color"
                              value={pColor}
                              onChange={(e) => onUpdatePlatformColor && onUpdatePlatformColor(p, e.target.value)}
                              className="w-7 h-7 rounded border border-[#2a475e] cursor-pointer bg-transparent"
                              title={t('Wybierz dowolny kolor dla tej platformy', 'Pick any custom color for this platform')}
                            />

                            {/* Toggle Preset Color Swatches */}
                            <button
                              type="button"
                              onClick={() => setEditingPlatformColorFor(isEditingThisColor ? null : p)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                isEditingThisColor
                                  ? 'bg-[#66c0f4] text-[#171a21]'
                                  : 'bg-[#213247] hover:bg-[#2b4461] text-[#66c0f4]'
                              }`}
                              title={t('Wybierz kolor z palety dla tej platformy', 'Choose color from palette for this platform')}
                            >
                              <Palette className="w-3.5 h-3.5" />
                              <span>{t('Kolor', 'Color')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePlatformItem(p)}
                              className="text-[#8f98a0] hover:text-red-400 p-1.5 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
                              title={t('Usuń tę platformę', 'Delete this platform')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Color Preset Bar for this Platform */}
                        {isEditingThisColor && (
                          <div className="pt-2 border-t border-[#243547] flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-bold text-[#c7d5e0] mr-1">
                                {t('Wybierz kolor platformy:', 'Select platform color:')}
                              </span>
                              {COLOR_PRESETS.map((preset) => {
                                const isSel = pColor.toLowerCase() === preset.hex.toLowerCase();
                                return (
                                  <button
                                    key={preset.hex}
                                    type="button"
                                    onClick={() => onUpdatePlatformColor && onUpdatePlatformColor(p, preset.hex)}
                                    title={preset.label}
                                    className={`w-6 h-6 rounded-md transition-all flex items-center justify-center cursor-pointer border ${
                                      isSel
                                        ? 'scale-110 border-white ring-2 ring-white/50 z-10'
                                        : 'border-black/30 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: preset.hex }}
                                  >
                                    {isSel && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingPlatformColorFor(null)}
                              className="text-[11px] text-[#8f98a0] hover:text-white px-2 py-0.5 rounded bg-[#1f2d3d] cursor-pointer"
                            >
                              {t('Gotowe', 'Done')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset platforms button */}
              <div className="pt-2 border-t border-[#243547] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        t(
                          'Czy na pewno chcesz przywrócić domyślną listę platform, formatów i ich kolorów?',
                          'Are you sure you want to restore the default platforms, formats, and their colors?'
                        )
                      )
                    ) {
                      onResetPlatforms();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#8f98a0] hover:text-[#66c0f4] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Przywróć domyślne platformy i kolory', 'Restore default platforms & colors')}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'genres' && (
            <div>
              {/* Add Genre Form */}
              <form onSubmit={handleAddGenre} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  placeholder={t('np. Cyberpunk, Roguelike, Reportaż, Psychologiczny...', 'e.g. Cyberpunk, Roguelike, Non-fiction, Psychological...')}
                  className="flex-1 bg-[#171a21] border border-[#2a475e] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#8f98a0] focus:outline-none focus:border-[#a4d007]"
                />
                <button
                  type="submit"
                  disabled={!newGenreInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6c9313] hover:to-[#8bb817] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  {t('Dodaj', 'Add')}
                </button>
              </form>

              {/* Genres List */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {genres.map((g) => {
                  const usage = genreUsage(g);
                  return (
                    <div
                      key={g}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-[#171a21] hover:bg-[#1f2f42] rounded-lg border border-[#243547] group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a4d007]"></span>
                        <span className="text-sm font-semibold text-[#e5e9f0]">{trGenre(g)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            usage > 0
                              ? 'bg-[#2a475e]/60 text-[#66c0f4]'
                              : 'bg-[#1b2838] text-[#8f98a0]'
                          }`}
                        >
                          {usage} {usage === 1 ? t('pozycja', 'item') : t('pozycji', 'items')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGenreItem(g)}
                          className="text-[#8f98a0] hover:text-red-400 p-1 rounded hover:bg-red-950/40 transition-colors"
                          title={t('Usuń ten gatunek', 'Delete this genre')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset genres button */}
              <div className="mt-4 pt-3 border-t border-[#243547] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        t(
                          'Czy na pewno chcesz przywrócić domyślną listę gatunków?',
                          'Are you sure you want to restore the default genres list?'
                        )
                      )
                    ) {
                      onResetGenres();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#8f98a0] hover:text-[#a4d007] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Przywróć domyślne gatunki', 'Restore default genres')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#171a21] px-6 py-3.5 border-t border-[#2a475e] flex items-center justify-between">
          <p className="text-xs text-[#8f98a0]">
            {t(
              'Wszystkie zmiany kolorów i ikon są automatycznie synchronizowane z tabelą i wirtualną półką.',
              'All color and icon changes are automatically synchronized with the table and virtual shelf.'
            )}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#212b3b] hover:bg-[#2a384d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            {t('Zamknij', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

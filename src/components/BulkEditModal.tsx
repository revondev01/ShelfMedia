import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Edit3, 
  Layers, 
  CheckSquare, 
  Square, 
  AlertCircle,
  Sparkles,
  Calendar,
  Star,
  Monitor,
  Tag
} from 'lucide-react';
import { MediaItem, ItemStatus, MediaTypeConfig, RatingScale, DEFAULT_TYPE_CONFIGS } from '../types';
import { getMediaTypeConfig, getMediaTypeEmoji, getMediaTypeIcon, hexToRgba } from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: MediaItem[];
  availableTypes: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  platforms: string[];
  genres: string[];
  creators?: string[];
  ratingScale: RatingScale;
  onApplyBulkEdit: (ids: number[], updates: Partial<MediaItem>) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  availableTypes,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  platforms,
  genres,
  creators = [],
  ratingScale,
  onApplyBulkEdit,
}) => {
  const { t, trType, trStatus } = useLanguage();

  // Field toggles
  const [updateType, setUpdateType] = useState(false);
  const [targetType, setTargetType] = useState<string>(availableTypes[0] || '');

  const [updateStatus, setUpdateStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ItemStatus>('Ukończone');

  const [updatePlatform, setUpdatePlatform] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<string>(platforms[0] || '');

  const [updateGenre, setUpdateGenre] = useState(false);
  const [targetGenre, setTargetGenre] = useState<string>(genres[0] || '');

  const [updateCreator, setUpdateCreator] = useState(false);
  const [targetCreator, setTargetCreator] = useState<string>(creators[0] || '');

  const [updateRating, setUpdateRating] = useState(false);
  const [targetRating, setTargetRating] = useState<number>(ratingScale === 10 ? 8 : 4);

  const [updateYear, setUpdateYear] = useState(false);
  const [targetYear, setTargetYear] = useState<string>(String(new Date().getFullYear()));

  if (!isOpen || selectedItems.length === 0) return null;

  const anyFieldSelected = updateType || updateStatus || updatePlatform || updateGenre || updateCreator || updateRating || updateYear;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anyFieldSelected) return;

    const updates: Partial<MediaItem> = {};

    if (updateType && targetType.trim()) updates.item_type = targetType.trim();
    if (updateStatus) updates.status = targetStatus;
    if (updatePlatform && targetPlatform.trim()) updates.platform = targetPlatform.trim();
    if (updateGenre && targetGenre.trim()) updates.genre = targetGenre.trim();
    if (updateCreator) updates.creator = targetCreator.trim();
    if (updateRating) {
      updates.rating = targetRating;
      updates._rawRating10 = ratingScale === 5 ? targetRating * 2 : targetRating;
    }
    if (updateYear) {
      const yr = parseInt(targetYear, 10);
      updates.year = isNaN(yr) || yr <= 0 ? null : yr;
    }

    const ids = selectedItems.map((i) => i.id);
    onApplyBulkEdit(ids, updates);
    onClose();
  };

  const targetTypeConfig = getMediaTypeConfig(targetType, typeConfigs);
  const TargetTypeIcon = getMediaTypeIcon(targetTypeConfig.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#2a475e] flex items-center justify-between bg-[#141d27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('Masowa edycja pozycji', 'Bulk Edit Items')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#66c0f4] text-[#141d27] font-extrabold">
                  {selectedItems.length} {t('pozycji', 'items')}
                </span>
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Zaznacz pola, które chcesz zmienić jednocześnie dla wszystkich wybranych elementów',
                  'Check the fields you want to update simultaneously across all selected items'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8f98a0] hover:text-white rounded-lg hover:bg-[#212b3b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Items Preview Pill Bar */}
        <div className="px-5 py-3 bg-[#111720] border-b border-[#243547] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#8f98a0] font-bold shrink-0">{t('Wybrane:', 'Selected:')}</span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto w-full py-1">
            {selectedItems.map((item) => {
              const cfg = getMediaTypeConfig(item.item_type, typeConfigs);
              return (
                <span
                  key={item.id}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#172230] border border-[#2a475e] text-white flex items-center gap-1 shrink-0"
                >
                  <span style={{ color: cfg.color }}>{getMediaTypeEmoji(item.item_type, typeConfigs)}</span>
                  <span className="truncate max-w-[150px]">{item.title}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Field: Media Type */}
          <div className={`p-4 rounded-xl border transition-all ${updateType ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateType(!updateType)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateType ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Typ Medium (np. na Film, Grę, Książkę...)', 'Change Media Type (e.g. to Movie, Game, Book...)')}</span>
              </label>
              {updateType && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updateType && (
              <div className="mt-3 pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                <div>
                  <input
                    type="text"
                    list="bulk-types-list"
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    placeholder={t('np. Film, Gra, Książka...', 'e.g. Movie, Game, Book...')}
                    className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                  />
                  <datalist id="bulk-types-list">
                    {availableTypes.map((tp) => (
                      <option key={tp} value={tp} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a475e] bg-[#141d27]">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs"
                    style={{
                      backgroundColor: targetTypeConfig.bgColor || hexToRgba(targetTypeConfig.color, 0.2),
                      color: targetTypeConfig.iconColor || targetTypeConfig.color,
                    }}
                  >
                    <TargetTypeIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-white">
                    {t('Podgląd:', 'Preview:')} {trType(targetType || '—')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Field: Status */}
          <div className={`p-4 rounded-xl border transition-all ${updateStatus ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateStatus(!updateStatus)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateStatus ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Status', 'Change Status')}</span>
              </label>
              {updateStatus && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updateStatus && (
              <div className="mt-3 pl-6 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in duration-150">
                {(['Ukończone', 'W trakcie', 'Planowane', 'Porzucone'] as ItemStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTargetStatus(st)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      targetStatus === st
                        ? 'bg-[#66c0f4] text-[#141d27] border-[#66c0f4] shadow'
                        : 'bg-[#111720] text-[#c7d5e0] border-[#2a475e] hover:border-[#66c0f4]/50'
                    }`}
                  >
                    {trStatus(st)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Field: Platform / Format */}
          <div className={`p-4 rounded-xl border transition-all ${updatePlatform ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdatePlatform(!updatePlatform)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updatePlatform ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Platformę / Format', 'Change Platform / Format')}</span>
              </label>
              {updatePlatform && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updatePlatform && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="text"
                  list="bulk-platforms-list"
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  placeholder={t('np. PC (Cyfrowa), PS5, Netflix...', 'e.g. PC (Digital), PS5, Netflix...')}
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
                <datalist id="bulk-platforms-list">
                  {platforms.map((plat) => (
                    <option key={plat} value={plat} />
                  ))}
                </datalist>
              </div>
            )}
          </div>

          {/* 4. Field: Genre */}
          <div className={`p-4 rounded-xl border transition-all ${updateGenre ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateGenre(!updateGenre)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateGenre ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Gatunek', 'Change Genre')}</span>
              </label>
              {updateGenre && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updateGenre && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="text"
                  list="bulk-genres-list"
                  value={targetGenre}
                  onChange={(e) => setTargetGenre(e.target.value)}
                  placeholder={t('np. RPG, Sci-Fi, Fantasy...', 'e.g. RPG, Sci-Fi, Fantasy...')}
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
                <datalist id="bulk-genres-list">
                  {genres.map((gn) => (
                    <option key={gn} value={gn} />
                  ))}
                </datalist>
              </div>
            )}
          </div>

          {/* 4.5. Field: Creator / Creators (after Genre) */}
          <div className={`p-4 rounded-xl border transition-all ${updateCreator ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateCreator(!updateCreator)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateCreator ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Twórcę / Twórców (Autor, Reżyser, Studio...)', 'Change Creator / Creators (Author, Director, Studio...)')}</span>
              </label>
              {updateCreator && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updateCreator && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="text"
                  list="bulk-creators-list"
                  value={targetCreator}
                  onChange={(e) => setTargetCreator(e.target.value)}
                  placeholder={t('np. CD Projekt RED, Andy Weir, Denis Villeneuve...', 'e.g. CD Projekt RED, Andy Weir, Denis Villeneuve...')}
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
                <datalist id="bulk-creators-list">
                  {creators.map((cr) => (
                    <option key={cr} value={cr} />
                  ))}
                </datalist>
              </div>
            )}
          </div>

          {/* 5. Field: Rating */}
          <div className={`p-4 rounded-xl border transition-all ${updateRating ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateRating(!updateRating)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateRating ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Ocenę (dla wszystkich)', 'Change Rating (for all)')}</span>
              </label>
              {updateRating && (
                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{targetRating.toFixed(1)} / {ratingScale}</span>
                </div>
              )}
            </div>

            {updateRating && (
              <div className="mt-3 pl-6 flex items-center gap-4 animate-in fade-in duration-150">
                <input
                  type="range"
                  min="0.5"
                  max={ratingScale}
                  step="0.5"
                  value={targetRating}
                  onChange={(e) => setTargetRating(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="font-mono font-bold text-amber-400 text-base min-w-[50px] text-right">
                  {targetRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* 6. Field: Year */}
          <div className={`p-4 rounded-xl border transition-all ${updateYear ? 'bg-[#1e2f42] border-[#66c0f4]' : 'bg-[#17212d] border-[#243547]'}`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label
                onClick={() => setUpdateYear(!updateYear)}
                className="flex items-center gap-2.5 cursor-pointer font-bold text-sm text-white select-none"
              >
                {updateYear ? (
                  <CheckSquare className="w-4 h-4 text-[#66c0f4]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8f98a0]" />
                )}
                <span>{t('Zmień Rok Wydania (np. 2026)', 'Change Release Year (e.g. 2026)')}</span>
              </label>
              {updateYear && (
                <span className="text-[11px] font-bold text-[#66c0f4] uppercase tracking-wider">
                  {t('Aktywne', 'Active')}
                </span>
              )}
            </div>

            {updateYear && (
              <div className="mt-3 pl-6 animate-in fade-in duration-150">
                <input
                  type="number"
                  min="1800"
                  max="2100"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  placeholder="np. 2026"
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#66c0f4]"
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2a475e] bg-[#141d27] flex items-center justify-between gap-3">
          <p className="text-xs text-[#8f98a0]">
            {!anyFieldSelected
              ? t('Wybierz przynajmniej jedno pole powyżej', 'Select at least one field above')
              : t(`Zmiany obejmą ${selectedItems.length} pozycji`, `Changes will apply to ${selectedItems.length} items`)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {t('Anuluj', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={!anyFieldSelected}
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg ${
                anyFieldSelected
                  ? 'bg-gradient-to-r from-[#66c0f4] to-[#2575fc] text-white hover:brightness-110 active:scale-95 cursor-pointer'
                  : 'bg-[#2a3847] text-[#8f98a0] cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{t(`Zastosuj do ${selectedItems.length} pozycji`, `Apply to ${selectedItems.length} items`)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

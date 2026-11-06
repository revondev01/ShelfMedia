import React, { useState, useEffect } from 'react';
import { MediaItem, ItemType, ItemStatus, DEFAULT_PLATFORMS, DEFAULT_GENRES, DEFAULT_ITEM_TYPES, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, RatingScale } from '../types';
import { 
  X, 
  Save, 
  BookOpen, 
  Star, 
  Clock, 
  Calendar, 
  Trash2, 
  Settings2,
  User
} from 'lucide-react';
import { getMediaTypeConfig, getMediaTypeIcon } from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MediaItem, 'id'>, existingId?: number) => void;
  initialItem?: MediaItem | null;
  onDeleteItem?: (id: number) => void;
  availablePlatforms?: string[];
  availableGenres?: string[];
  availableTypes?: string[];
  availableCreators?: string[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  ratingScale?: RatingScale;
  onOpenOptionsManager?: () => void;
  onQuickAddType?: (name: string) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  onDeleteItem,
  availablePlatforms = DEFAULT_PLATFORMS,
  availableGenres = DEFAULT_GENRES,
  availableTypes = DEFAULT_ITEM_TYPES,
  availableCreators = [],
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  ratingScale = 10,
  onOpenOptionsManager,
  onQuickAddType,
}) => {
  const { t, trType } = useLanguage();
  const defaultRating = ratingScale === 5 ? 4.0 : 8.0;
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<string>('');
  const [itemType, setItemType] = useState<ItemType>('');
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [creator, setCreator] = useState('');
  const [rating, setRating] = useState<number>(defaultRating);
  const [status, setStatus] = useState<ItemStatus>('Ukończone');
  const [hoursSpent, setHoursSpent] = useState<string>('');
  const [pages, setPages] = useState<string>('');
  const [isTimeUntracked, setIsTimeUntracked] = useState<boolean>(false);
  const [dateLogged, setDateLogged] = useState<string>('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Quick inline custom type creation
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newCustomTypeInput, setNewCustomTypeInput] = useState('');

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setYear(initialItem.year ? String(initialItem.year) : '');
      setItemType(initialItem.item_type || '');
      setPlatform(initialItem.platform || '');
      setGenre(initialItem.genre || '');
      setCreator(initialItem.creator || '');
      setRating(Math.min(ratingScale, Math.max(0.5, initialItem.rating || defaultRating)));
      setStatus(initialItem.status || 'Ukończone');
      
      const hasHours = initialItem.hours_spent !== undefined && initialItem.hours_spent !== null;
      setHoursSpent(hasHours ? String(initialItem.hours_spent) : '');
      setIsTimeUntracked(!hasHours);

      setPages(initialItem.pages !== undefined && initialItem.pages !== null ? String(initialItem.pages) : '');
      setDateLogged(initialItem.date_logged || new Date().toISOString().split('T')[0]);
      setComment(initialItem.comment || '');
    } else {
      setTitle('');
      setYear(String(new Date().getFullYear()));
      setItemType(availableTypes[0] || '');
      setPlatform(availablePlatforms[0] || '');
      setGenre('');
      setCreator('');
      setRating(defaultRating);
      setStatus('Ukończone');
      setHoursSpent('');
      setPages('');
      setIsTimeUntracked(false);
      setDateLogged(new Date().toISOString().split('T')[0]);
      setComment('');
    }
    setIsCreatingType(false);
    setNewCustomTypeInput('');
    setError(null);
  }, [initialItem, isOpen, ratingScale, defaultRating, availableTypes, availablePlatforms]);

  if (!isOpen) return null;

  const isBookOrReading = itemType.toLowerCase().includes('książk') || 
                          itemType.toLowerCase().includes('ksiazk') || 
                          itemType.toLowerCase().includes('book') ||
                          itemType.toLowerCase().includes('komiks') || 
                          itemType.toLowerCase().includes('comic') ||
                          itemType.toLowerCase().includes('manga');

  const handleTypeChange = (newType: string) => {
    if (newType === '__ADD_NEW__') {
      setIsCreatingType(true);
      return;
    }
    setItemType(newType);
  };

  const handleSaveInlineCustomType = () => {
    const trimmed = newCustomTypeInput.trim();
    if (!trimmed) {
      setIsCreatingType(false);
      return;
    }
    if (onQuickAddType) {
      onQuickAddType(trimmed);
    }
    setItemType(trimmed);
    setIsCreatingType(false);
    setNewCustomTypeInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('Tytuł dzieła jest wymagany!', 'Title is required!'));
      return;
    }

    const finalType = (isCreatingType && newCustomTypeInput.trim())
      ? newCustomTypeInput.trim()
      : itemType.trim();

    if (!finalType) {
      setError(t('Podaj lub wybierz typ medium (np. Gra, Książka, Film)!', 'Please enter or select a media type (e.g. Game, Book, Movie)!'));
      return;
    }

    let parsedYear: number | null = null;
    if (year.trim()) {
      const yNum = Math.round(parseFloat(year.trim().replace(/\s+/g, '').replace(',', '.')));
      if (isNaN(yNum) || yNum < 1000 || yNum > 2100) {
        setError(t('Podaj poprawny rok premiery / wydania!', 'Please enter a valid release year!'));
        return;
      }
      parsedYear = yNum;
    }

    // Parse optional hours
    let parsedHours: number | null = null;
    if (!isTimeUntracked && hoursSpent.trim()) {
      const h = parseFloat(hoursSpent.replace(',', '.'));
      if (isNaN(h) || h < 0) {
        setError(
          t(
            'Czas musi być poprawną liczbą godzin (np. 15.5) lub zaznacz opcję pominięcia pomiaru czasu',
            'Time must be a valid number of hours (e.g. 15.5) or check the option to skip time tracking'
          )
        );
        return;
      }
      parsedHours = Number(h.toFixed(1));
    }

    // Parse optional pages
    let parsedPages: number | null = null;
    if (pages.trim()) {
      const p = Math.round(parseFloat(pages.trim().replace(/\s+/g, '').replace(',', '.')));
      if (isNaN(p) || p <= 0) {
        setError(t('Liczba stron musi być liczbą całkowitą większą od zera', 'Page count must be a positive integer'));
        return;
      }
      parsedPages = p;
    }

    onSave(
      {
        title: title.trim(),
        year: parsedYear,
        item_type: finalType,
        platform: platform.trim() || (isBookOrReading ? 'Książka papierowa' : 'Inna'),
        genre: genre.trim() || 'Inny',
        creator: creator.trim(),
        rating,
        status,
        hours_spent: parsedHours,
        pages: parsedPages,
        date_logged: dateLogged.trim() || new Date().toISOString().split('T')[0],
        comment: comment.trim(),
      },
      initialItem ? initialItem.id : undefined
    );

    onClose();
  };

  const getTypeIcon = (type: string) => {
    const config = getMediaTypeConfig(type, typeConfigs);
    const IconComponent = getMediaTypeIcon(config.icon);
    return <IconComponent className="w-5 h-5" style={{ color: config.color }} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2a475e] flex items-center justify-center">
              {getTypeIcon(itemType)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialItem
                  ? t('Edytuj pozycję', 'Edit item')
                  : itemType
                  ? `${t('Dodaj nową pozycję', 'Add new item')} (${trType(itemType)})`
                  : t('Dodaj nową pozycję', 'Add new item')}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {initialItem
                  ? t('Aktualizacja wpisu w bibliotece', 'Updating library entry')
                  : t('Nowe typy i platformy otrzymają losowy kolor automatycznie', 'New types and platforms will automatically receive a random color')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8f98a0] hover:text-white rounded-lg hover:bg-[#2a475e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[#3d1919] border border-[#c23838] text-[#ff7878] px-3.5 py-2 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5">
              {t('Tytuł / Dzieło', 'Title / Work')} <span className="text-[#e74c3c]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                isBookOrReading
                  ? t('np. Projekt Hail Mary, Diuna, Wiedźmin', 'e.g. Project Hail Mary, Dune, The Witcher')
                  : t('np. Wiedźmin 3, Oppenheimer, Szogun', 'e.g. The Witcher 3, Oppenheimer, Shogun')
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
            />
          </div>

          {/* Row 1: Customizable Type & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0]">
                  {t('Typ medium', 'Media type')} <span className="text-[#e74c3c]">*</span>
                </label>
                {onOpenOptionsManager && (
                  <button
                    type="button"
                    onClick={onOpenOptionsManager}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] transition-colors"
                    title={t('Zarządzaj listą typów mediów', 'Manage media types list')}
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>{t('Zarządzaj typami', 'Manage types')}</span>
                  </button>
                )}
              </div>

              {availableTypes.length === 0 ? (
                <input
                  type="text"
                  required
                  placeholder={t('np. Gra, Książka, Film, Serial...', 'e.g. Game, Book, Movie, Series...')}
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              ) : !isCreatingType ? (
                <div className="relative">
                  <select
                    value={itemType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                  >
                    {availableTypes.map((tp) => (
                      <option key={tp} value={tp}>
                        {trType(tp)}
                      </option>
                    ))}
                    <option value="__ADD_NEW__" className="text-amber-400 font-bold bg-[#1e2a38]">
                      + {t('Dodaj własny typ...', 'Add custom type...')}
                    </option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder={t('Wpisz nazwę typu (np. Gra, Książka)...', 'Enter type name (e.g. Game, Book)...')}
                    value={newCustomTypeInput}
                    onChange={(e) => setNewCustomTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveInlineCustomType();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-[#171a21] border border-amber-500 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveInlineCustomType}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingType(false)}
                    className="px-2 py-2 bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5">
                {t('Rok wyjścia dzieła', 'Release year')}
              </label>
              <input
                type="number"
                placeholder="2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
              />
            </div>
          </div>

          {/* Row 2: Platform & Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0]">
                  {isBookOrReading ? t('Format / Czytnik', 'Format / Reader') : t('Platforma / Usługa', 'Platform / Service')}
                </label>
                {onOpenOptionsManager && (
                  <button
                    type="button"
                    onClick={onOpenOptionsManager}
                    className="text-[#66c0f4] hover:text-[#9cd7fb] flex items-center gap-1 text-[11px] transition-colors"
                    title={t('Zarządzaj listą platform i formatów', 'Manage platforms and formats list')}
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>{t('Edytuj', 'Edit')}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                list="platforms-list"
                placeholder={
                  isBookOrReading
                    ? t('Książka papierowa, Kindle, Legimi...', 'Paperback, Kindle, Audible...')
                    : t('PC (Cyfrowa), PS5, Netflix...', 'PC (Digital), PS5, Netflix...')
                }
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
              />
              <datalist id="platforms-list">
                {availablePlatforms.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0]">
                  {t('Gatunek', 'Genre')}
                </label>
                {onOpenOptionsManager && (
                  <button
                    type="button"
                    onClick={onOpenOptionsManager}
                    className="text-[#a4d007] hover:text-[#bcee10] flex items-center gap-1 text-[11px] transition-colors"
                    title={t('Zarządzaj listą gatunków', 'Manage genres list')}
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>{t('Edytuj', 'Edit')}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                list="genres-list"
                placeholder={t('np. Sci-Fi, Fantasy, RPG, Kryminał', 'e.g. Sci-Fi, Fantasy, RPG, Thriller')}
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
              />
              <datalist id="genres-list">
                {availableGenres.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2.5: Creator / Creators (after Genre) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#66c0f4]" />
              <span>{t('Twórca / Twórcy (Autor, Reżyser, Studio...)', 'Creator / Creators (Author, Director, Studio...)')}</span>
            </label>
            <input
              type="text"
              list="creators-list"
              placeholder={t('np. CD Projekt RED, Andy Weir, Denis Villeneuve, FromSoftware...', 'e.g. CD Projekt RED, Andy Weir, Denis Villeneuve, FromSoftware...')}
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
            />
            <datalist id="creators-list">
              {availableCreators.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Row 3: Status & Rating Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5">
                Status <span className="text-[#e74c3c]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4] cursor-pointer"
              >
                <option value="Ukończone">● {t('Ukończone (Przeczytane/Ograne)', 'Completed (Read/Played/Watched)')}</option>
                <option value="W trakcie">● {t('W trakcie', 'In Progress')}</option>
                <option value="Porzucone">● {t('Porzucone', 'Dropped')}</option>
                <option value="Planowane">● {t('Planowane (Na później)', 'Planned (Backlog)')}</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0]">
                  {t(`Ocena dzieła (0.5–${ratingScale})`, `Rating (0.5–${ratingScale})`)}
                </label>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {rating.toFixed(1)} / {ratingScale}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max={ratingScale}
                step="0.5"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value))}
                className="w-full accent-[#66c0f4] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Row 4: Book Pages (Liczba stron) + Optional Time (Czas h) */}
          <div className="p-3.5 bg-[#141b24] rounded-xl border border-[#243547] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Liczba stron */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#e0a96d] mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#e0a96d]" />
                  <span>{t('Liczba stron', 'Page count')}</span>
                  {isBookOrReading ? (
                    <span className="text-[10px] text-amber-300 font-normal ml-1">{t('(dla książki)', '(for books)')}</span>
                  ) : (
                    <span className="text-[10px] text-[#8f98a0] font-normal ml-1">{t('(opcjonalna)', '(optional)')}</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder={t('np. 496 stron', 'e.g. 496 pages')}
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#e0a96d]"
                />
              </div>

              {/* Czas spędzony w godzinach (opcjonalny) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#66c0f4]" />
                    <span>{isBookOrReading ? t('Czas (h) — opcjonalny', 'Time (h) — optional') : t('Czas spędzony (h)', 'Time spent (h)')}</span>
                  </label>
                  <label className="text-[11px] text-[#8f98a0] hover:text-[#66c0f4] flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTimeUntracked}
                      onChange={(e) => {
                        setIsTimeUntracked(e.target.checked);
                        if (e.target.checked) setHoursSpent('');
                      }}
                      className="rounded accent-[#66c0f4] cursor-pointer"
                    />
                    <span>{t('Bez pomiaru czasu', 'Untracked time')}</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={isTimeUntracked}
                  placeholder={
                    isTimeUntracked
                      ? t('Czas wyłączony dla tej pozycji', 'Time tracking disabled for this item')
                      : isBookOrReading
                      ? t('np. 18.5 (audiobook lub czytanie) — opcjonalnie', 'e.g. 18.5 (audiobook or reading) — optional')
                      : t('np. 15.5 (opcjonalnie)', 'e.g. 15.5 (optional)')
                  }
                  value={isTimeUntracked ? '' : hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-[#171a21] border rounded-lg text-sm text-white focus:outline-none ${
                    isTimeUntracked
                      ? 'border-[#243547] text-[#8f98a0] opacity-50 cursor-not-allowed'
                      : 'border-[#2a475e] focus:border-[#66c0f4]'
                  }`}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#8f98a0]">
              💡 <strong>{t('Wskazówka:', 'Tip:')}</strong>{' '}
              {t(
                'Dla książek czas jest w 100% opcjonalny — możesz wpisać tylko liczbę stron (np. dla wydań papierowych i e-booków) albo czas słuchania audiobooka. Możesz też pominąć pomiar czasu dla dowolnego medium.',
                'For books, time is 100% optional — you can enter only the page count (e.g. for print books and e-books) or audiobook listening hours. You can also skip time tracking for any media type.'
              )}
            </p>
          </div>

          {/* Row 5: Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#66c0f4]" /> {t('Data oceny / ukończenia', 'Date rated / completed')}
            </label>
            <input
              type="date"
              value={dateLogged}
              onChange={(e) => setDateLogged(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
            />
          </div>

          {/* Comment / Review */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#c7d5e0] mb-1.5">
              {t('Własna recenzja / notatki', 'Personal review / notes')}
            </label>
            <textarea
              rows={3}
              placeholder={t(
                'Wpisz swoje wrażenia, opinię o fabule, lektorze, mechanice lub wykonaniu...',
                'Write your thoughts, opinion on the story, narrator, gameplay mechanics, or execution...'
              )}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#171a21] border border-[#2a475e] rounded-lg text-sm text-white focus:outline-none focus:border-[#66c0f4]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2a475e] flex items-center justify-between gap-3">
            {initialItem && onDeleteItem ? (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    t(
                      `Czy na pewno chcesz bezpowrotnie usunąć z bazy:\n\n"${initialItem.title}"?`,
                      `Are you sure you want to permanently delete from the database:\n\n"${initialItem.title}"?`
                    )
                  );
                  if (confirmed) {
                    onDeleteItem(initialItem.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 hover:text-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title={t('Usuń tę pozycję z bazy', 'Delete this item from database')}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{t('Usuń z bazy', 'Delete item')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {t('Anuluj', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white text-sm font-bold rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialItem ? t('Zapisz zmiany', 'Save changes') : t('Dodaj do biblioteki', 'Add to library')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

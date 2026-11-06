import React from 'react';
import { MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, RatingScale } from '../types';
import { 
  X, 
  Star, 
  Clock, 
  Calendar, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Quote
} from 'lucide-react';
import { 
  getMediaTypeConfig, 
  getMediaTypeIcon, 
  hexToRgba
} from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface ItemDetailModalProps {
  item: MediaItem;
  typeConfigs?: Record<string, MediaTypeConfig>;
  ratingScale?: RatingScale;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  ratingScale = 10,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t, trType, trStatus, trPlatform, trGenre } = useLanguage();
  const config = getMediaTypeConfig(item.item_type, typeConfigs);
  const TypeIcon = getMediaTypeIcon(config.icon);
  const baseColor = config.color;

  const getStatusBadge = (status: string) => {
    const label = trStatus(status);
    switch (status) {
      case 'Ukończone':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1a3d16] text-[#a4d007] border border-[#2b5d25]">
            ● {label}
          </span>
        );
      case 'W trakcie':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3d2c14] text-[#f39c12] border border-[#684a1e]">
            ● {label}
          </span>
        );
      case 'Porzucone':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3d1919] text-[#e74c3c] border border-[#632727]">
            ● {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#212b3b] text-[#8f98a0] border border-[#314159]">
            ● {label}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#1b2838] border-2 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden relative"
        style={{ borderColor: hexToRgba(baseColor, 0.6) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header with custom type color */}
        <div 
          className="p-6 relative text-white"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(baseColor, 0.85)} 0%, #171f2d 85%)`
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow"
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderColor: baseColor,
                color: '#ffffff'
              }}
            >
              <TypeIcon className="w-3.5 h-3.5" style={{ color: baseColor }} />
              {trType(item.item_type)}
            </span>
            {item.year && (
              <span className="text-xs font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded border border-white/20">
                {item.year}
              </span>
            )}
            {getStatusBadge(item.status)}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            {item.title}
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-sm text-white/90">
            <span className="font-semibold">{trPlatform(item.platform)}</span>
            <span>•</span>
            <span className="text-white/80">{trGenre(item.genre)}</span>
            {item.creator && (
              <>
                <span>•</span>
                <span className="text-white/95 font-medium">{item.creator}</span>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#171a21] p-3.5 rounded-xl border border-[#2a475e]">
              <span className="text-[11px] font-bold text-[#8f98a0] uppercase block mb-1">
                {t('Ocena', 'Rating')}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-lg font-mono">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{item.rating.toFixed(1)}</span>
                <span className="text-xs text-[#8f98a0] font-normal">/ {ratingScale}</span>
              </div>
            </div>

            <div className="bg-[#171a21] p-3.5 rounded-xl border border-[#2a475e]">
              <span className="text-[11px] font-bold text-[#8f98a0] uppercase block mb-1">
                {t('Objętość / Czas', 'Volume / Time')}
              </span>
              <div className="font-mono text-sm">
                {item.hours_spent !== null && item.hours_spent !== undefined ? (
                  <div className="flex items-center gap-1 text-[#66c0f4] font-bold">
                    <Clock className="w-4 h-4" />
                    <span>{item.hours_spent.toFixed(1)} h</span>
                  </div>
                ) : item.pages ? (
                  <div className="flex items-center gap-1 text-orange-400 font-bold">
                    <BookOpen className="w-4 h-4" />
                    <span>{item.pages} {t('stron', 'pages')}</span>
                  </div>
                ) : (
                  <span className="text-[#8f98a0] text-xs">{t('Czas opcjonalny', 'Optional time')}</span>
                )}
                {item.pages && item.hours_spent !== null && item.hours_spent !== undefined && (
                  <div className="text-[11px] text-[#8f98a0] mt-0.5">
                    ({item.pages} {t('stron', 'pages')})
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#171a21] p-3.5 rounded-xl border border-[#2a475e] col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-[#8f98a0] uppercase block mb-1">
                {t('Data ukończenia', 'Date Completed')}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#c7d5e0]">
                <Calendar className="w-4 h-4 text-[#8f98a0]" />
                <span>{item.date_logged || t('Brak daty', 'No date')}</span>
              </div>
            </div>
          </div>

          {/* Comment / Review Box */}
          <div className="bg-[#171a21] p-4 rounded-xl border border-[#2a475e]">
            <span className="text-xs font-bold text-[#8f98a0] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Quote className="w-3.5 h-3.5 text-[#66c0f4]" />
              {t('Twoja Recenzja / Notatka:', 'Your Review / Note:')}
            </span>
            {item.comment ? (
              <p className="text-sm text-[#e5e9f0] leading-relaxed italic bg-[#101722] p-3.5 rounded-lg border border-[#243547]">
                "{item.comment}"
              </p>
            ) : (
              <p className="text-xs text-[#8f98a0] italic py-2">
                {t(
                  'Brak notatki dla tego dzieła. Kliknij "Edytuj dzieło", aby dodać swoje wrażenia i recenzję.',
                  'No note for this item. Click "Edit item" to add your thoughts and review.'
                )}
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#2a475e]">
            <button
              onClick={() => onDelete(item)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('Usuń z biblioteki', 'Delete from library')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('Zamknij', 'Close')}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1999e3] to-[#007cc2] hover:from-[#21a4f0] hover:to-[#0089d7] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('Edytuj dzieło', 'Edit item')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

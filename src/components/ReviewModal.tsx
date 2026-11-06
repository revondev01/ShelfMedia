import React from 'react';
import { MediaItem, RatingScale } from '../types';
import { X, Star, Calendar, Gamepad2, Film, Tv, BookOpen, BookMarked, Radio, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n';

interface ReviewModalProps {
  item: MediaItem | null;
  ratingScale?: RatingScale;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ item, ratingScale = 10, onClose }) => {
  const { t, trType, trStatus, trPlatform, trGenre } = useLanguage();

  if (!item) return null;

  const getMediaIcon = () => {
    const typeLower = item.item_type.toLowerCase();
    if (typeLower.includes('książk') || typeLower.includes('ksiazk')) {
      return <BookOpen className="w-5 h-5 text-[#e0a96d]" />;
    }
    if (typeLower.includes('komiks') || typeLower.includes('manga')) {
      return <BookMarked className="w-5 h-5 text-amber-300" />;
    }
    if (typeLower.includes('gra')) {
      return <Gamepad2 className="w-5 h-5 text-[#66c0f4]" />;
    }
    if (typeLower.includes('film')) {
      return <Film className="w-5 h-5 text-[#d48cf0]" />;
    }
    if (typeLower.includes('serial')) {
      return <Tv className="w-5 h-5 text-[#67db9f]" />;
    }
    if (typeLower.includes('podcast')) {
      return <Radio className="w-5 h-5 text-emerald-400" />;
    }
    return <Sparkles className="w-5 h-5 text-amber-400" />;
  };

  const hasHours = item.hours_spent !== undefined && item.hours_spent !== null;
  const hasPages = item.pages !== undefined && item.pages !== null && item.pages > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-[#171a21] px-6 py-4 border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#2a475e] flex items-center justify-center">
              {getMediaIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{item.title}</h3>
              <p className="text-xs text-[#8f98a0]">
                {trType(item.item_type)} • {trPlatform(item.platform)} • {trGenre(item.genre)}{item.creator ? ` • ${item.creator}` : ''} {item.year ? `(${item.year})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8f98a0] hover:text-white rounded-lg hover:bg-[#2a475e] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick stats strip */}
          <div className={`grid ${hasPages && hasHours ? 'grid-cols-4' : 'grid-cols-3'} gap-2 bg-[#171a21] p-3 rounded-lg border border-[#2a475e]/60 text-center`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8f98a0] block">{t('Ocena', 'Rating')}</span>
              <span className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {item.rating.toFixed(1)} / {ratingScale}
              </span>
            </div>

            {hasPages && (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#e0a96d] block">{t('Strony', 'Pages')}</span>
                <span className="text-sm font-bold text-[#e0a96d] font-mono mt-0.5 block">
                  {item.pages} {t('str.', 'p.')}
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8f98a0] block">{t('Czas', 'Time')}</span>
              <span className="text-sm font-bold text-[#66c0f4] font-mono mt-0.5 block">
                {hasHours ? `${item.hours_spent!.toFixed(1)} h` : <span className="text-[#8f98a0] font-normal text-xs">{t('— (brak)', '— (none)')}</span>}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#8f98a0] block">{t('Status', 'Status')}</span>
              <span className="text-xs font-semibold text-[#a4d007] mt-1 block">
                {trStatus(item.status)}
              </span>
            </div>
          </div>

          {/* Comment content */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8f98a0] mb-2">
              {t('Recenzja / Notatka', 'Review / Note')}
            </h4>
            <div className="bg-[#171a21] p-4 rounded-lg border border-[#2a475e] text-sm text-[#e5e9f0] whitespace-pre-wrap leading-relaxed">
              {item.comment ? item.comment : <span className="text-[#8f98a0] italic">{t('Brak wpisanej recenzji dla tego tytułu.', 'No review written for this title.')}</span>}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#8f98a0] pt-2 border-t border-[#243547]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#66c0f4]" /> {t('Data ukończenia:', 'Date completed:')} {item.date_logged || '—'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#2a475e] hover:bg-[#385e80] text-white rounded font-medium transition-colors cursor-pointer"
            >
              {t('Zamknij', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

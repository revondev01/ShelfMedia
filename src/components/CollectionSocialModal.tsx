import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Check, 
  Sparkles, 
  Square, 
  Smartphone, 
  Monitor, 
  Palette,
  Sliders,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Collection, MediaItem, MediaTypeConfig, DEFAULT_TYPE_CONFIGS, RatingScale } from '../types';
import { getMediaTypeConfig, drawMediaTypeIconOnCanvas, hexToRgba } from '../utils/mediaTypeUtils';
import { GradientPreset, DEFAULT_GRADIENT_PRESETS } from './SocialCardModal';
import { useLanguage } from '../i18n';

interface CollectionSocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  items: MediaItem[];
  typeConfigs?: Record<string, MediaTypeConfig>;
  ratingScale?: RatingScale;
  userName?: string;
}

const SAVED_GRADIENTS_KEY = 'shelfmedia_saved_gradients_v1';

export const CollectionSocialModal: React.FC<CollectionSocialModalProps> = ({
  isOpen,
  onClose,
  collection,
  items,
  typeConfigs = DEFAULT_TYPE_CONFIGS,
  ratingScale = 10,
  userName = '',
}) => {
  const { lang, t, trType, trPlatform, trGenre } = useLanguage();
  const [aspectRatio, setAspectRatio] = useState<'square' | 'story' | 'landscape'>('square');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingBatch, setIsDownloadingBatch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gradient state (shared with SocialCardModal)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('steam');
  const [customStart, setCustomStart] = useState<string>('#0d131b');
  const [customMid, setCustomMid] = useState<string>('#171d25');
  const [customEnd, setCustomEnd] = useState<string>('#1b2838');
  const [customAccent, setCustomAccent] = useState<string>(collection.accentColor || '#66c0f4');
  const [gradientDirection, setGradientDirection] = useState<'diagonal' | 'vertical' | 'radial'>('diagonal');
  const [showColorPickers, setShowColorPickers] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [newGradientName, setNewGradientName] = useState<string>('');

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

  // Order items according to collection.itemIds
  const collectionItems = useMemo(() => {
    const map = new Map<number, MediaItem>();
    items.forEach((i) => map.set(i.id, i));
    const result: MediaItem[] = [];
    collection.itemIds.forEach((id) => {
      const it = map.get(id);
      if (it) result.push(it);
    });
    return result;
  }, [collection, items]);

  const totalPagesCount = useMemo(() => {
    return Math.max(1, Math.ceil(collectionItems.length / itemsPerPage));
  }, [collectionItems.length, itemsPerPage]);

  // Keep currentPage in range
  useEffect(() => {
    if (currentPage >= totalPagesCount) {
      setCurrentPage(Math.max(0, totalPagesCount - 1));
    }
  }, [totalPagesCount, currentPage]);

  // Collection summary metrics
  const stats = useMemo(() => {
    const count = collectionItems.length;
    if (count === 0) return { count: 0, avgRating: 0, totalHours: 0, totalPages: 0 };
    const totalRating = collectionItems.reduce((acc, curr) => acc + curr.rating, 0);
    const totalHours = collectionItems.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
    const totalPages = collectionItems.reduce((acc, curr) => acc + (curr.pages || 0), 0);
    return {
      count,
      avgRating: Number((totalRating / count).toFixed(1)),
      totalHours: Number(totalHours.toFixed(1)),
      totalPages,
    };
  }, [collectionItems]);

  // Core canvas drawing function for any page index (0-based)
  const renderPageToCanvas = useCallback(
    (targetCanvas: HTMLCanvasElement, pageIndex: number) => {
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return;

      let width = 1440;
      let height = 1440;

      if (aspectRatio === 'story') {
        width = 1080;
        height = 1920;
      } else if (aspectRatio === 'landscape') {
        width = 1920;
        height = 1080;
      }

      targetCanvas.width = width;
      targetCanvas.height = height;

      // Background Gradient (diagonal, vertical, or radial)
      let bgGrad: CanvasGradient;
      if (gradientDirection === 'vertical') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      } else if (gradientDirection === 'radial') {
        bgGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.08,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
      } else {
        bgGrad = ctx.createLinearGradient(0, 0, width, height);
      }
      bgGrad.addColorStop(0, customStart);
      bgGrad.addColorStop(0.5, customMid);
      bgGrad.addColorStop(1, customEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle glowing accent orbs
      const orb1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, width * 0.4);
      orb1.addColorStop(0, hexToRgba(customAccent, 0.14));
      orb1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, width, height);

      // Helpers
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

      const truncate = (text: string, maxWidth: number, font: string): string => {
        ctx.font = font;
        if (ctx.measureText(text).width <= maxWidth) return text;
        let cur = text;
        while (cur.length > 0 && ctx.measureText(cur + '...').width > maxWidth) {
          cur = cur.slice(0, -1);
        }
        return cur + '...';
      };

      // Tech corners
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 3;
      const cornerSize = 40;
      const margin = 30;

      ctx.beginPath();
      ctx.moveTo(margin, margin + cornerSize);
      ctx.lineTo(margin, margin);
      ctx.lineTo(margin + cornerSize, margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - margin - cornerSize, margin);
      ctx.lineTo(width - margin, margin);
      ctx.lineTo(width - margin, margin + cornerSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(margin, height - margin - cornerSize);
      ctx.lineTo(margin, height - margin);
      ctx.lineTo(margin + cornerSize, height - margin);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - margin - cornerSize, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.lineTo(width - margin, height - margin - cornerSize);
      ctx.stroke();

      const padX = aspectRatio === 'story' ? 56 : 64;
      const contentW = width - padX * 2;

      // 1. Header Section (No @ symbol in userName)
      const curatorLabel = userName.trim() ? userName.trim() : 'ShelfMedia';
      const pageLabel =
        totalPagesCount > 1
          ? ` • ${t(`CZĘŚĆ ${pageIndex + 1}/${totalPagesCount}`, `PART ${pageIndex + 1}/${totalPagesCount}`)}`
          : '';

      drawMediaTypeIconOnCanvas(ctx, 'Sparkles', padX + 10, 75, 20, customAccent, 2.2);
      ctx.fillStyle = customAccent;
      ctx.font = 'bold 20px "Segoe UI", Inter, sans-serif';
      ctx.fillText(
        `${t('KOLEKCJA MEDIÓW', 'MEDIA COLLECTION')} • ${curatorLabel.toUpperCase()}${pageLabel}`,
        padX + 28,
        82
      );

      // Collection Vector Icon Badge + Title
      const colIconName = collection.icon || 'Layers';
      const colBadgeSize = 44;
      const colBadgeY = 98;
      ctx.save();
      roundRect(padX, colBadgeY, colBadgeSize, colBadgeSize, 10);
      ctx.fillStyle = collection.bgColor || hexToRgba(customAccent, 0.22);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = hexToRgba(customAccent, 0.55);
      ctx.stroke();
      drawMediaTypeIconOnCanvas(
        ctx,
        colIconName,
        padX + colBadgeSize / 2,
        colBadgeY + colBadgeSize / 2,
        24,
        collection.iconColor || customAccent,
        2.2
      );
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px "Segoe UI", Inter, sans-serif';
      ctx.fillText(truncate(collection.title, contentW - 58, '900 44px "Segoe UI"'), padX + 58, 136);

      // Description or subtitle
      const descText =
        collection.description?.trim() ||
        t('Specjalna kolekcja wyselekcjonowanych dzieł', 'Curated custom media collection');
      ctx.fillStyle = '#9aa5b1';
      ctx.font = '16px "Segoe UI", Inter, sans-serif';
      ctx.fillText(truncate(descText, contentW, '16px "Segoe UI"'), padX, 168);

      // Stats bar pill
      const statsY = 190;
      const statsH = 46;
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = hexToRgba(customAccent, 0.45);
      ctx.lineWidth = 1.5;
      roundRect(padX, statsY, contentW, statsH, 12);
      ctx.fill();
      ctx.stroke();

      drawMediaTypeIconOnCanvas(ctx, 'Layers', padX + 28, statsY + 23, 17, customAccent, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
      let statsStr = `${stats.count} ${t('pozycji', 'items')}   •   ★ ${t('Średnia:', 'Average:')} ${stats.avgRating}/${ratingScale}`;
      if (stats.totalHours > 0) statsStr += `   •   ${stats.totalHours} h`;
      if (stats.totalPages > 0) statsStr += `   •   ${stats.totalPages} ${t('str.', 'p.')}`;
      if (totalPagesCount > 1) {
        const startRank = pageIndex * itemsPerPage + 1;
        const endRank = Math.min(collectionItems.length, (pageIndex + 1) * itemsPerPage);
        statsStr += `   •   #${startRank}–#${endRank}`;
      }
      ctx.fillText(truncate(statsStr, contentW - 64, 'bold 16px "Segoe UI"'), padX + 44, statsY + 29);

      // 2. Slice items for this page
      const pageItems = collectionItems.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage);
      const startRankIndex = pageIndex * itemsPerPage;

      const listStartY = 256;
      const footerH = 48;
      const availH = height - listStartY - footerH - 36;

      if (pageItems.length === 0) {
        ctx.fillStyle = '#8f98a0';
        ctx.font = 'italic 20px "Segoe UI", Inter, sans-serif';
        ctx.fillText(
          t('Kolekcja nie zawiera jeszcze żadnych pozycji.', 'This collection has no items yet.'),
          padX,
          listStartY + 50
        );
      } else {
        // Choose optimal columns so up to 36 items fit comfortably on a single graphic
        let cols = 1;
        if (aspectRatio === 'landscape') {
          cols = pageItems.length > 16 ? 3 : 2;
        } else if (aspectRatio === 'square') {
          cols = pageItems.length > 12 ? 2 : 1;
        } else {
          // story (9:16)
          cols = pageItems.length > 18 ? 2 : 1;
        }

        const gapX = 18;
        const colW = (contentW - gapX * (cols - 1)) / cols;
        const rowsCount = Math.ceil(pageItems.length / cols);
        const gapY = rowsCount > 12 ? 6 : 8;
        const cardH = Math.max(46, Math.min(86, Math.floor((availH - gapY * (rowsCount - 1)) / rowsCount)));

        pageItems.forEach((item, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cx = padX + col * (colW + gapX);
          const cy = listStartY + row * (cardH + gapY);
          drawItemCard(ctx, cx, cy, colW, cardH, item, startRankIndex + idx + 1);
        });
      }

      // Helper: draw single item card with custom icon color & background
      function drawItemCard(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        item: MediaItem,
        rank: number
      ) {
        const isCompact = h < 62;
        c.fillStyle = '#171a21';
        c.strokeStyle = '#2a475e';
        c.lineWidth = 1.2;
        roundRect(x, y, w, h, isCompact ? 8 : 12);
        c.fill();
        c.stroke();

        const typeCfg = getMediaTypeConfig(item.item_type, typeConfigs);

        // Rank badge (#1, #2...)
        c.fillStyle = customAccent;
        c.font = `bold ${isCompact ? 13 : 15}px "Segoe UI", Inter, sans-serif`;
        c.fillText(`#${rank}`, x + 12, y + Math.round(h * 0.58));

        // Media Type pill with custom vector icon, icon color and bg
        const pillX = x + (rank >= 100 ? 52 : 44);
        const pillH = isCompact ? 22 : 26;
        const pillY = y + Math.round((h - pillH) / 2);
        const pillW = isCompact ? 76 : 86;

        c.fillStyle = typeCfg.bgColor || hexToRgba(typeCfg.color, 0.22);
        c.strokeStyle = hexToRgba(typeCfg.color, 0.6);
        c.lineWidth = 1;
        roundRect(pillX, pillY, pillW, pillH, 6);
        c.fill();
        c.stroke();

        const iconColor = typeCfg.iconColor || '#ffffff';
        drawMediaTypeIconOnCanvas(
          c,
          typeCfg.icon,
          pillX + (isCompact ? 12 : 14),
          pillY + pillH / 2,
          isCompact ? 12 : 13,
          iconColor,
          2.2
        );

        c.fillStyle = iconColor;
        c.font = `bold ${isCompact ? 11 : 12}px "Segoe UI", Inter, sans-serif`;
        c.fillText(
          truncate(trType(item.item_type), pillW - (isCompact ? 24 : 28), `bold ${isCompact ? 11 : 12}px "Segoe UI"`),
          pillX + (isCompact ? 21 : 24),
          pillY + (isCompact ? 15 : 18)
        );

        // Rating on right
        const ratingBoxW = isCompact ? 64 : 74;
        const ratingBoxH = isCompact ? 26 : 32;
        const ratingBoxX = x + w - ratingBoxW - 12;
        const ratingBoxY = y + Math.round((h - ratingBoxH) / 2);

        c.fillStyle = '#131b24';
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 1;
        roundRect(ratingBoxX, ratingBoxY, ratingBoxW, ratingBoxH, 7);
        c.fill();
        c.stroke();

        c.fillStyle = '#f59e0b';
        c.font = `900 ${isCompact ? 13 : 15}px "Segoe UI", Inter, sans-serif`;
        c.fillText(`★ ${item.rating.toFixed(1)}`, ratingBoxX + 9, ratingBoxY + (isCompact ? 18 : 22));

        // Title & Year
        const titleX = pillX + pillW + 12;
        const maxTitleW = Math.max(80, ratingBoxX - titleX - 12);

        const yearText = item.year ? ` (${item.year})` : '';
        if (isCompact) {
          c.fillStyle = '#ffffff';
          c.font = 'bold 14px "Segoe UI", Inter, sans-serif';
          c.fillText(
            truncate(`${item.title}${yearText}`, maxTitleW, 'bold 14px "Segoe UI"'),
            titleX,
            y + Math.round(h * 0.6)
          );
        } else {
          c.fillStyle = '#ffffff';
          c.font = 'bold 15px "Segoe UI", Inter, sans-serif';
          c.fillText(
            truncate(`${item.title}${yearText}`, maxTitleW, 'bold 15px "Segoe UI"'),
            titleX,
            y + Math.round(h * 0.44)
          );

          // Platform, Genre & Creator subtext
          c.fillStyle = '#8f98a0';
          c.font = '12px "Segoe UI", Inter, sans-serif';
          const sub = `${trPlatform(item.platform)} • ${trGenre(item.genre)}${item.creator ? ` • ${item.creator}` : ''}${item.hours_spent ? ` • ${item.hours_spent}h` : ''}${item.pages ? ` • ${item.pages} str.` : ''}`;
          c.fillText(truncate(sub, maxTitleW, '12px "Segoe UI"'), titleX, y + Math.round(h * 0.77));
        }
      }

      // 3. Footer Branding & User Name Watermark (without @)
      const footerY = height - 42;
      drawMediaTypeIconOnCanvas(ctx, 'Library', padX + 8, footerY - 5, 15, '#8f98a0', 2.2);
      ctx.fillStyle = '#8f98a0';
      ctx.font = '14px "Segoe UI", Inter, sans-serif';
      const footerLeft = userName.trim()
        ? `ShelfMedia  •  ${userName.trim()}`
        : 'ShelfMedia';
      ctx.fillText(footerLeft, padX + 22, footerY);

      ctx.fillStyle = customAccent;
      ctx.font = 'bold 14px "Segoe UI", Inter, sans-serif';
      const pageSuffix = totalPagesCount > 1 ? ` (${pageIndex + 1}/${totalPagesCount})` : '';
      const tag = `#ShelfMedia #Kolekcja #${collection.title.replace(/\s+/g, '')}${pageSuffix}`;
      const tagW = ctx.measureText(tag).width;
      ctx.fillText(tag, width - padX - tagW, footerY);
    },
    [
      aspectRatio,
      collection,
      collectionItems,
      stats,
      customStart,
      customMid,
      customEnd,
      customAccent,
      gradientDirection,
      itemsPerPage,
      totalPagesCount,
      typeConfigs,
      ratingScale,
      userName,
      lang,
      t,
      trType,
      trPlatform,
      trGenre,
    ]
  );

  // Render preview for currentPage
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderPageToCanvas(canvasRef.current, currentPage);
  }, [isOpen, currentPage, renderPageToCanvas]);

  if (!isOpen) return null;

  // Download single or multiple PNG files sequentially with sequence number suffix
  const handleDownloadAllPages = async () => {
    setIsDownloadingBatch(true);
    try {
      const safeTitle = collection.title
        .toLowerCase()
        .replace(/[^a-z0-9ąćęłńóśźż]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'kolekcja';

      const offscreen = document.createElement('canvas');

      for (let pageIdx = 0; pageIdx < totalPagesCount; pageIdx++) {
        renderPageToCanvas(offscreen, pageIdx);
        const dataUrl = offscreen.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        const seqNumber = pageIdx + 1;
        link.download = `kolekcja_${safeTitle}_${aspectRatio}_${seqNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (totalPagesCount > 1 && pageIdx < totalPagesCount - 1) {
          await new Promise((res) => setTimeout(res, 350));
        }
      }
    } finally {
      setIsDownloadingBatch(false);
    }
  };

  const handleCopyCurrentPage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    } catch {
      // Ignore clipboard write errors
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2a475e] flex items-center justify-between bg-[#141d27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#66c0f4] to-[#2575fc] flex items-center justify-center text-white shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t('Grafika Kolekcji na Social Media', 'Collection Social Media Graphic')}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2a475e] text-[#66c0f4] font-semibold">
                  {collection.title}
                </span>
                {totalPagesCount > 1 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#a4d007]/20 text-[#a4d007] border border-[#a4d007]/40 font-mono">
                    {totalPagesCount} {t('pliki PNG', 'PNG files')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Eksportuj kartę kolekcji. Przy dużej liczbie pozycji wygenerowanych zostanie kilka plików PNG po kolei z numerem.',
                  'Export collection card. For large collections, multiple numbered PNG files will be generated sequentially.'
                )}
                {userName && (
                  <span className="ml-1 text-emerald-400 font-semibold">
                    • {t('Podpis:', 'Signed:')} {userName}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8f98a0] hover:text-white rounded-lg hover:bg-[#212b3b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Row 1: Format / Aspect Ratio & Items Per Graphic */}
        <div className="px-4 py-2.5 bg-[#172230] border-b border-[#2a475e] flex flex-wrap items-center justify-between gap-3">
          {/* Format Selector */}
          <div className="flex items-center gap-1.5 bg-[#111720] p-1 rounded-lg border border-[#2a475e]">
            <button
              onClick={() => setAspectRatio('square')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === 'square'
                  ? 'bg-[#66c0f4] text-[#141d27] shadow'
                  : 'text-[#8f98a0] hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>{t('Kwadrat (1:1)', 'Square (1:1)')}</span>
            </button>

            <button
              onClick={() => setAspectRatio('story')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === 'story'
                  ? 'bg-[#66c0f4] text-[#141d27] shadow'
                  : 'text-[#8f98a0] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t('Story / Pion (9:16)', 'Story / Vertical (9:16)')}</span>
            </button>

            <button
              onClick={() => setAspectRatio('landscape')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === 'landscape'
                  ? 'bg-[#66c0f4] text-[#141d27] shadow'
                  : 'text-[#8f98a0] hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{t('Poziom (16:9)', 'Landscape (16:9)')}</span>
            </button>
          </div>

          {/* Max items per single graphic */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#c7d5e0] font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#66c0f4]" />
              {t('Pozycji na 1 grafice:', 'Items per graphic:')}
            </span>
            <div className="flex items-center bg-[#111720] p-1 rounded-lg border border-[#2a475e] gap-1">
              {[16, 20, 24, 30, 36].map((limit) => (
                <button
                  key={limit}
                  type="button"
                  onClick={() => {
                    setItemsPerPage(limit);
                    setCurrentPage(0);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    itemsPerPage === limit
                      ? 'bg-[#a4d007] text-[#141d27] shadow'
                      : 'text-[#8f98a0] hover:text-white'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Gradient & Background Customizer (Identical to Summary SocialCardModal) */}
        <div className="bg-[#101721] px-4 py-2.5 border-b border-[#243547] flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#66c0f4]" />
                {t('Gradient tła grafiki:', 'Background gradient:')}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {DEFAULT_GRADIENT_PRESETS.map((p) => {
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
                    <span className="text-[#8f98a0]">{t('Akcent:', 'Accent:')}</span>
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

                {/* Gradient Direction */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#8f98a0]">{t('Kierunek:', 'Direction:')}</span>
                  <div className="flex bg-[#101721] p-0.5 rounded border border-[#2a475e]">
                    {(['diagonal', 'vertical', 'radial'] as const).map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setGradientDirection(dir)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                          gradientDirection === dir
                            ? 'bg-[#66c0f4] text-[#171a21]'
                            : 'text-[#8f98a0] hover:text-white'
                        }`}
                      >
                        {dir === 'diagonal'
                          ? t('Ukośny', 'Diagonal')
                          : dir === 'vertical'
                          ? t('Pionowy', 'Vertical')
                          : t('Promienisty', 'Radial')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Custom Gradient */}
              <div className="pt-2 border-t border-[#243547] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={newGradientName}
                    onChange={(e) => setNewGradientName(e.target.value)}
                    placeholder={t('Nazwa własnego gradientu (opcjonalnie)...', 'Custom gradient name (optional)...')}
                    className="bg-[#101721] border border-[#2a475e] rounded-lg px-3 py-1 text-xs text-white placeholder-[#8f98a0] focus:outline-none focus:border-[#a4d007] flex-1 max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomGradient}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#a4d007] hover:bg-[#b8e608] text-[#171a21] font-bold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('Zapisz gradient', 'Save gradient')}</span>
                  </button>
                </div>
                {savedFeedback && (
                  <span className="text-xs text-[#a4d007] font-bold">{savedFeedback}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Multi-page navigation bar when collection spans multiple PNG files */}
        {totalPagesCount > 1 && (
          <div className="px-4 py-2 bg-[#141d27] border-b border-[#2a475e] flex items-center justify-between gap-2">
            <span className="text-xs text-[#c7d5e0]">
              {t(
                `Kolekcja zawiera ${collectionItems.length} pozycji — zostanie podzielona na ${totalPagesCount} pliki PNG (z dopiskiem _1, _2...):`,
                `Collection has ${collectionItems.length} items — split into ${totalPagesCount} PNG files (_1, _2...):`
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className={`p-1 rounded border ${
                  currentPage === 0
                    ? 'border-[#243547] text-[#324354] cursor-not-allowed'
                    : 'border-[#2a475e] text-white hover:bg-[#212b3b] cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-[#66c0f4]">
                {t(`Grafika ${currentPage + 1} z ${totalPagesCount}`, `Graphic ${currentPage + 1} of ${totalPagesCount}`)}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPagesCount - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPagesCount - 1, p + 1))}
                className={`p-1 rounded border ${
                  currentPage >= totalPagesCount - 1
                    ? 'border-[#243547] text-[#324354] cursor-not-allowed'
                    : 'border-[#2a475e] text-white hover:bg-[#212b3b] cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Canvas Preview Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0e141b] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-h-[54vh] max-w-full rounded-xl shadow-2xl border border-[#2a475e] object-contain"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2a475e] bg-[#141d27] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#8f98a0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {totalPagesCount > 1
                ? t(
                    `Pobieranie wygeneruje automatycznie ${totalPagesCount} pliki PNG jeden po drugim (_1.png ... _${totalPagesCount}.png)`,
                    `Downloading will automatically generate ${totalPagesCount} PNG files sequentially (_1.png ... _${totalPagesCount}.png)`
                  )
                : t(
                    `Kolekcja "${collection.title}" zawiera ${collectionItems.length} pozycji`,
                    `Collection "${collection.title}" contains ${collectionItems.length} items`
                  )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCurrentPage}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] hover:text-white rounded-lg text-xs font-bold border border-[#2a475e] transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-[#66c0f4]" />}
              <span>{isCopied ? t('Skopiowano obraz!', 'Image copied!') : t('Kopiuj podgląd', 'Copy Preview')}</span>
            </button>

            <button
              onClick={handleDownloadAllPages}
              disabled={isDownloadingBatch}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#66c0f4] to-[#2575fc] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloadingBatch
                  ? t('Generowanie plików PNG...', 'Generating PNG files...')
                  : totalPagesCount > 1
                  ? t(`Pobierz wszystkie (${totalPagesCount} pliki PNG)`, `Download all (${totalPagesCount} PNG files)`)
                  : t('Pobierz grafikę (PNG)', 'Download Graphic (PNG)')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Check, 
  FolderPlus
} from 'lucide-react';
import { Collection, MediaItem } from '../types';
import { 
  AVAILABLE_ICONS, 
  COLOR_PRESETS, 
  ICON_TO_EMOJI_MAP, 
  getMediaTypeIcon, 
  hexToRgba 
} from '../utils/mediaTypeUtils';
import { useLanguage } from '../i18n';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: MediaItem[];
  collections: Collection[];
  onAddToExistingCollection: (collectionId: string, itemIds: number[]) => void;
  onCreateCollectionWithItems: (
    title: string, 
    description: string, 
    accentColor: string, 
    bannerEmoji: string, 
    itemIds: number[],
    styleConfig?: { icon: string; iconColor: string; bgColor: string }
  ) => void;
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  collections,
  onAddToExistingCollection,
  onCreateCollectionWithItems,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(collections.length > 0 ? 'existing' : 'new');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');

  // New Collection state (matching Media Types icon & color options)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#66c0f4');
  const [newIcon, setNewIcon] = useState('Layers');
  const [newIconColor, setNewIconColor] = useState('#60a5fa');
  const [newBgColor, setNewBgColor] = useState('rgba(102, 192, 244, 0.2)');

  if (!isOpen || selectedItems.length === 0) return null;

  const itemIds = selectedItems.map((i) => i.id);

  const handleAddToExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollectionId) return;
    onAddToExistingCollection(selectedCollectionId, itemIds);
    onClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const emoji = ICON_TO_EMOJI_MAP[newIcon] || '⭐';
    onCreateCollectionWithItems(title, newDesc.trim(), newColor, emoji, itemIds, {
      icon: newIcon,
      iconColor: newIconColor || newColor,
      bgColor: newBgColor || hexToRgba(newColor, 0.2),
    });
    onClose();
  };

  const PreviewIcon = getMediaTypeIcon(newIcon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#2a475e] flex items-center justify-between bg-[#141d27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('Dodaj do Kolekcji', 'Add to Collection')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#66c0f4] text-[#141d27] font-extrabold">
                  {selectedItems.length} {t('pozycji', 'items')}
                </span>
              </h2>
              <p className="text-xs text-[#8f98a0]">
                {t(
                  'Umieść wybrane pozycje w istniejącej kolekcji lub stwórz nową z własną ikoną i kolorem',
                  'Add selected items to an existing collection or create a new one with custom icon and color'
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

        {/* Tab switch */}
        <div className="flex border-b border-[#2a475e] bg-[#172230]">
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'existing'
                ? 'border-[#66c0f4] text-white bg-[#1b2838]'
                : 'border-transparent text-[#8f98a0] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#66c0f4]" />
            <span>{t('Istniejąca kolekcja', 'Existing Collection')} ({collections.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'new'
                ? 'border-[#a4d007] text-white bg-[#1b2838]'
                : 'border-transparent text-[#8f98a0] hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-[#a4d007]" />
            <span>{t('+ Nowa kolekcja', '+ New Collection')}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'existing' ? (
            collections.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Layers className="w-10 h-10 text-[#2a475e] mx-auto" />
                <p className="text-sm text-[#8f98a0]">
                  {t('Nie masz jeszcze żadnych kolekcji.', 'You do not have any collections yet.')}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className="px-4 py-2 bg-[#66c0f4] text-[#141d27] font-bold rounded-lg text-xs cursor-pointer"
                >
                  {t('Utwórz pierwszą kolekcję', 'Create First Collection')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddToExisting} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#c7d5e0]">
                    {t('Wybierz kolekcję docelową:', 'Select target collection:')}
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {collections.map((col) => {
                      const isSelected = selectedCollectionId === col.id;
                      const alreadyIn = col.itemIds.filter((id) => itemIds.includes(id)).length;
                      const ColIcon = getMediaTypeIcon(col.icon || 'Layers');
                      const colAccent = col.accentColor || '#66c0f4';
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedCollectionId(col.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#1e2f42] border-[#66c0f4] shadow'
                              : 'bg-[#141d27] border-[#243547] hover:border-[#2a475e]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                              style={{
                                backgroundColor: col.bgColor || hexToRgba(colAccent, 0.2),
                                borderColor: hexToRgba(colAccent, 0.5),
                                color: col.iconColor || colAccent,
                              }}
                            >
                              <ColIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{col.title}</h4>
                              <p className="text-[11px] text-[#8f98a0]">
                                {col.itemIds.length} {t('pozycji', 'items')}
                                {alreadyIn > 0 && (
                                  <span className="ml-2 text-amber-400">
                                    ({alreadyIn} {t('już w kolekcji', 'already in collection')})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#66c0f4] bg-[#66c0f4] text-[#141d27]' : 'border-[#2a475e]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#243547] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {t('Anuluj', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#66c0f4] to-[#2575fc] text-white font-bold rounded-lg text-xs shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('Dodaj do kolekcji', 'Add to collection')}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1.5">
                  {t('Tytuł nowej kolekcji (np. Ulubione Soulslike, Trylogia Władcy Pierścieni):', 'Title of new collection:')}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="np. Trylogia Władcy Pierścieni"
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a4d007]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c7d5e0] mb-1.5">
                  {t('Opis kolekcji (opcjonalny):', 'Description (optional):')}
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="np. Najlepsze pozycje fantasy wszech czasów"
                  className="w-full bg-[#111720] border border-[#2a475e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#a4d007]"
                />
              </div>

              {/* Colors & Icons matching Media Types */}
              <div className="space-y-3 bg-[#141d27] p-3.5 rounded-xl border border-[#243547]">
                <div>
                  <label className="block text-xs font-bold text-[#c7d5e0] uppercase mb-1.5">
                    {t('Kolor główny / akcentu kolekcji:', 'Main / Accent Color:')}
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
                    {t('Wybierz ikonę kolekcji (jak w Typach mediów):', 'Choose Collection Icon (same as Media Types):')}
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#111720] rounded-lg border border-[#2a475e]">
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
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-[#243547]">
                  <span className="text-[11px] text-[#8f98a0] font-semibold">
                    {t('Podgląd ikony kolekcji:', 'Collection icon preview:')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: newBgColor || hexToRgba(newColor, 0.2),
                        borderColor: hexToRgba(newColor, 0.5),
                        color: newIconColor || newColor,
                      }}
                    >
                      <PreviewIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">
                      {newTitle.trim() || t('Nazwa kolekcji', 'Collection name')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#243547] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#212b3b] hover:bg-[#2a475e] text-[#c7d5e0] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t('Anuluj', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                    newTitle.trim()
                      ? 'bg-gradient-to-r from-[#5c7e10] to-[#79a313] hover:from-[#6b9213] hover:to-[#8dbd17] text-white cursor-pointer'
                      : 'bg-[#2a3847] text-[#8f98a0] cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('Utwórz i dodaj pozycje', 'Create and add items')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

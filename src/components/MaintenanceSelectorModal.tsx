import React, { useState, useMemo } from 'react';
import { CategoriaManutenzione, LavorazioneItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import {
  X,
  Search,
  Plus,
  Check,
  CheckCheck,
  Layers,
  ChevronRight,
  Filter,
  Trash2,
} from 'lucide-react';

interface SelectedLavorazioneRef {
  lavorazioneId: string;
  nome: string;
  categoria: string;
  sottocategoria: string;
}

interface MaintenanceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogo: CategoriaManutenzione[];
  onUpdateCatalogo: (nuovoCatalogo: CategoriaManutenzione[]) => void;
  initialSelected: SelectedLavorazioneRef[];
  onConfirm: (selected: SelectedLavorazioneRef[]) => void;
}

export const MaintenanceSelectorModal: React.FC<MaintenanceSelectorModalProps> = ({
  isOpen,
  onClose,
  catalogo,
  onUpdateCatalogo,
  initialSelected,
  onConfirm,
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedLavorazioneRef[]>(initialSelected || []);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sincronizza sempre le attività selezionate quando si apre il modale (permette modifica precisa)
  React.useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelected || []);
    }
  }, [isOpen, initialSelected]);

  // Active Category & Subcategory tabs
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const [activeSubId, setActiveSubId] = useState<string>('');

  // Dialog for adding custom item
  const [isAddingNewItem, setIsAddingNewItem] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newSubName, setNewSubName] = useState<string>('');

  const currentCategory = catalogo[activeCatIndex] || catalogo[0];
  const currentSubcategories = currentCategory?.sottocategorie || [];

  const effectiveActiveSub = useMemo(() => {
    if (activeSubId && currentSubcategories.some((s) => s.id === activeSubId)) {
      return activeSubId;
    }
    return currentSubcategories[0]?.id || '';
  }, [activeSubId, currentSubcategories]);

  const activeSubcategory = currentSubcategories.find((s) => s.id === effectiveActiveSub);

  // Filtered lavorazioni - ORDINATE IN ORDINE ALFABETICO (A-Z)
  const displayedLavorazioni = useMemo(() => {
    let list: { item: LavorazioneItem; catNome: string; subNome: string }[] = [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      catalogo.forEach((cat) => {
        cat.sottocategorie.forEach((sub) => {
          sub.lavorazioni.forEach((lav) => {
            if (
              lav.nome.toLowerCase().includes(q) ||
              cat.nome.toLowerCase().includes(q) ||
              sub.nome.toLowerCase().includes(q)
            ) {
              list.push({ item: lav, catNome: cat.nome, subNome: sub.nome });
            }
          });
        });
      });
    } else if (activeSubcategory) {
      list = activeSubcategory.lavorazioni.map((lav) => ({
        item: lav,
        catNome: currentCategory.nome,
        subNome: activeSubcategory.nome,
      }));
    }

    // Ordinamento alfabetico A-Z
    return list.sort((a, b) => a.item.nome.localeCompare(b.item.nome, 'it'));
  }, [searchQuery, catalogo, activeSubcategory, currentCategory]);

  const isSelected = (item: LavorazioneItem) => {
    return selectedItems.some(
      (s) =>
        s.lavorazioneId === item.id ||
        (s.nome && item.nome && s.nome.trim().toUpperCase() === item.nome.trim().toUpperCase())
    );
  };

  const toggleSelect = (
    item: LavorazioneItem,
    catNome: string,
    subNome: string
  ) => {
    if (isSelected(item)) {
      setSelectedItems((prev) =>
        prev.filter(
          (s) =>
            s.lavorazioneId !== item.id &&
            s.nome.trim().toUpperCase() !== item.nome.trim().toUpperCase()
        )
      );
    } else {
      // Sempre modalità multipla di default (fondamentale)
      setSelectedItems((prev) => [
        ...prev,
        {
          lavorazioneId: item.id,
          nome: item.nome,
          categoria: catNome,
          sottocategoria: subNome,
        },
      ]);
    }
  };

  const handleAddNewLavorazione = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeSubcategory) return;

    const newLav: LavorazioneItem = {
      id: `custom-lav-${Date.now()}`,
      nome: newItemName.trim().toUpperCase(),
      categoriaId: currentCategory.id,
      sottocategoriaId: activeSubcategory.id,
      iconName: 'Wrench',
      coloreIcona: '#38bdf8',
    };

    const updated = catalogo.map((cat) => {
      if (cat.id !== currentCategory.id) return cat;
      return {
        ...cat,
        sottocategorie: cat.sottocategorie.map((sub) => {
          if (sub.id !== activeSubcategory.id) return sub;
          return {
            ...sub,
            lavorazioni: [...sub.lavorazioni, newLav],
          };
        }),
      };
    });

    onUpdateCatalogo(updated);
    toggleSelect(newLav, currentCategory.nome, activeSubcategory.nome);
    setNewItemName('');
    setIsAddingNewItem(false);
  };

  const handleAddNewCategoryOrSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newSubName.trim()) return;

    const newCatId = `custom-cat-${Date.now()}`;
    const newSubId = `custom-sub-${Date.now()}`;

    const newCat: CategoriaManutenzione = {
      id: newCatId,
      numero: catalogo.length + 1,
      nome: `${catalogo.length + 1}. ${newCatName.trim().toUpperCase()}`,
      iconName: 'Sparkles',
      sottocategorie: [
        {
          id: newSubId,
          categoriaId: newCatId,
          nome: newSubName.trim(),
          lavorazioni: [
            {
              id: `lav-init-${Date.now()}`,
              nome: 'LAVAGGIO E CURA SPECIFICA',
              categoriaId: newCatId,
              sottocategoriaId: newSubId,
              iconName: 'Sparkles',
              coloreIcona: '#06b6d4',
            },
          ],
        },
      ],
    };

    const updated = [...catalogo, newCat];
    onUpdateCatalogo(updated);
    setActiveCatIndex(catalogo.length);
    setActiveSubId(newSubId);
    setNewCatName('');
    setNewSubName('');
    setIsAddingCategory(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-[#111827] text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header styling inspired by screenshot 1 */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 px-5 py-3.5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-orange-200 block">
              CARTRACKER PRO
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              Seleziona attività di manutenzione
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subheader info and Quick Clear (Attività multiple is permanent default) */}
        {selectedItems.length > 0 && (
          <div className="px-4 py-2 bg-[#141d2e] border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              <span className="text-blue-400 font-bold">{selectedItems.length}</span> attività selezionate
            </span>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 shrink-0 px-2 py-1 bg-rose-950/40 rounded-lg border border-rose-900/50 cursor-pointer"
            >
              <Trash2 size={13} /> Svuota selezione
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="px-4 py-2 bg-[#111827] border-b border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cerca tra oltre 130 lavorazioni (es. Olio, Filtro, Freni, Cerchi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* SKETCH HIERARCHY: Stacked layered category tabs */}
        {!searchQuery && (
          <div className="bg-[#0f172a] border-b border-slate-800">
            {/* TIER 1: CATEGORIE PRINCIPALI */}
            <div className="px-3 pt-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers size={11} className="text-blue-400" /> Categorie Principali
                </span>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-medium"
                >
                  <Plus size={12} /> Nuova categoria
                </button>
              </div>

              {/* Overlapping/stacked tabs bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                {catalogo.map((cat, idx) => {
                  const isActive = idx === activeCatIndex;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCatIndex(idx);
                        setActiveSubId(cat.sottocategorie[0]?.id || '');
                      }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/30'
                          : 'bg-[#1e293b] border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {cat.numero || idx + 1}
                      </span>
                      <span>{cat.nome.replace(/^\d+\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIER 2: SOTTOCATEGORIE OF ACTIVE CATEGORY */}
            <div className="px-3 py-1.5 bg-[#0a0f1d] border-t border-slate-800/80">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Sottocategorie di: {currentCategory?.nome}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {currentSubcategories.map((sub) => {
                  const isSubActive = sub.id === effectiveActiveSub;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubId(sub.id)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 border ${
                        isSubActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-[#182234] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub.nome} ({sub.lavorazioni.length})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TIER 3: GRID OF LAVORAZIONI (Cards with Icons) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {searchQuery && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
              <Filter size={13} className="text-blue-400" />
              <span>Risultati per "{searchQuery}": {displayedLavorazioni.length} lavorazioni trovate</span>
            </div>
          )}

          {displayedLavorazioni.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DynamicIcon name="AlertCircle" className="mx-auto mb-2 text-slate-600" size={32} />
              <p className="text-sm font-medium">Nessuna lavorazione trovata</p>
              <p className="text-xs text-slate-600 mt-1">Puoi aggiungerne una nuova con il pulsante qui sotto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {displayedLavorazioni.map(({ item, catNome, subNome }) => {
                const selected = isSelected(item);
                const color = item.coloreIcona || '#38bdf8';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item, catNome, subNome)}
                    className={`relative p-2.5 rounded-xl flex items-center gap-2.5 text-left transition-all border cursor-pointer min-h-[46px] ${
                      selected
                        ? 'bg-[#18263e] border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500/50'
                        : 'bg-[#141d2e] border-slate-800/90 hover:bg-[#1a263c] text-slate-200'
                    }`}
                  >
                    {/* Small Colorful Icon container (always colorful!) */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${color}20`,
                        borderColor: `${color}40`,
                      }}
                    >
                      <DynamicIcon
                        name={item.iconName || 'Wrench'}
                        size={15}
                        color={color}
                      />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 pr-1">
                      <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 text-slate-100 block">
                        {item.nome}
                      </span>
                      {searchQuery && (
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                          {subNome}
                        </span>
                      )}
                    </div>

                    {/* Compact Checkbox Badge */}
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                        selected
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'border-slate-700 bg-slate-800/40 text-transparent'
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  </button>
                );
              })}

              {/* Add Custom Lavorazione Card (Compact) */}
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewItem(true)}
                  className="p-2.5 rounded-xl flex items-center gap-2.5 text-left border-2 border-dashed border-slate-700/80 hover:border-blue-400 bg-slate-900/40 hover:bg-blue-950/20 text-slate-300 hover:text-blue-300 transition-all min-h-[46px] cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                    <Plus size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold block leading-tight">+ Aggiungi attività</span>
                    <span className="text-[9px] text-slate-500 block">Personalizzata in questa categoria</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected items chip summary bar */}
        {selectedItems.length > 0 && (
          <div className="px-4 py-2 bg-[#0c1322] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
              Scelti ({selectedItems.length}):
            </span>
            {selectedItems.map((s) => (
              <span
                key={s.lavorazioneId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-950 border border-blue-700 text-blue-300 shrink-0"
              >
                {s.nome}
                <button
                  onClick={() =>
                    setSelectedItems((prev) =>
                      prev.filter((i) => i.lavorazioneId !== s.lavorazioneId)
                    )
                  }
                  className="hover:text-white"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="p-4 bg-[#111827] border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-300">
            <span className="text-blue-400 text-sm font-bold">{selectedItems.length}</span> attività {selectedItems.length === 1 ? 'selezionata' : 'selezionate'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Annulla
            </button>
            <button
              onClick={() => {
                onConfirm(selectedItems);
                onClose();
              }}
              disabled={selectedItems.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                selectedItems.length > 0
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <CheckCheck size={16} />
              Aggiungi selezione ({selectedItems.length} attività)
            </button>
          </div>
        </div>

        {/* Modal: Add New Custom Lavorazione */}
        {isAddingNewItem && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <form
              onSubmit={handleAddNewLavorazione}
              className="w-full max-w-sm bg-[#1e293b] p-5 rounded-2xl border border-slate-700 shadow-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Plus size={16} className="text-blue-400" /> Aggiungi Lavorazione
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNewItem(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Aggiungi una nuova attività a <strong className="text-slate-200">{activeSubcategory?.nome}</strong>
              </p>
              <input
                type="text"
                required
                autoFocus
                placeholder="Es. LAVAGGIO SPECIFICO CERCHI, PULIZIA FARI..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNewItem(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Salva e Seleziona
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add New Category & Subcategory */}
        {isAddingCategory && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
            <form
              onSubmit={handleAddNewCategoryOrSub}
              className="w-full max-w-sm bg-[#1e293b] p-5 rounded-2xl border border-slate-700 shadow-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers size={16} className="text-amber-400" /> Nuova Categoria Principale
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">Nome Categoria Principale</label>
                <input
                  type="text"
                  required
                  placeholder="Es. CURA ESTERNI, TUNING, ASSICURAZIONI..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">Nome Prima Sottocategoria</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Detailing e Cerchi, Verniciatura..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                >
                  Crea Categoria
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

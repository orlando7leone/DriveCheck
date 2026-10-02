import React, { useState, useMemo } from 'react';
import { Veicolo, InterventoRecord, TipoRecord, TipoPagamentoScadenza } from '../types';
import {
  formatCurrency,
  formatKm,
  formatDateIt,
  downloadFleetCalendarIcs,
  computeBolloPagabileEntro,
} from '../services/storageService';
import {
  Wrench,
  Fuel,
  Hammer,
  MoreHorizontal,
  Bell,
  Search,
  SlidersHorizontal,
  Plus,
  Calendar,
  ChevronRight,
  Filter,
  Disc,
  FileEdit,
  ShieldCheck,
  CreditCard,
  X,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HistoryViewProps {
  veicolo: Veicolo | undefined;
  record: InterventoRecord[];
  onSelectRecord: (record: InterventoRecord) => void;
  onOpenNewRecord: (mode?: 'manutenzione' | 'gomme' | 'altri_interventi') => void;
  onOpenRegistroPagamenti?: (tipo?: TipoPagamentoScadenza) => void;
  onOpenGoogleSync?: () => void;
}

type FilterHistoryType = 'Tutti gli Interventi' | 'Manutenzione' | 'Gomme' | 'Altri Interventi';

export const HistoryView: React.FC<HistoryViewProps> = ({
  veicolo,
  record,
  onSelectRecord,
  onOpenNewRecord,
  onOpenRegistroPagamenti,
  onOpenGoogleSync,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterHistoryType>('Tutti gli Interventi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState<boolean>(false);
  const [isScadenzeMenuOpen, setIsScadenzeMenuOpen] = useState<boolean>(true);

  const filteredRecords = useMemo(() => {
    return record
      .filter((r) => {
        if (!veicolo) return true;
        return r.veicoloId === veicolo.id;
      })
      // Cronologia mostra ESCLUSIVAMENTE gli interventi meccanici/tecnici sul veicolo
      .filter((r) => r.tipo !== 'Pagamento Scadenza' && !r.registroPagamento)
      .filter((r) => {
        if (activeFilter === 'Tutti gli Interventi') return true;
        if (activeFilter === 'Manutenzione') return r.tipo === 'Manutenzione' || r.tipo === 'Riparazione';
        if (activeFilter === 'Gomme') return r.tipo === 'Gomme' || !!r.registroGomme;
        if (activeFilter === 'Altri Interventi') return r.tipo === 'Altri Interventi' || r.tipo === 'Altro';
        return true;
      })
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.titolo.toLowerCase().includes(q) ||
          (r.descrizione && r.descrizione.toLowerCase().includes(q)) ||
          (r.officina && r.officina.toLowerCase().includes(q)) ||
          r.lavorazioniSelezionate.some((l) => l.nome.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [record, veicolo, activeFilter, searchQuery]);

  const activeRemindersCount = useMemo(() => {
    return record.filter((r) => (!veicolo || r.veicoloId === veicolo.id) && r.haPromemoria).length;
  }, [record, veicolo]);

  // Click su "+ Nuovo" in base alla categoria attiva
  const handleHeaderNewClick = () => {
    if (activeFilter === 'Manutenzione') {
      onOpenNewRecord('manutenzione');
    } else if (activeFilter === 'Gomme') {
      onOpenNewRecord('gomme');
    } else if (activeFilter === 'Altri Interventi') {
      onOpenNewRecord('altri_interventi');
    } else {
      // Su Tutti gli Interventi: permette di scegliere tra manutenzione, gomme o altri interventi
      setIsChoiceModalOpen(true);
    }
  };

  const getNewButtonConfig = () => {
    if (activeFilter === 'Manutenzione') {
      return {
        label: '+ Manutenzione',
        bg: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-900/40',
        icon: <Wrench size={14} />,
      };
    }
    if (activeFilter === 'Gomme') {
      return {
        label: '+ Registra Gomme',
        bg: 'from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-900/40',
        icon: <Disc size={14} />,
      };
    }
    if (activeFilter === 'Altri Interventi') {
      return {
        label: '+ Altro Intervento',
        bg: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/40',
        icon: <FileEdit size={14} />,
      };
    }
    return {
      label: '+ Nuovo',
      bg: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-900/30',
      icon: <Plus size={15} />,
    };
  };

  const btnConfig = getNewButtonConfig();

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* Header with car photo banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-xl bg-gradient-to-t from-[#0e1624] via-[#141e30] to-[#1c2a44] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cronologia
            </h1>
            <p className="text-xs font-mono font-bold text-blue-400 mt-0.5">
              {veicolo ? `${veicolo.marca} ${veicolo.modello} • ${veicolo.targa}` : 'Tutti i veicoli'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeRemindersCount > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                <Bell size={13} className="text-amber-400" />
                <span>{activeRemindersCount}</span>
              </div>
            )}

            <button
              onClick={handleHeaderNewClick}
              className={`px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${btnConfig.bg} text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer`}
            >
              {btnConfig.icon}
              <span>{btnConfig.label}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MENU PROSSIME SCADENZE: Bollo Auto, Revisione, Assicurazione */}
      {veicolo && (
        <div className="rounded-3xl border border-slate-800/90 bg-[#101726] shadow-xl overflow-hidden">
          {/* Menu Header */}
          <div className="p-4 bg-gradient-to-r from-[#141e30] to-[#111929] border-b border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsScadenzeMenuOpen(!isScadenzeMenuOpen)}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CalendarDays size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Prossime Scadenze Veicolo</span>
                  {isScadenzeMenuOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Bollo Auto • Revisione • Assicurazione
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenGoogleSync?.()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-blue-950/40 transition-all cursor-pointer"
                title="Sincronizza automaticamente con Google Calendar 'Scadenze Auto'"
              >
                <CalendarDays size={13} />
                <span>Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => downloadFleetCalendarIcs([veicolo])}
                className="p-1.5 rounded-xl bg-[#1c293d] hover:bg-[#253752] text-blue-300 hover:text-white border border-blue-900/60 transition-all cursor-pointer"
                title="Scarica file .ics 'Scadenze Auto'"
              >
                <Download size={15} />
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {isScadenzeMenuOpen && (
            <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* 1. SCADENZA BOLLO */}
              <div className="p-3.5 rounded-2xl bg-[#162133] border border-amber-500/40 relative flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <CreditCard size={13} />
                      <span>Scadenza Bollo</span>
                    </span>
                    {veicolo.scadenzaBollo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono">
                        {veicolo.importoBollo ? formatCurrency(veicolo.importoBollo) : 'Attivo'}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-sm sm:text-base font-black text-white font-mono">
                      {veicolo.scadenzaBollo ? formatDateIt(veicolo.scadenzaBollo) : 'Non impostata'}
                    </div>
                    {veicolo.scadenzaBollo && (
                      <div className="text-[11px] text-amber-300 font-semibold">
                        Pagabile entro: <strong>{computeBolloPagabileEntro(veicolo.scadenzaBollo)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRegistroPagamenti?.('Bollo')}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition-colors cursor-pointer"
                >
                  <CreditCard size={13} />
                  <span>{veicolo.scadenzaBollo ? 'Aggiorna / Registra Pagamento' : 'Imposta Scadenza Bollo'}</span>
                </button>
              </div>

              {/* 2. SCADENZA REVISIONE */}
              <div className="p-3.5 rounded-2xl bg-[#162133] border border-rose-500/40 relative flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <FileCheck size={13} />
                      <span>Scadenza Revisione</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-700/60 font-mono">
                      79,02 €
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-sm sm:text-base font-black text-white font-mono">
                      {veicolo.scadenzaRevisione ? formatDateIt(veicolo.scadenzaRevisione) : 'Non impostata'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Frequenza: <strong className="text-slate-300">{veicolo.frequenzaRevisione || 'Auto Biennale'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRegistroPagamenti?.('Revisione')}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-500/40 transition-colors cursor-pointer"
                >
                  <FileCheck size={13} />
                  <span>{veicolo.scadenzaRevisione ? 'Aggiorna / Registra Revisione' : 'Imposta Scadenza Revisione'}</span>
                </button>
              </div>

              {/* 3. SCADENZA ASSICURAZIONE */}
              <div className="p-3.5 rounded-2xl bg-[#162133] border border-emerald-500/40 relative flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Shield size={13} />
                      <span>Scadenza Assicurazione</span>
                    </span>
                    {veicolo.compagniaAssicurazione && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                        {veicolo.compagniaAssicurazione}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-sm sm:text-base font-black text-white font-mono">
                      {veicolo.scadenzaAssicurazione ? formatDateIt(veicolo.scadenzaAssicurazione) : 'Non indicata'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Rata: <strong className="text-slate-300">{veicolo.importoAssicurazione ? `${formatCurrency(veicolo.importoAssicurazione)} (${veicolo.frequenzaAssicurazione || 'Semestrale'})` : 'N/D'}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRegistroPagamenti?.('Assicurazione')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/40 transition-colors cursor-pointer"
                >
                  <Shield size={13} />
                  <span>{veicolo.scadenzaAssicurazione ? 'Aggiorna / Registra Assicurazione' : 'Imposta Assicurazione'}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {(['Tutti gli Interventi', 'Manutenzione', 'Gomme', 'Altri Interventi'] as const).map((filtro) => {
          const isSelected = activeFilter === filtro;
          return (
            <button
              key={filtro}
              onClick={() => setActiveFilter(filtro)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/30'
                  : 'bg-[#152033] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filtro}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Cerca lavorazione, componente, officina..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#152033] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Records Timeline List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#111927] border border-slate-800/80 rounded-3xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
            <Filter size={24} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nessun intervento trovato</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            {searchQuery
              ? `Nessun risultato corrisponde a "${searchQuery}".`
              : activeFilter !== 'Tutti gli Interventi'
              ? `Nessun intervento registrato in "${activeFilter}".`
              : 'Non ci sono ancora interventi registrati per questo veicolo.'}
          </p>
          <button
            onClick={handleHeaderNewClick}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            + Registra Primo Intervento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => {
            const isGomme = r.tipo === 'Gomme' || !!r.registroGomme;
            const isAltri = r.tipo === 'Altri Interventi' || r.tipo === 'Altro';

            return (
              <div
                key={r.id}
                onClick={() => onSelectRecord(r)}
                className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-md group relative overflow-hidden"
              >
                {/* Visual side accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isGomme
                      ? 'bg-cyan-500'
                      : isAltri
                      ? 'bg-purple-500'
                      : 'bg-orange-500'
                  }`}
                />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    
                    {/* Top Row: Date, KM & Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-mono text-slate-400 flex items-center gap-1 font-semibold">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDateIt(r.data)}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60 text-[11px]">
                        {formatKm(r.km)}
                      </span>

                      {/* Pill Badge */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isGomme
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : isAltri
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-orange-950 text-orange-300 border-orange-800'
                        }`}
                      >
                        {isGomme ? 'Gomme' : isAltri ? 'Altri Interventi' : 'Manutenzione'}
                      </span>
                    </div>

                    {/* Titolo Intervento */}
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {r.titolo}
                    </h3>

                    {/* Descrizione (per Altri Interventi o dettagli) */}
                    {r.descrizione && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {r.descrizione}
                      </p>
                    )}

                    {/* Officina */}
                    {r.officina && (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Presso: <span className="text-slate-300">{r.officina}</span>
                      </p>
                    )}

                    {/* Micro-lavorazioni pills (se presenti) */}
                    {r.lavorazioniSelezionate && r.lavorazioniSelezionate.length > 0 && !isGomme && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.lavorazioniSelezionate.slice(0, 3).map((lav) => (
                          <span
                            key={lav.lavorazioneId}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                          >
                            {lav.nome}
                          </span>
                        ))}
                        {r.lavorazioniSelezionate.length > 3 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-400">
                            +{r.lavorazioniSelezionate.length - 3} altre
                          </span>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Right Column: Cost and Arrow */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-emerald-400 block font-mono">
                        {r.costo > 0 ? formatCurrency(r.costo) : 'Gratuito / N/D'}
                      </span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-800/60 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors mt-auto">
                      <ChevronRight size={15} />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Choice Modal quando si è su "Tutti gli Interventi" e si clicca "+ Nuovo" */}
      {isChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#111927] border border-slate-800 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Scegli Tipo Intervento</h3>
                <p className="text-xs text-slate-400">Cosa desideri registrare?</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Opzione 1: Manutenzione & Tagliandi */}
              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  onOpenNewRecord('manutenzione');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#172233] hover:bg-[#1e2e45] border border-orange-500/40 hover:border-orange-500 flex items-center gap-3.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white block">Manutenzione & Tagliandi</span>
                  <span className="text-[11px] text-slate-400 block truncate">Tagliando, filtri, cambio olio, freni, distribuzione...</span>
                </div>
              </button>

              {/* Opzione 2: Registro Gomme */}
              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  onOpenNewRecord('gomme');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#172233] hover:bg-[#1e2e45] border border-cyan-500/40 hover:border-cyan-500 flex items-center gap-3.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Disc size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white block">Registro Gomme</span>
                  <span className="text-[11px] text-slate-400 block truncate">Sostituzione gomme, inversione, equilibratura, convergenza...</span>
                </div>
              </button>

              {/* Opzione 3: Altri Interventi */}
              <button
                type="button"
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  onOpenNewRecord('altri_interventi');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#172233] hover:bg-[#1e2e45] border border-purple-500/40 hover:border-purple-500 flex items-center gap-3.5 text-left transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileEdit size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white block">Altri Interventi (Rapido)</span>
                  <span className="text-[11px] text-slate-400 block truncate">Riparazioni rapide, carrozzeria, lampadine, controlli vari...</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

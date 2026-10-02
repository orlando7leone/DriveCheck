import React, { useMemo } from 'react';
import { Veicolo, InterventoRecord, CategoriaManutenzione } from '../types';
import { formatCurrency, formatKm, formatDateIt, getDaysUntil, generateDeadlineMessage, openWhatsAppReminder } from '../services/storageService';
import {
  Wrench,
  Disc,
  FileEdit,
  AlertTriangle,
  Gauge,
  Calendar,
  TrendingUp,
  ChevronRight,
  Plus,
  ArrowRight,
  Layers,
  Euro,
  Shield,
  MessageCircle,
  CreditCard,
} from 'lucide-react';

interface SummaryViewProps {
  veicolo: Veicolo | undefined;
  veicoli: Veicolo[];
  record: InterventoRecord[];
  catalogo: CategoriaManutenzione[];
  onOpenNewRecord: () => void;
  onOpenUpdateKm: () => void;
  onOpenVehicleDetails: () => void;
  onOpenRegistroGomme?: () => void;
  onOpenAltriInterventi?: () => void;
  onOpenRegistroPagamenti?: () => void;
  onSwitchTab: (tab: 'cronologia' | 'garage' | 'imposta') => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  veicolo,
  record,
  onOpenNewRecord,
  onOpenUpdateKm,
  onOpenVehicleDetails,
  onOpenRegistroGomme,
  onOpenAltriInterventi,
  onOpenRegistroPagamenti,
  onSwitchTab,
}) => {
  const vehicleRecords = useMemo(() => {
    if (!veicolo) return [];
    return record.filter((r) => r.veicoloId === veicolo.id);
  }, [record, veicolo]);

  // 1. Manutenzione
  const manutenzioneRecords = useMemo(() => {
    return vehicleRecords.filter(
      (r) => r.tipo === 'Manutenzione' || r.tipo === 'Riparazione'
    );
  }, [vehicleRecords]);

  const totaleManutenzione = useMemo(() => {
    return manutenzioneRecords.reduce((acc, r) => acc + (r.costo || 0), 0);
  }, [manutenzioneRecords]);

  const ultimoManutenzione = useMemo(() => {
    if (manutenzioneRecords.length === 0) return null;
    return [...manutenzioneRecords].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0];
  }, [manutenzioneRecords]);

  // 2. Registro Gomme
  const gommeRecords = useMemo(() => {
    return vehicleRecords.filter((r) => r.tipo === 'Gomme' || !!r.registroGomme);
  }, [vehicleRecords]);

  const totaleGomme = useMemo(() => {
    return gommeRecords.reduce((acc, r) => acc + (r.costo || 0), 0);
  }, [gommeRecords]);

  const ultimoGomme = useMemo(() => {
    if (gommeRecords.length === 0) return null;
    return [...gommeRecords].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0];
  }, [gommeRecords]);

  // 3. Altri Interventi
  const altriInterventiRecords = useMemo(() => {
    return vehicleRecords.filter(
      (r) =>
        r.tipo === 'Altri Interventi' ||
        (r.tipo !== 'Manutenzione' &&
          r.tipo !== 'Riparazione' &&
          r.tipo !== 'Gomme' &&
          !r.registroGomme)
    );
  }, [vehicleRecords]);

  const totaleAltriInterventi = useMemo(() => {
    return altriInterventiRecords.reduce((acc, r) => acc + (r.costo || 0), 0);
  }, [altriInterventiRecords]);

  const ultimoAltri = useMemo(() => {
    if (altriInterventiRecords.length === 0) return null;
    return [...altriInterventiRecords].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0];
  }, [altriInterventiRecords]);

  // Totale Complessivo
  const totaleComplessivo = useMemo(() => {
    return totaleManutenzione + totaleGomme + totaleAltriInterventi;
  }, [totaleManutenzione, totaleGomme, totaleAltriInterventi]);

  const pctManutenzione =
    totaleComplessivo > 0
      ? Math.round((totaleManutenzione / totaleComplessivo) * 100)
      : 0;
  const pctGomme =
    totaleComplessivo > 0 ? Math.round((totaleGomme / totaleComplessivo) * 100) : 0;
  const pctAltri =
    totaleComplessivo > 0
      ? Math.max(0, 100 - pctManutenzione - pctGomme)
      : 0;

  const daysBollo = veicolo ? getDaysUntil(veicolo.scadenzaBollo) : 999;
  const daysRevisione = veicolo ? getDaysUntil(veicolo.scadenzaRevisione) : 999;
  const daysAssicurazione = veicolo?.scadenzaAssicurazione
    ? getDaysUntil(veicolo.scadenzaAssicurazione)
    : 999;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Title & Quick Info */}
      <div className="pt-2 pb-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Riepilogo Spese
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Importi parziali, totale complessivo e stato veicolo
          </p>
        </div>

        <button
          onClick={onOpenVehicleDetails}
          className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>Scheda Auto</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {veicolo ? (
        <>
          {/* Main Top Cards: Cost and KM */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Cost */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1a2b42] to-[#121c2d] border border-blue-500/40 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1">
                <TrendingUp size={12} /> Costo Complessivo
              </span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatCurrency(totaleComplessivo)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {vehicleRecords.length}{' '}
                {vehicleRecords.length === 1 ? 'registrazione' : 'registrazioni'}
              </p>
            </div>

            {/* Current KM */}
            <div
              onClick={onOpenUpdateKm}
              className="p-4 rounded-3xl bg-gradient-to-br from-[#1a2b42] to-[#121c2d] border border-slate-800 shadow-xl cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Gauge size={12} className="text-emerald-400" /> Chilometraggio
                </span>
                <span className="text-[9px] text-blue-400 font-bold">Modifica</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatKm(veicolo.kmAttuali)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {veicolo.marca} • {veicolo.targa}
              </p>
            </div>
          </div>

          {/* Urgent Deadlines Alert Banner */}
          {(daysBollo <= 45 || daysRevisione <= 45 || daysAssicurazione <= 45) && (
            <div className="p-4 rounded-3xl bg-amber-950/30 border border-amber-600/60 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertTriangle size={16} />
                  <span>Scadenze imminenti per {veicolo.targa}</span>
                </div>
                {veicolo.cellulare && (
                  <button
                    type="button"
                    onClick={() => {
                      const msg = generateDeadlineMessage(
                        veicolo,
                        'Scadenze',
                        daysBollo <= 45
                          ? veicolo.scadenzaBollo
                          : daysRevisione <= 45
                          ? veicolo.scadenzaRevisione
                          : veicolo.scadenzaAssicurazione || '',
                        veicolo.importoBollo
                      );
                      openWhatsAppReminder(veicolo.cellulare, msg);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg"
                  >
                    <MessageCircle size={12} />
                    <span>Avviso WhatsApp</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {daysBollo <= 45 && (
                  <div className="p-2.5 rounded-xl bg-[#0e1624] border border-amber-800/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Bollo Auto:</span>
                    <strong className="text-amber-300 text-xs">{formatDateIt(veicolo.scadenzaBollo)}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({daysBollo} gg rimasti)</span>
                  </div>
                )}
                {daysRevisione <= 45 && (
                  <div className="p-2.5 rounded-xl bg-[#0e1624] border border-rose-800/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Revisione MCTC:</span>
                    <strong className="text-rose-400 text-xs">{formatDateIt(veicolo.scadenzaRevisione)}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({daysRevisione} gg rimasti)</span>
                  </div>
                )}
                {daysAssicurazione <= 45 && veicolo.scadenzaAssicurazione && (
                  <div className="p-2.5 rounded-xl bg-[#0e1624] border border-emerald-800/60">
                    <span className="text-[10px] text-emerald-400 block font-semibold">Assicurazione:</span>
                    <strong className="text-emerald-300 text-xs">{formatDateIt(veicolo.scadenzaAssicurazione)}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({daysAssicurazione} gg rimasti)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEZIONE: IMPORTI PARZIALI (Manutenzione, Registro Gomme, Altri Interventi) */}
          <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Layers size={15} />
                <span>Importi Parziali & Riepilogo Lavorazioni</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Totale: {formatCurrency(totaleComplessivo)}
              </span>
            </div>

            {/* Barra proporzionale di spesa */}
            {totaleComplessivo > 0 && (
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                  {pctManutenzione > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${pctManutenzione}%` }}
                      title={`Manutenzione: ${pctManutenzione}%`}
                    />
                  )}
                  {pctGomme > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                      style={{ width: `${pctGomme}%` }}
                      title={`Gomme: ${pctGomme}%`}
                    />
                  )}
                  {pctAltri > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${pctAltri}%` }}
                      title={`Altri: ${pctAltri}%`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Manutenzione ({pctManutenzione}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Gomme ({pctGomme}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Altri ({pctAltri}%)
                  </span>
                </div>
              </div>
            )}

            {/* LISTA DEI 3 IMPORTI PARZIALI */}
            <div className="space-y-2.5">
              
              {/* 1. MANUTENZIONE */}
              <div
                onClick={() => onSwitchTab('cronologia')}
                className="p-3.5 rounded-2xl bg-[#0f1726] border border-orange-500/30 hover:border-orange-500/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                        Manutenzione
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {manutenzioneRecords.length}{' '}
                        {manutenzioneRecords.length === 1 ? 'intervento' : 'interventi'}
                        {ultimoManutenzione && ` • Ultimo: ${formatDateIt(ultimoManutenzione.data)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-amber-400 block font-mono">
                      {formatCurrency(totaleManutenzione)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {totaleComplessivo > 0 ? `${pctManutenzione}% del tot.` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. REGISTRO GOMME */}
              <div
                onClick={() => onSwitchTab('cronologia')}
                className="p-3.5 rounded-2xl bg-[#0f1726] border border-cyan-500/30 hover:border-cyan-500/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Disc size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Registro Gomme
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {gommeRecords.length}{' '}
                        {gommeRecords.length === 1 ? 'intervento' : 'interventi'}
                        {ultimoGomme && ` • Ultimo: ${formatDateIt(ultimoGomme.data)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-cyan-400 block font-mono">
                      {formatCurrency(totaleGomme)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {totaleComplessivo > 0 ? `${pctGomme}% del tot.` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. ALTRI INTERVENTI */}
              <div
                onClick={() => onSwitchTab('cronologia')}
                className="p-3.5 rounded-2xl bg-[#0f1726] border border-purple-500/30 hover:border-purple-500/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <FileEdit size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        Altri Interventi
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {altriInterventiRecords.length}{' '}
                        {altriInterventiRecords.length === 1 ? 'intervento' : 'interventi'}
                        {ultimoAltri && ` • Ultimo: ${formatDateIt(ultimoAltri.data)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-purple-400 block font-mono">
                      {formatCurrency(totaleAltriInterventi)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {totaleComplessivo > 0 ? `${pctAltri}% del tot.` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* BOX TOTALE COMPLESSIVO SPESE */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                Totale Complessivo
              </span>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-white font-mono">
                  {formatCurrency(totaleComplessivo)}
                </span>
              </div>
            </div>

          </div>

          {/* Quick Buttons for New Records */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={onOpenNewRecord}
              className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <Wrench size={16} />
              <span>+ Manutenzione</span>
            </button>

            <button
              onClick={onOpenRegistroGomme || onOpenNewRecord}
              className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <Disc size={16} />
              <span>+ Gomme</span>
            </button>

            <button
              onClick={onOpenAltriInterventi || onOpenNewRecord}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <FileEdit size={16} />
              <span>+ Altri</span>
            </button>

            <button
              onClick={onOpenRegistroPagamenti || onOpenNewRecord}
              className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <CreditCard size={16} />
              <span>+ Scadenze</span>
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">
          Nessun veicolo attivo. Aggiungine uno dal menu Garage.
        </div>
      )}
    </div>
  );
};

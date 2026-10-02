import React, { useState } from 'react';
import { Veicolo } from '../types';
import {
  formatKm,
  formatDateIt,
  formatCurrency,
  getDaysUntil,
  generateDeadlineMessage,
  openWhatsAppReminder,
} from '../services/storageService';
import {
  Car,
  ChevronRight,
  ShieldCheck,
  Disc,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  Phone,
  Gauge,
  Sliders,
  Check,
  User,
  ArrowLeft,
  Pencil,
  Clock,
  Sparkles,
  Shield,
  MessageCircle,
} from 'lucide-react';

interface GarageViewProps {
  veicoli: Veicolo[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onOpenVehicleDetails: () => void;
  onOpenAddVehicle: () => void;
  onOpenUpdateKm: () => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  veicoli,
  selectedVehicleId,
  onSelectVehicle,
  onOpenVehicleDetails,
  onOpenAddVehicle,
  onOpenUpdateKm,
}) => {
  // Mode: 'parco' (show all fleet cards) or 'dettaglio' (show detailed sheet of selected car)
  const [viewMode, setViewMode] = useState<'parco' | 'dettaglio'>('parco');

  const currentVehicle = veicoli.find((v) => v.id === selectedVehicleId) || veicoli[0];

  const handleSelectCar = (id: string) => {
    onSelectVehicle(id);
    setViewMode('dettaglio');
  };

  const daysBollo = currentVehicle ? getDaysUntil(currentVehicle.scadenzaBollo) : 999;
  const daysRevisione = currentVehicle ? getDaysUntil(currentVehicle.scadenzaRevisione) : 999;
  const daysAssicurazione = currentVehicle?.scadenzaAssicurazione
    ? getDaysUntil(currentVehicle.scadenzaAssicurazione)
    : 999;

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      
      {/* VISTA 1: TUTTO IL PARCO MACCHINE (Elenco completo) */}
      {viewMode === 'parco' ? (
        <>
          {/* Header Parco Macchine */}
          <div className="pt-2 pb-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Parco Macchine</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  {veicoli.length} {veicoli.length === 1 ? 'veicolo' : 'veicoli'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tocca un veicolo per visualizzare tutti i dati e la scheda tecnica
              </p>
            </div>

            <button
              onClick={onOpenAddVehicle}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Nuova Auto</span>
            </button>
          </div>

          {/* Lista di tutte le vetture nel parco */}
          <div className="space-y-3">
            {veicoli.length === 0 ? (
              <div className="text-center py-12 bg-[#131b26] rounded-3xl border border-slate-800 p-6">
                <Car size={40} className="mx-auto text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-white">Nessun veicolo nel parco</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Aggiungi il tuo primo veicolo con dati proprietario, officina e scadenze
                </p>
                <button
                  onClick={onOpenAddVehicle}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  + Inserisci Veicolo
                </button>
              </div>
            ) : (
              veicoli.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                const vDaysBollo = getDaysUntil(v.scadenzaBollo);
                const vDaysRev = getDaysUntil(v.scadenzaRevisione);

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectCar(v.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-lg group relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#19263a] to-[#121c2d] border-blue-500/80 ring-2 ring-blue-500/30'
                        : 'bg-[#141e2e] hover:bg-[#1a273b] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Car Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0 relative">
                        <img
                          src={v.immagine || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                          alt={v.marca}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Info & Badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-base font-black text-white truncate group-hover:text-blue-300 transition-colors">
                            {v.marca} {v.modello}
                          </h3>
                          <span className="font-mono text-xs font-black text-blue-400 bg-blue-950/70 border border-blue-800 px-2 py-0.5 rounded-lg shrink-0">
                            {v.targa}
                          </span>
                        </div>

                        {/* Proprietario */}
                        {v.proprietario && (
                          <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <span>{v.proprietario}</span>
                            {v.residenteIn && <span className="text-slate-400">• {v.residenteIn}</span>}
                          </p>
                        )}

                        {/* Badges row: KM & Alimentazione */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded-lg font-bold bg-[#0d1420] text-slate-200 border border-slate-700/60 flex items-center gap-1">
                            <Gauge size={11} className="text-blue-400" />
                            {formatKm(v.kmAttuali)}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg font-bold bg-amber-950/40 text-amber-300 border border-amber-800/60">
                            {v.alimentazione}
                          </span>
                          {v.annoAcquisto && (
                            <span className="px-2 py-0.5 rounded-lg text-slate-400 bg-slate-800/60">
                              Anno {v.annoAcquisto}
                            </span>
                          )}
                        </div>

                        {/* Alert Scadenze Bollo/Revisione/Assicurazione */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800/70 text-[10px]">
                          <span className={vDaysBollo <= 30 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            Bollo: {formatDateIt(v.scadenzaBollo)} ({vDaysBollo} gg)
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className={vDaysRev <= 30 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            Rev: {formatDateIt(v.scadenzaRevisione)} ({vDaysRev} gg)
                          </span>
                          {v.scadenzaAssicurazione && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className={getDaysUntil(v.scadenzaAssicurazione) <= 30 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                Assic: {formatDateIt(v.scadenzaAssicurazione)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 self-center ml-1" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* VISTA 2: DETTAGLIO COMPLETO DELLA MACCHINA SELEZIONATA */
        <>
          {/* Header Dettaglio con pulsante indietro al parco */}
          <div className="pt-2 pb-1 flex items-center justify-between">
            <button
              onClick={() => setViewMode('parco')}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-xl bg-[#141e2e] border border-slate-800"
            >
              <ArrowLeft size={16} />
              <span>Tutto il Parco Macchine</span>
            </button>

            <button
              onClick={onOpenVehicleDetails}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
            >
              <Pencil size={13} />
              <span>Modifica Dati</span>
            </button>
          </div>

          {currentVehicle && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Card Principale Auto */}
              <div className="rounded-3xl bg-gradient-to-b from-[#192437] to-[#121927] border border-slate-800 p-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shrink-0">
                    <img
                      src={currentVehicle.immagine || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                      alt={currentVehicle.marca}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-black text-white truncate">
                        {currentVehicle.marca} {currentVehicle.modello}
                      </h2>
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </span>
                    </div>

                    <p className="text-xs font-mono font-bold tracking-wider text-blue-400 mt-0.5">
                      {currentVehicle.targa}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <button
                        onClick={onOpenUpdateKm}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0d1420] text-slate-200 border border-slate-700 hover:border-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Tocca per aggiornare km"
                      >
                        <Gauge size={12} className="text-blue-400" />
                        {formatKm(currentVehicle.kmAttuali)} ✎
                      </button>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-800/60">
                        {currentVehicle.alimentazione}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE: DATI PROPRIETARIO */}
              <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <User size={15} /> Dati Proprietario
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Proprietario</span>
                    <span className="font-bold text-white">{currentVehicle.proprietario || 'Non indicato'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nato il / A</span>
                    <span className="font-medium text-slate-200">{currentVehicle.natoIlA || 'Non indicato'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Residente in</span>
                    <span className="font-medium text-slate-200">{currentVehicle.residenteIn || 'Non indicato'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Via/Corso/Piazza</span>
                    <span className="font-medium text-slate-200">{currentVehicle.viaCorsoPiazza || 'Non indicato'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cellulare</span>
                    <a
                      href={`tel:${currentVehicle.cellulare}`}
                      className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5 hover:underline"
                    >
                      <Phone size={13} /> {currentVehicle.cellulare || 'Non indicato'}
                    </a>
                  </div>
                </div>
              </div>

              {/* SEZIONE: DATI TECNICI & SCADENZE */}
              <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Car size={15} /> Dati Tecnici & Scadenze
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cilindrata</span>
                    <span className="font-medium text-white">{currentVehicle.cilindrata || 'Non indicata'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Anno Acquisto</span>
                    <span className="font-medium text-white">{currentVehicle.annoAcquisto || 'Non indicato'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c1322] border border-slate-800">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Scadenza Bollo</span>
                    <span className="font-bold text-white text-xs">{formatDateIt(currentVehicle.scadenzaBollo)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatCurrency(currentVehicle.importoBollo || 0)} ({daysBollo} gg)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c1322] border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Scadenza Revisione</span>
                    <span className="font-bold text-white text-xs">{formatDateIt(currentVehicle.scadenzaRevisione)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({daysRevisione} gg rimasti)</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-[#0c1322] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Scadenza Assicurazione</span>
                      <span className="font-bold text-white text-xs">
                        {currentVehicle.scadenzaAssicurazione ? formatDateIt(currentVehicle.scadenzaAssicurazione) : 'Non indicata'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {currentVehicle.compagniaAssicurazione || 'N/D'}{' '}
                        {currentVehicle.importoAssicurazione ? `• ${formatCurrency(currentVehicle.importoAssicurazione)}` : ''}{' '}
                        {daysAssicurazione < 999 ? `(${daysAssicurazione} gg)` : ''}
                      </span>
                    </div>

                    {currentVehicle.cellulare && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateDeadlineMessage(
                            currentVehicle,
                            'Assicurazione',
                            currentVehicle.scadenzaAssicurazione || '',
                            currentVehicle.importoAssicurazione
                          );
                          openWhatsAppReminder(currentVehicle.cellulare, msg);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-emerald-500/40 transition-colors cursor-pointer"
                        title="Invia promemoria WhatsApp al proprietario"
                      >
                        <MessageCircle size={13} />
                        <span>Avviso WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SEZIONE: OFFICINA & PNEUMATICI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Officina */}
                <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 space-y-1.5 shadow-md">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} /> Officina di Fiducia
                  </span>
                  <div className="text-xs font-bold text-white mt-1">
                    {currentVehicle.officina || 'Non indicata'}
                  </div>
                  {currentVehicle.rifOfficina && (
                    <div className="text-[11px] text-slate-400">Rif: {currentVehicle.rifOfficina}</div>
                  )}
                  {currentVehicle.telefonoOfficina && (
                    <a
                      href={`tel:${currentVehicle.telefonoOfficina}`}
                      className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1 hover:underline"
                    >
                      <Phone size={12} /> {currentVehicle.telefonoOfficina}
                    </a>
                  )}
                </div>

                {/* Pneumatici */}
                <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 space-y-1.5 shadow-md">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Disc size={14} /> Gomme & Pressioni
                  </span>
                  <div className="text-xs font-bold text-white mt-1">
                    Misura: {currentVehicle.dimensioniGomme || 'Standard'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
                    <span>Ant: <strong className="text-cyan-300">{currentVehicle.pressioneAnteriore || '2.4 bar'}</strong></span>
                    <span>•</span>
                    <span>Post: <strong className="text-cyan-300">{currentVehicle.pressionePosteriore || '2.2 bar'}</strong></span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};

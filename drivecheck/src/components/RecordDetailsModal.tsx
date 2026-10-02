import React, { useState } from 'react';
import { InterventoRecord, Veicolo } from '../types';
import { formatCurrency, formatKm, formatDateIt } from '../services/storageService';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Gauge,
  Calendar,
  Building2,
  Bell,
  CheckCircle2,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react';

interface RecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InterventoRecord | null;
  veicolo: Veicolo | undefined;
  onEdit: (record: InterventoRecord) => void;
  onDelete: (recordId: string) => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  isOpen,
  onClose,
  record,
  veicolo,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  if (!isOpen || !record) return null;

  const handleDelete = () => {
    onDelete(record.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-[#111827] text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top blue bar (exact match to screenshot 10) */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-bold">Dettagli</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(record)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="Modifica record"
            >
              <Pencil size={17} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
              title="Elimina record"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Main Card */}
          <div className="p-5 rounded-2xl bg-[#172033] border border-slate-800 shadow-lg space-y-4">
            
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-white leading-snug">
                {record.titolo}
              </h3>

              <div className="text-right shrink-0">
                <span className="text-xl font-black text-blue-400 block">
                  {formatCurrency(record.costo)}
                </span>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-950/80 border border-amber-600/70 text-amber-300">
                  {record.tipo}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar size={14} className="text-blue-400" />
              <span>{formatDateIt(record.data)}</span>
              {veicolo && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300 font-medium">{veicolo.marca} {veicolo.modello} ({veicolo.targa})</span>
                </>
              )}
            </div>

            {/* Box: CHILOMETRAGGIO REGISTRATO */}
            <div className="p-3.5 rounded-xl bg-[#0e1624] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                  Chilometraggio Registrato
                </span>
                <div className="flex items-center gap-2 text-white font-bold text-base mt-0.5">
                  <Gauge size={18} className="text-blue-400" />
                  <span>{formatKm(record.km)}</span>
                </div>
              </div>
            </div>

            {/* Officina */}
            {record.officina && (
              <div className="p-3.5 rounded-xl bg-[#0e1624] border border-slate-800">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                  Officina / Esecutore
                </span>
                <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                  <Building2 size={16} className="text-amber-400" />
                  <span>{record.officina}</span>
                </div>
              </div>
            )}

            {/* Descrizione (per Altri Interventi) */}
            {record.descrizione && (
              <div className="p-3.5 rounded-xl bg-[#0e1624] border border-slate-800">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                  Descrizione Intervento
                </span>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {record.descrizione}
                </p>
              </div>
            )}

            {/* Registro Gomme Dettagli */}
            {record.registroGomme && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-700/50 space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 block">
                  Dettagli Registro Gomme
                </span>
                {record.registroGomme.marca && (
                  <div className="text-xs text-white">
                    Marca Pneumatici: <strong className="text-cyan-200">{record.registroGomme.marca}</strong>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {record.registroGomme.sostituzioneAnteriori && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-900/60 border border-cyan-600 text-cyan-200">
                      ✓ Sost. Gomme Anteriori
                    </span>
                  )}
                  {record.registroGomme.sostituzionePosteriori && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-900/60 border border-cyan-600 text-cyan-200">
                      ✓ Sost. Gomme Posteriori
                    </span>
                  )}
                  {record.registroGomme.inversione && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-900/60 border border-blue-600 text-blue-200">
                      ✓ Inversione
                    </span>
                  )}
                  {record.registroGomme.equilibratura && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-900/60 border border-indigo-600 text-indigo-200">
                      ✓ Equilibratura
                    </span>
                  )}
                  {record.registroGomme.convergenza && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-900/60 border border-teal-600 text-teal-200">
                      ✓ Convergenza
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lavorazioni dettagliate */}
            {record.lavorazioniSelezionate && record.lavorazioniSelezionate.length > 0 && !record.registroGomme && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Lavorazioni incluse ({record.lavorazioniSelezionate.length})
                </span>
                <div className="space-y-1.5">
                  {record.lavorazioniSelezionate.map((lav, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#111a2b] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">{lav.nome}</span>
                      <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                        {lav.sottocategoria}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promemoria Info */}
            {record.haPromemoria && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 flex items-start gap-3">
                <Bell size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-300 block">Promemoria attivo</span>
                  <span className="text-slate-300">
                    Prossima scadenza: {record.dataPromemoria ? formatDateIt(record.dataPromemoria) : 'N/D'}
                    {record.kmPromemoria ? ` oppure a ${formatKm(record.kmPromemoria)}` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Note */}
            {record.note && (
              <div className="p-3.5 rounded-xl bg-[#0e1624] border border-slate-800">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1">
                  Note
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {record.note}
                </p>
              </div>
            )}

            {/* Foto ricevuta allegata */}
            {record.fotoRicevutaUrl && (
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-1.5">
                  Ricevuta / Documento allegato
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-800">
                  <img
                    src={record.fotoRicevutaUrl}
                    alt="Ricevuta"
                    className="w-full max-h-56 object-contain bg-black/60"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#1e293b] p-5 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Eliminare questo record?</h4>
                  <p className="text-xs text-slate-400">Questa operazione non può essere annullata.</p>
                </div>
              </div>

              <div className="p-3 bg-[#0f172a] rounded-xl text-xs text-slate-300">
                <p className="font-semibold text-white">{record.titolo}</p>
                <p className="text-slate-400 mt-0.5">{formatDateIt(record.data)} • {formatCurrency(record.costo)}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Elimina definitivamente
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

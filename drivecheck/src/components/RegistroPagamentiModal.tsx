import React, { useState, useEffect, useMemo } from 'react';
import { Veicolo, InterventoRecord, TipoPagamentoScadenza, RegistroPagamentoData } from '../types';
import { ReceiptInvoiceUpload } from './ReceiptInvoiceUpload';
import { OfficinaSelector } from './OfficinaSelector';
import {
  formatCurrency,
  formatDateIt,
  generateDeadlineMessage,
  openGoogleCalendarEvent,
  downloadIcsFile,
  computeNextDeadlineDate,
  computeBolloPagabileEntro,
  computeFutureDeadlinesSeries,
  downloadFleetCalendarIcs,
  downloadRevisioniCalendarIcs,
  openWhatsAppReminder,
  openSmsReminder,
} from '../services/storageService';
import {
  X,
  ArrowLeft,
  Shield,
  FileCheck,
  CreditCard,
  Calendar,
  Save,
  Check,
  CalendarPlus,
  Send,
  Download,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowRight,
  Repeat,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface RegistroPagamentiModalProps {
  isOpen: boolean;
  onClose: () => void;
  veicolo: Veicolo;
  onSaveRecord: (record: InterventoRecord) => void;
  onUpdateVehicleDeadline?: (
    veicoloId: string,
    tipo: TipoPagamentoScadenza,
    nuovaScadenza: string,
    importo?: number,
    compagnia?: string
  ) => void;
  editingRecord?: InterventoRecord | null;
  officineSalvate?: string[];
}

// Converte in formato ISO YYYY-MM-DD per gli input HTML di tipo date
const toIsoDate = (val: string): string => {
  if (!val) return '';
  const clean = val.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  return clean;
};

export const RegistroPagamentiModal: React.FC<RegistroPagamentiModalProps> = ({
  isOpen,
  onClose,
  veicolo,
  onSaveRecord,
  onUpdateVehicleDeadline,
  editingRecord,
  officineSalvate = [],
}) => {
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamentoScadenza>('Bollo');
  const [dataPagamento, setDataPagamento] = useState<string>('');
  const [dataScadenza, setDataScadenza] = useState<string>('');
  const [pagabileEntroBollo, setPagabileEntroBollo] = useState<string>('');
  const [modalitaAssicurazione, setModalitaAssicurazione] = useState<string>('Annuale (pagamento unico)');
  const [frequenzaRevisione, setFrequenzaRevisione] = useState<string>('Auto (Normale)');
  const [importo, setImporto] = useState<string>('');
  const [enteOCompagnia, setEnteOCompagnia] = useState<string>('');
  const [numeroPolizza, setNumeroPolizza] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [fotoRicevutaUrl, setFotoRicevutaUrl] = useState<string>('');
  const [aggiornaScadenzaAuto, setAggiornaScadenzaAuto] = useState<boolean>(true);
  const [ripetiAnniSuccessivi, setRipetiAnniSuccessivi] = useState<boolean>(true);
  const [pagamentoEffettuato, setPagamentoEffettuato] = useState<boolean>(true);

  // Stato per feedback ed errori visibili all'utente
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inizializza i campi SOLO quando il modal si apre
  useEffect(() => {
    if (!isOpen || !veicolo) return;

    setValidationError(null);
    setSuccessMessage(null);

    if (editingRecord) {
      const reg = editingRecord.registroPagamento;
      if (reg) {
        setTipoPagamento(reg.tipoPagamento);
        setDataPagamento(toIsoDate(reg.dataPagamento || editingRecord.data));
        setDataScadenza(toIsoDate(reg.dataScadenza));
        setImporto(reg.importo ? reg.importo.toString() : editingRecord.costo.toString());
        setEnteOCompagnia(reg.enteOCompagnia || '');
        setNumeroPolizza(reg.numeroPolizza || '');
        setNote(reg.note || editingRecord.note || '');
        setPagamentoEffettuato(reg.pagato !== undefined ? reg.pagato : true);
        if (reg.frequenza) {
          if (reg.tipoPagamento === 'Assicurazione') setModalitaAssicurazione(reg.frequenza);
          if (reg.tipoPagamento === 'Revisione') setFrequenzaRevisione(reg.frequenza);
        }
        if (reg.pagabileEntro) {
          setPagabileEntroBollo(reg.pagabileEntro);
        } else if (reg.tipoPagamento === 'Bollo' && reg.dataScadenza) {
          setPagabileEntroBollo(computeBolloPagabileEntro(reg.dataScadenza));
        }
      } else {
        setDataPagamento(toIsoDate(editingRecord.data));
        setImporto(editingRecord.costo ? editingRecord.costo.toString() : '');
      }
      setFotoRicevutaUrl(editingRecord.fotoRicevutaUrl || '');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setDataPagamento(today);
      setFotoRicevutaUrl('');
      setNote('');

      // Inizializza per Bollo
      setupDefaultValuesForTipo('Bollo', today);
    }
  }, [isOpen, editingRecord?.id, veicolo?.id]);

  const setupDefaultValuesForTipo = (tipo: TipoPagamentoScadenza, baseDataPagamento: string) => {
    setTipoPagamento(tipo);
    setValidationError(null);

    if (tipo === 'Bollo') {
      // Usa la scadenza bollo registrata sull'auto se presente, altrimenti calcola +1 anno da oggi
      const baseScad = veicolo.scadenzaBollo
        ? toIsoDate(veicolo.scadenzaBollo)
        : computeNextDeadlineDate(baseDataPagamento, 'Annuale');
      setDataScadenza(baseScad);
      const entro = computeBolloPagabileEntro(baseScad);
      setPagabileEntroBollo(entro);
      setImporto(veicolo.importoBollo ? veicolo.importoBollo.toString() : '');
      setEnteOCompagnia('ACI / Regione');
    } else if (tipo === 'Revisione') {
      const baseScad = veicolo.scadenzaRevisione
        ? toIsoDate(veicolo.scadenzaRevisione)
        : computeNextDeadlineDate(baseDataPagamento, frequenzaRevisione);
      setDataScadenza(baseScad);
      setImporto('79.02');
      setEnteOCompagnia(veicolo.officina || 'Centro Revisioni Autorizzato MCTC');
    } else if (tipo === 'Assicurazione') {
      const baseScad = veicolo.scadenzaAssicurazione
        ? toIsoDate(veicolo.scadenzaAssicurazione)
        : computeNextDeadlineDate(baseDataPagamento, modalitaAssicurazione);
      setDataScadenza(baseScad);
      setImporto(veicolo.importoAssicurazione ? veicolo.importoAssicurazione.toString() : '');
      setEnteOCompagnia(veicolo.compagniaAssicurazione || '');
    }
  };

  // Cambio tipo di pagamento (Bollo / Revisione / Assicurazione)
  const handleTipoChange = (newTipo: TipoPagamentoScadenza) => {
    setupDefaultValuesForTipo(newTipo, dataPagamento || new Date().toISOString().slice(0, 10));
  };

  // Quando l'utente modifica la data di scadenza (es. inserisce 30/04/2026 o la seleziona):
  // RICALCOLA AUTOMATICAMENTE "PAGABILE ENTRO" (legge il mese e mette il mese successivo: Aprile -> Maggio)
  const handleDataScadenzaChange = (newScadenza: string) => {
    const iso = toIsoDate(newScadenza);
    setDataScadenza(iso);
    if (tipoPagamento === 'Bollo' && iso) {
      const entro = computeBolloPagabileEntro(iso);
      setPagabileEntroBollo(entro);
    }
  };

  // Quando l'utente modifica la data di pagamento
  const handleDataPagamentoChange = (newDate: string) => {
    const iso = toIsoDate(newDate);
    setDataPagamento(iso);
    // Suggerisce la scadenza successiva basandosi sulla data inserita
    const next = computeNextDeadlineDate(
      iso,
      tipoPagamento === 'Assicurazione'
        ? modalitaAssicurazione
        : tipoPagamento === 'Revisione'
        ? frequenzaRevisione
        : 'Annuale'
    );
    if (next) {
      setDataScadenza(next);
      if (tipoPagamento === 'Bollo') {
        setPagabileEntroBollo(computeBolloPagabileEntro(next));
      }
    }
  };

  const handleModalitaAssicChange = (val: string) => {
    setModalitaAssicurazione(val);
    const base = dataPagamento || new Date().toISOString().slice(0, 10);
    const next = computeNextDeadlineDate(base, val);
    if (next) setDataScadenza(next);
  };

  const handleFrequenzaRevChange = (val: string) => {
    setFrequenzaRevisione(val);
    const base = dataPagamento || new Date().toISOString().slice(0, 10);
    const next = computeNextDeadlineDate(base, val);
    if (next) setDataScadenza(next);
  };

  const currentFrequenza =
    tipoPagamento === 'Assicurazione'
      ? modalitaAssicurazione
      : tipoPagamento === 'Revisione'
      ? frequenzaRevisione
      : 'Annuale';

  // Suggerimento calcolato per la prossima scadenza
  const suggerimentoCalcolato = useMemo(() => {
    const base = dataPagamento || new Date().toISOString().slice(0, 10);
    return computeNextDeadlineDate(
      base,
      tipoPagamento === 'Assicurazione'
        ? modalitaAssicurazione
        : tipoPagamento === 'Revisione'
        ? frequenzaRevisione
        : 'Annuale'
    );
  }, [tipoPagamento, dataPagamento, modalitaAssicurazione, frequenzaRevisione]);

  // Proiezione scadenze future
  const futureDeadlines = useMemo(() => {
    const base = dataScadenza || suggerimentoCalcolato;
    return computeFutureDeadlinesSeries(base, tipoPagamento, currentFrequenza, 3);
  }, [dataScadenza, suggerimentoCalcolato, tipoPagamento, currentFrequenza]);

  // Regola di ricorrenza per Google Calendar
  const recurrenceRRule = useMemo(() => {
    if (!ripetiAnniSuccessivi) return undefined;
    if (tipoPagamento === 'Bollo') return 'RRULE:FREQ=YEARLY';
    if (tipoPagamento === 'Revisione') return 'RRULE:FREQ=YEARLY;INTERVAL=2';
    if (modalitaAssicurazione.toLowerCase().includes('semestral'))
      return 'RRULE:FREQ=MONTHLY;INTERVAL=6';
    if (modalitaAssicurazione.toLowerCase().includes('trimestral'))
      return 'RRULE:FREQ=MONTHLY;INTERVAL=3';
    if (modalitaAssicurazione.toLowerCase().includes('mensil'))
      return 'RRULE:FREQ=MONTHLY;INTERVAL=1';
    return 'RRULE:FREQ=YEARLY';
  }, [tipoPagamento, modalitaAssicurazione, ripetiAnniSuccessivi]);

  const calendarTitle = `🚗 [${veicolo.targa}] Scadenza ${tipoPagamento}: ${veicolo.marca} ${veicolo.modello}`;
  const calendarDesc = `Promemoria scadenza ${tipoPagamento} per ${veicolo.proprietario || 'veicolo'} - Targa: ${veicolo.targa}. ${
    tipoPagamento === 'Bollo' && pagabileEntroBollo ? `Pagabile entro: ${pagabileEntroBollo}.` : ''
  } Importo: ${importo ? `${importo} €` : 'N/D'}. Note: ${enteOCompagnia || ''} ${numeroPolizza ? `Polizza: ${numeroPolizza}` : ''}`;

  // Salvataggio sicuro e garantito nel database e nello stato
  const handleSaveProcess = () => {
    setValidationError(null);

    const dataPagamentoFinale = dataPagamento.trim() || new Date().toISOString().slice(0, 10);
    const dataScadenzaFinale = dataScadenza.trim() || suggerimentoCalcolato;

    if (!dataScadenzaFinale) {
      setValidationError('Inserisci una data di scadenza valida.');
      return;
    }

    const costoNumerico = parseFloat(importo) || (tipoPagamento === 'Bollo' ? (veicolo.importoBollo || 0) : 0);
    const finalTitle = pagamentoEffettuato
      ? `Pagamento ${tipoPagamento} - ${enteOCompagnia || veicolo.targa}`
      : `Scadenza ${tipoPagamento} (In attesa) - ${veicolo.targa}`;

    const registroPagamento: RegistroPagamentoData = {
      tipoPagamento,
      dataPagamento: dataPagamentoFinale,
      dataScadenza: dataScadenzaFinale,
      importo: costoNumerico,
      frequenza: currentFrequenza,
      pagabileEntro: tipoPagamento === 'Bollo' ? (pagabileEntroBollo || computeBolloPagabileEntro(dataScadenzaFinale)) : undefined,
      enteOCompagnia: enteOCompagnia.trim() || undefined,
      numeroPolizza: numeroPolizza.trim() || undefined,
      note: note.trim() || undefined,
      pagato: pagamentoEffettuato,
    };

    const recordToSave: InterventoRecord = {
      id: editingRecord ? editingRecord.id : `rec-pag-${Date.now()}`,
      veicoloId: veicolo.id,
      tipo: 'Pagamento Scadenza',
      titolo: finalTitle,
      data: dataPagamentoFinale,
      km: veicolo.kmAttuali || 0,
      costo: costoNumerico,
      officina: enteOCompagnia.trim() || undefined,
      lavorazioniSelezionate: [
        {
          lavorazioneId: `lav-pag-${tipoPagamento.toLowerCase()}`,
          nome: `${tipoPagamento.toUpperCase()}`,
          categoria: '4. CARROZZERIA, COMFORT E SERVIZI EXTRA',
          sottocategoria: 'Registro Scadenze e Pagamenti',
        },
      ],
      registroPagamento,
      fotoRicevutaUrl: fotoRicevutaUrl || undefined,
      haPromemoria: true,
      dataPromemoria: dataScadenzaFinale,
      note: `Scadenza: ${formatDateIt(dataScadenzaFinale)} ${
        registroPagamento.pagabileEntro ? `• Pagabile entro: ${registroPagamento.pagabileEntro}` : ''
      } • Ente/Compagnia: ${enteOCompagnia || 'N/D'} ${
        numeroPolizza ? `• Polizza: ${numeroPolizza}` : ''
      }`,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    try {
      // 1. Salva il record del pagamento
      onSaveRecord(recordToSave);

      // 2. Aggiorna la scadenza nella scheda del veicolo
      if (aggiornaScadenzaAuto && onUpdateVehicleDeadline) {
        onUpdateVehicleDeadline(
          veicolo.id,
          tipoPagamento,
          dataScadenzaFinale,
          costoNumerico,
          enteOCompagnia.trim()
        );
      }

      setSuccessMessage('✓ Pagamento e scadenza registrati nel database con successo!');

      // Chiudi il modal dopo breve feedback positivo
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Errore salvataggio registro pagamenti:', err);
      setValidationError(`Errore durante il salvataggio: ${err?.message || 'Riprova'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[95vh] flex flex-col bg-[#111827] text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-700 px-5 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {editingRecord ? 'Modifica Pagamento' : 'Registro Pagamenti'}
              </h2>
              <p className="text-xs text-emerald-200 font-mono">
                {veicolo.marca} {veicolo.modello} • <span className="font-bold">{veicolo.targa}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setDataPagamento(today);
                setDataScadenza('');
                setImporto('');
                setNote('');
                setFotoRicevutaUrl('');
                setPagamentoEffettuato(true);
                setupDefaultValuesForTipo(tipoPagamento, today);
              }}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-white/20"
              title="Inserisci un nuovo registro pagamento"
            >
              <Plus size={13} />
              <span>+ Nuovo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3 Tab Switcher: Bollo Auto, Revisione, Assicurazione */}
        <div className="grid grid-cols-3 gap-1.5 p-3 bg-[#0d1422] border-b border-slate-800">
          <button
            type="button"
            onClick={() => handleTipoChange('Bollo')}
            className={`py-2 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              tipoPagamento === 'Bollo'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'bg-[#152033] text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard size={16} />
            <span>Bollo Auto</span>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('Revisione')}
            className={`py-2 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              tipoPagamento === 'Revisione'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                : 'bg-[#152033] text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck size={16} />
            <span>Revisione</span>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('Assicurazione')}
            className={`py-2 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              tipoPagamento === 'Assicurazione'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-[#152033] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={16} />
            <span>Assicurazione</span>
          </button>
        </div>

        {/* Feedback messaggi di errore o successo */}
        {validationError && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* CASELLA DI SPUNTA: PAGAMENTO EFFETTUATO / SALDATO */}
          <div
            onClick={() => setPagamentoEffettuato(!pagamentoEffettuato)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              pagamentoEffettuato
                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                : 'bg-[#152033] border-slate-700 text-slate-300 hover:bg-[#1a2942]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  pagamentoEffettuato ? 'bg-emerald-500 text-black shadow-sm' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold block">
                  {pagamentoEffettuato
                    ? '✓ Pagamento Effettuato (Saldato)'
                    : '⏳ In attesa di pagamento (Registra solo scadenza)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {pagamentoEffettuato
                    ? 'Spuntato: il pagamento è avvenuto con successo e puoi allegare la ricevuta'
                    : 'Non spuntato: registra promemoria per la data di scadenza futura'}
                </span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                pagamentoEffettuato
                  ? 'bg-emerald-500 border-emerald-400 text-black'
                  : 'border-slate-700'
              }`}
            >
              {pagamentoEffettuato && <Check size={14} strokeWidth={3} />}
            </div>
          </div>
          
          {/* Sezione Date: Data Pagamento & Scadenza */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Data Pagamento Effettuato
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => handleDataPagamentoChange(e.target.value)}
                className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 block">
                Data Scadenza {tipoPagamento} *
              </label>
              <input
                type="date"
                value={dataScadenza}
                onChange={(e) => handleDataScadenzaChange(e.target.value)}
                className="w-full bg-[#172233] border border-emerald-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
              />
            </div>
          </div>

          {/* SPECIFICO BOLLO: CALCOLO AUTOMATICO "PAGABILE ENTRO" (legge il mese di scadenza) */}
          {tipoPagamento === 'Bollo' && (
            <div className="p-3.5 rounded-2xl bg-[#141e2e] border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  PAGABILE ENTRO (Normativa ACI)
                </label>
                <span className="text-[10px] text-amber-300/80 font-mono">
                  Mese successivo alla scadenza
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={pagabileEntroBollo}
                  onChange={(e) => setPagabileEntroBollo(e.target.value)}
                  placeholder="es. Tutto Maggio 2026"
                  className="w-full bg-[#1a2538] border border-amber-500/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-2 rounded-xl bg-[#0a101b] border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>
                  💡 Legge la scadenza ({dataScadenza ? formatDateIt(dataScadenza) : 'N/D'}) ➔ <strong>{computeBolloPagabileEntro(dataScadenza || dataPagamento)}</strong>
                </span>
                {dataScadenza && (
                  <button
                    type="button"
                    onClick={() => setPagabileEntroBollo(computeBolloPagabileEntro(dataScadenza))}
                    className="px-2 py-0.5 rounded-lg bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white font-bold text-[10px] border border-amber-500/40 cursor-pointer"
                  >
                    Ricalcola
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Banner Suggerimento Automatico Prossima Scadenza */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-2.5 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider block">
                  Suggerimento Prossima Scadenza per il Database:
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {formatDateIt(suggerimentoCalcolato)}
                  {tipoPagamento === 'Bollo' && (
                    <span className="text-amber-300 font-semibold text-[11px] ml-1.5">
                      ({computeBolloPagabileEntro(suggerimentoCalcolato)})
                    </span>
                  )}
                  {tipoPagamento === 'Revisione' && (
                    <span className="text-rose-300 font-semibold text-[11px] ml-1.5">
                      (+2 anni)
                    </span>
                  )}
                  {tipoPagamento === 'Assicurazione' && (
                    <span className="text-purple-300 font-semibold text-[11px] ml-1.5">
                      ({modalitaAssicurazione})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {dataScadenza !== suggerimentoCalcolato && (
              <button
                type="button"
                onClick={() => {
                  setDataScadenza(suggerimentoCalcolato);
                  if (tipoPagamento === 'Bollo') {
                    setPagabileEntroBollo(computeBolloPagabileEntro(suggerimentoCalcolato));
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shrink-0 shadow-sm cursor-pointer transition-colors"
              >
                Applica
              </button>
            )}
          </div>

          {/* SPECIFICO ASSICURAZIONE: MODALITÀ DI PAGAMENTO */}
          {tipoPagamento === 'Assicurazione' && (
            <div className="p-3.5 rounded-2xl bg-[#152033] border border-purple-500/40 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                MODALITÀ DI PAGAMENTO
              </label>
              <select
                value={modalitaAssicurazione}
                onChange={(e) => handleModalitaAssicChange(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="Annuale (pagamento unico)">Annuale (pagamento unico - ogni 12 mesi)</option>
                <option value="Semestrale (2 rate)">Semestrale (2 rate - ogni 6 mesi)</option>
                <option value="Trimestrale (4 rate)">Trimestrale (4 rate - ogni 3 mesi)</option>
                <option value="Mensile (12 rate)">Mensile (12 rate - ogni mese)</option>
              </select>
              <p className="text-[11px] text-purple-300/80 italic">
                Inserisci l'importo di ogni rata nel campo Costo
              </p>
            </div>
          )}

          {/* SPECIFICO REVISIONE: FREQUENZA */}
          {tipoPagamento === 'Revisione' && (
            <div className="p-3.5 rounded-2xl bg-[#152033] border border-amber-500/40 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                FREQUENZA / TIPO DI VEICOLO
              </label>
              <select
                value={frequenzaRevisione}
                onChange={(e) => handleFrequenzaRevChange(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Auto (Normale)">🚗 Auto (Normale) - Biennale (ogni 2 anni)</option>
                <option value="Nuova Immatricolazione">✨ Nuova Immatricolazione (dopo 4 anni)</option>
                <option value="Taxi / NCC / Ambulanza">🚕 Taxi / NCC / Ambulanza (annuale)</option>
                <option value="Autocarro >35q">🚛 Autocarro o speciale (annuale)</option>
              </select>
            </div>
          )}

          {/* Importo Pagato */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Importo Pagato (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base font-black text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-emerald-400">
                EUR (€)
              </span>
            </div>
          </div>

          {/* Ente / Compagnia / Officina con OfficinaSelector */}
          <OfficinaSelector
            value={enteOCompagnia}
            onChange={setEnteOCompagnia}
            officineSalvate={
              tipoPagamento === 'Assicurazione'
                ? ['Allianz', 'Generali', 'UnipolSai', 'Prima', 'Zurich', 'Linear', ...officineSalvate]
                : tipoPagamento === 'Bollo'
                ? ['ACI / Regione', 'PagoPA', 'Tabaccheria / Mooney', 'Poste Italiane', ...officineSalvate]
                : officineSalvate
            }
            label={
              tipoPagamento === 'Assicurazione'
                ? 'Compagnia Assicurativa'
                : tipoPagamento === 'Bollo'
                ? 'Ente Riscossore / Canale'
                : 'Centro Revisioni Autorizzato'
            }
            placeholder={
              tipoPagamento === 'Assicurazione'
                ? 'Nome compagnia assicurativa...'
                : tipoPagamento === 'Bollo'
                ? 'es. ACI, PagoPA...'
                : 'Nome centro revisioni...'
            }
            accentColor={tipoPagamento === 'Bollo' ? 'orange' : tipoPagamento === 'Revisione' ? 'blue' : 'purple'}
          />

          {/* Numero Polizza se assicurazione */}
          {tipoPagamento === 'Assicurazione' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                Numero di Polizza (Opzionale)
              </label>
              <input
                type="text"
                placeholder="es. POL-892183921"
                value={numeroPolizza}
                onChange={(e) => setNumeroPolizza(e.target.value)}
                className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {/* GESTIONE SCADENZE FUTURE & TIMELINE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#131f33] to-[#0c1322] border border-emerald-500/40 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Calendar size={15} />
                <span>Gestione Scadenze Future (Timeline)</span>
              </div>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
                {currentFrequenza}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#09101d] border border-emerald-600/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    1ª Prossima Scadenza:
                  </span>
                  <strong className="text-white text-xs sm:text-sm">
                    {formatDateIt(dataScadenza)}
                  </strong>
                  {tipoPagamento === 'Bollo' && pagabileEntroBollo && (
                    <span className="text-[11px] text-amber-300 block font-medium mt-0.5">
                      ➔ Pagabile entro: {pagabileEntroBollo}
                    </span>
                  )}
                </div>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Prossimo Ciclo
                </span>
              </div>

              {/* Cicli successivi futuri */}
              {futureDeadlines.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Scadenze degli anni successivi calcolate automaticamente:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {futureDeadlines.map((f) => (
                      <div
                        key={f.ciclo}
                        className="p-2 rounded-xl bg-[#0f1726] border border-slate-800 text-[11px]"
                      >
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">
                          {f.etichetta}
                        </span>
                        <strong className="text-slate-200 block mt-0.5">
                          {formatDateIt(f.dataScadenza)}
                        </strong>
                        {f.pagabileEntro && (
                          <span className="text-[9px] text-amber-300/90 block truncate">
                            {f.pagabileEntro}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INTEGRAZIONE GOOGLE CALENDAR */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121c2e] to-[#0c1322] border border-blue-500/40 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-blue-400 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CalendarPlus size={16} />
                <span>Google Calendar (Promemoria & Ricorrenza)</span>
              </div>
              <span className="text-[10px] text-blue-300 font-mono">Notifiche Attive</span>
            </div>

            {/* Toggle Ripetizione Anni Successivi */}
            <div className="p-2.5 rounded-xl bg-[#09101d] border border-blue-900/60 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ripetiAnniSuccessivi}
                  onChange={(e) => setRipetiAnniSuccessivi(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-[#1e293b] border-slate-700 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Ripeti l'evento anche per gli anni successivi
                  </span>
                  <span className="text-[10px] text-blue-300">
                    {tipoPagamento === 'Bollo'
                      ? 'Ricorrenza annuale (+1 anno)'
                      : tipoPagamento === 'Revisione'
                      ? 'Ricorrenza biennale (+2 anni)'
                      : `Ricorrenza periodica (${currentFrequenza})`}
                  </span>
                </div>
              </label>
              <Repeat size={16} className={ripetiAnniSuccessivi ? 'text-blue-400' : 'text-slate-600'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  openGoogleCalendarEvent({
                    title: calendarTitle,
                    description: calendarDesc,
                    startDate: dataScadenza,
                    recurrence: recurrenceRRule,
                  })
                }
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                title="Apre Google Calendar con ricorrenza impostata"
              >
                <CalendarPlus size={15} />
                <span>Aggiungi a Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadIcsFile({
                    title: calendarTitle,
                    description: calendarDesc,
                    startDate: dataScadenza,
                    rrule: recurrenceRRule ? recurrenceRRule.replace('RRULE:', '') : undefined,
                  })
                }
                className="py-2.5 px-3 rounded-xl bg-[#1c293d] hover:bg-[#253752] text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 shadow-md cursor-pointer transition-all"
                title="Scarica file .ics con promemoria"
              >
                <Download size={14} className="text-blue-400" />
                <span>Scarica File (.ICS)</span>
              </button>
            </div>

            {/* Calendario specifico per le Revisioni Auto */}
            <button
              type="button"
              onClick={() => downloadRevisioniCalendarIcs([veicolo])}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 text-amber-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/40 transition-colors cursor-pointer"
            >
              <Calendar size={14} className="text-amber-400" />
              <span>📅 Calendario "Revisioni Auto" (.ics con ricorrenza ogni 2 anni)</span>
            </button>
          </div>

          {/* Checkbox per aggiornamento automatico scadenza veicolo */}
          <div
            onClick={() => setAggiornaScadenzaAuto(!aggiornaScadenzaAuto)}
            className="p-3 rounded-2xl bg-[#141e2e] border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-[#182538] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                  aggiornaScadenzaAuto
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : 'border-slate-700'
                }`}
              >
                {aggiornaScadenzaAuto && <Check size={14} strokeWidth={3} />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Aggiorna scadenza nella scheda del veicolo
                </span>
                <span className="text-[10px] text-slate-400">
                  Imposta la nuova data ({formatDateIt(dataScadenza)}) per {tipoPagamento} su {veicolo.targa}
                </span>
              </div>
            </div>
          </div>

          {/* Scansiona ricevuta o fattura/quietanza */}
          <ReceiptInvoiceUpload
            value={fotoRicevutaUrl}
            onChange={(val) => setFotoRicevutaUrl(val)}
            label="Scansiona quietanza, bollettino o ricevuta"
          />

          {/* Note */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Note Aggiuntive
            </label>
            <textarea
              rows={2}
              placeholder="es. Pagato con carta, ricevuta conservata..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#172233] border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit CTA - Esegui sempre tramite onClick esplicito */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveProcess}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 cursor-pointer active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              <span>Salva nel Registro Pagamenti</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

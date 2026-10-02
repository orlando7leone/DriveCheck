import React, { useState, useEffect } from 'react';
import { Veicolo, InterventoRecord, TipoRecord, CategoriaManutenzione, RegistroGommeData } from '../types';
import { MaintenanceSelectorModal } from './MaintenanceSelectorModal';
import { ReceiptInvoiceUpload } from './ReceiptInvoiceUpload';
import { OfficinaSelector } from './OfficinaSelector';
import {
  ArrowLeft,
  Calendar,
  Save,
  Wrench,
  Disc,
  FileEdit,
  X,
  Bell,
  Check,
  RotateCw,
  Compass,
  ArrowUpDown,
  Tag,
  Euro,
} from 'lucide-react';

export type RecordModalTab = 'manutenzione' | 'gomme' | 'altri_interventi';

export interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  veicolo: Veicolo;
  catalogo: CategoriaManutenzione[];
  onUpdateCatalogo: (catalogo: CategoriaManutenzione[]) => void;
  onSaveRecord: (record: InterventoRecord) => void;
  editingRecord?: InterventoRecord | null;
  initialMode?: 'standard' | 'manutenzione' | 'gomme' | 'altri_interventi';
  officineSalvate?: string[];
}

const quickBrands = [
  'Michelin',
  'Pirelli',
  'Continental',
  'Goodyear',
  'Bridgestone',
  'Hankook',
  'Dunlop',
  'Barum',
  'Firestone',
];

export const NewRecordModal: React.FC<NewRecordModalProps> = ({
  isOpen,
  onClose,
  veicolo,
  catalogo,
  onUpdateCatalogo,
  onSaveRecord,
  editingRecord,
  initialMode = 'manutenzione',
  officineSalvate = [],
}) => {
  // Modalità attiva: manutenzione | gomme | altri_interventi
  const getInitialTab = (): RecordModalTab => {
    if (editingRecord) {
      if (editingRecord.tipo === 'Gomme' || !!editingRecord.registroGomme) return 'gomme';
      if (editingRecord.tipo === 'Altri Interventi') return 'altri_interventi';
      return 'manutenzione';
    }
    if (initialMode === 'gomme') return 'gomme';
    if (initialMode === 'altri_interventi') return 'altri_interventi';
    return 'manutenzione';
  };

  const [activeTab, setActiveTab] = useState<RecordModalTab>(getInitialTab);

  // Campi comuni
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState<number>(veicolo?.kmAttuali || 0);
  const [costo, setCosto] = useState<string>('');
  const [officina, setOfficina] = useState<string>(veicolo?.officina || '');
  const [note, setNote] = useState<string>('');
  const [fotoRicevutaUrl, setFotoRicevutaUrl] = useState<string>('');

  // Campi Manutenzione
  const [titolo, setTitolo] = useState<string>('Manutenzione');
  const [selectedLavorazioni, setSelectedLavorazioni] = useState<
    { lavorazioneId: string; nome: string; categoria: string; sottocategoria: string }[]
  >([]);
  const [haPromemoria, setHaPromemoria] = useState<boolean>(false);
  const [dataPromemoria, setDataPromemoria] = useState<string>('');
  const [kmPromemoria, setKmPromemoria] = useState<string>('');
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  // Campi Altri Interventi
  const [descrizione, setDescrizione] = useState<string>('');

  // Campi Registro Gomme
  const [sostituzioneAnteriori, setSostituzioneAnteriori] = useState<boolean>(false);
  const [sostituzionePosteriori, setSostituzionePosteriori] = useState<boolean>(false);
  const [inversione, setInversione] = useState<boolean>(false);
  const [equilibratura, setEquilibratura] = useState<boolean>(false);
  const [convergenza, setConvergenza] = useState<boolean>(false);
  const [marcaGomme, setMarcaGomme] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingRecord) {
      if (editingRecord.tipo === 'Gomme' || !!editingRecord.registroGomme) {
        setActiveTab('gomme');
        if (editingRecord.registroGomme) {
          setSostituzioneAnteriori(!!editingRecord.registroGomme.sostituzioneAnteriori);
          setSostituzionePosteriori(!!editingRecord.registroGomme.sostituzionePosteriori);
          setInversione(!!editingRecord.registroGomme.inversione);
          setEquilibratura(!!editingRecord.registroGomme.equilibratura);
          setConvergenza(!!editingRecord.registroGomme.convergenza);
          setMarcaGomme(editingRecord.registroGomme.marca || '');
        }
      } else if (editingRecord.tipo === 'Altri Interventi') {
        setActiveTab('altri_interventi');
        setDescrizione(editingRecord.descrizione || '');
      } else {
        setActiveTab('manutenzione');
        setTitolo(editingRecord.titolo || 'Manutenzione');
        setSelectedLavorazioni(editingRecord.lavorazioniSelezionate || []);
      }

      setData(editingRecord.data);
      setKm(editingRecord.km);
      setCosto(editingRecord.costo ? editingRecord.costo.toString() : '');
      setOfficina(editingRecord.officina || veicolo?.officina || '');
      setHaPromemoria(editingRecord.haPromemoria || false);
      setDataPromemoria(editingRecord.dataPromemoria || '');
      setKmPromemoria(editingRecord.kmPromemoria ? editingRecord.kmPromemoria.toString() : '');
      setNote(editingRecord.note || '');
      setFotoRicevutaUrl(editingRecord.fotoRicevutaUrl || '');
    } else {
      const mode =
        initialMode === 'gomme'
          ? 'gomme'
          : initialMode === 'altri_interventi'
          ? 'altri_interventi'
          : 'manutenzione';
      setActiveTab(mode);

      setData(new Date().toISOString().slice(0, 10));
      setKm(veicolo?.kmAttuali || 0);
      setCosto('');
      setNote('');
      setFotoRicevutaUrl('');
      setTitolo('Manutenzione');
      setDescrizione('');
      setSelectedLavorazioni([]);
      setHaPromemoria(false);
      setDataPromemoria('');
      setKmPromemoria((veicolo?.kmAttuali ? veicolo.kmAttuali + 20000 : 20000).toString());

      // Prepopola officina/gommista
      if (mode === 'gomme') {
        const defaultGommista =
          veicolo?.specialisti?.find((s) => s.tipo === 'Gommista')?.nome || veicolo?.officina || '';
        setOfficina(defaultGommista);
      } else {
        setOfficina(veicolo?.officina || '');
      }

      // Reset gomme
      setSostituzioneAnteriori(false);
      setSostituzionePosteriori(false);
      setInversione(false);
      setEquilibratura(false);
      setConvergenza(false);
      setMarcaGomme('');
    }
  }, [editingRecord, veicolo, isOpen, initialMode]);

  const handleLavorazioniSelected = (
    selected: { lavorazioneId: string; nome: string; categoria: string; sottocategoria: string }[]
  ) => {
    setSelectedLavorazioni(selected);
    if (selected.length > 0) {
      const names = selected.map((s) => {
        const clean = s.nome.toLowerCase();
        return clean.charAt(0).toUpperCase() + clean.slice(1);
      });
      setTitolo(names.join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'gomme') {
      const selectedOperations: string[] = [];
      if (sostituzioneAnteriori) selectedOperations.push('Sost. Gomme Anteriori');
      if (sostituzionePosteriori) selectedOperations.push('Sost. Gomme Posteriori');
      if (inversione) selectedOperations.push('Inversione');
      if (equilibratura) selectedOperations.push('Equilibratura');
      if (convergenza) selectedOperations.push('Convergenza');

      const opTitle = selectedOperations.length > 0 ? selectedOperations.join(', ') : 'Servizio Gomme';
      const finalTitle = marcaGomme.trim() ? `${opTitle} (${marcaGomme.trim()})` : opTitle;

      const registroGomme: RegistroGommeData = {
        sostituzioneAnteriori,
        sostituzionePosteriori,
        inversione,
        equilibratura,
        convergenza,
        marca: marcaGomme.trim(),
        importo: parseFloat(costo) || 0,
      };

      const recordToSave: InterventoRecord = {
        id: editingRecord ? editingRecord.id : `rec-gomme-${Date.now()}`,
        veicoloId: veicolo.id,
        tipo: 'Gomme',
        titolo: finalTitle,
        data,
        km: Number(km) || 0,
        costo: parseFloat(costo) || 0,
        officina: officina.trim() || undefined,
        lavorazioniSelezionate: [
          {
            lavorazioneId: 'lav-pneumatici',
            nome: finalTitle.toUpperCase(),
            categoria: '1. MECCANICA GENERALE E TAGLIANDI',
            sottocategoria: 'Pneumatici e Servizi Ruote',
          },
        ],
        registroGomme,
        haPromemoria: true,
        dataPromemoria: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        kmPromemoria: (Number(km) || 0) + 15000,
        note: note.trim()
          ? note.trim()
          : `Marca: ${marcaGomme || 'N/D'} • Misura: ${veicolo.dimensioniGomme || 'Standard'} • Pressioni: ${
              veicolo.pressioneAnteriore || '2.4 bar'
            } ant / ${veicolo.pressionePosteriore || '2.2 bar'} post`,
        fotoRicevutaUrl: fotoRicevutaUrl || undefined,
        createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      };

      onSaveRecord(recordToSave);
      onClose();
      return;
    }

    if (activeTab === 'altri_interventi') {
      const finalTitolo = descrizione.trim().split('\n')[0] || 'Altro Intervento';
      const recordToSave: InterventoRecord = {
        id: editingRecord ? editingRecord.id : `rec-${Date.now()}`,
        veicoloId: veicolo.id,
        tipo: 'Altri Interventi',
        titolo: finalTitolo,
        descrizione: descrizione.trim(),
        data,
        km: Number(km) || 0,
        costo: parseFloat(costo) || 0,
        officina: officina.trim(),
        lavorazioniSelezionate: [
          {
            lavorazioneId: 'lav-altro',
            nome: finalTitolo.toUpperCase(),
            categoria: '4. CARROZZERIA, COMFORT E SERVIZI EXTRA',
            sottocategoria: 'Interventi Vari',
          },
        ],
        haPromemoria: false,
        note: note.trim() || undefined,
        fotoRicevutaUrl: fotoRicevutaUrl || undefined,
        createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      };

      onSaveRecord(recordToSave);
      onClose();
      return;
    }

    // Modalità standard Manutenzione & Tagliandi
    const finalTitolo = titolo.trim() || 'Intervento veicolo';
    const recordToSave: InterventoRecord = {
      id: editingRecord ? editingRecord.id : `rec-${Date.now()}`,
      veicoloId: veicolo.id,
      tipo: 'Manutenzione',
      titolo: finalTitolo,
      data,
      km: Number(km) || 0,
      costo: parseFloat(costo) || 0,
      officina: officina.trim(),
      lavorazioniSelezionate: selectedLavorazioni,
      haPromemoria,
      dataPromemoria: haPromemoria ? dataPromemoria : undefined,
      kmPromemoria: haPromemoria && kmPromemoria ? Number(kmPromemoria) : undefined,
      note: note.trim() || undefined,
      fotoRicevutaUrl: fotoRicevutaUrl || undefined,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    onSaveRecord(recordToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg max-h-[95vh] flex flex-col bg-[#131b26] text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Top Bar with Vehicle Banner */}
          <div className="bg-[#1a2536] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  {editingRecord
                    ? 'Modifica record'
                    : activeTab === 'gomme'
                    ? 'Registro Gomme'
                    : activeTab === 'altri_interventi'
                    ? 'Altri Interventi'
                    : 'Nuovo Intervento'}
                </h2>
                <p className="text-xs text-blue-400 font-medium">
                  {veicolo?.marca} {veicolo?.modello} • <span className="font-mono">{veicolo?.targa}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
              title="Salva record"
            >
              <Save size={18} />
            </button>
          </div>

          {/* 3-Tab Switcher: Manutenzione & Tagliandi | Registro Gomme | Altri Interventi */}
          <div className="px-3 pt-2.5 pb-2 bg-[#0e1625] border-b border-slate-800 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('manutenzione')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'manutenzione'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-950/40'
                  : 'bg-[#152033] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench size={13} className="shrink-0" />
              <span className="truncate">Manutenzione</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gomme')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'gomme'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-950/40'
                  : 'bg-[#152033] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Disc size={13} className="shrink-0" />
              <span className="truncate">Registro Gomme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('altri_interventi')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'altri_interventi'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40'
                  : 'bg-[#152033] text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileEdit size={13} className="shrink-0" />
              <span className="truncate">Altri Interventi</span>
            </button>
          </div>

          {/* Form scrollable container */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* =========================================
                TAB 1: REGISTRO GOMME
            ========================================= */}
            {activeTab === 'gomme' ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Info vettura pneumatici correnti */}
                <div className="p-3 rounded-2xl bg-[#141e2e] border border-cyan-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Disc size={16} />
                    <span>Misura registrata: <strong>{veicolo.dimensioniGomme || 'Non specificata'}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pressioni: {veicolo.pressioneAnteriore || '2.4 bar'} / {veicolo.pressionePosteriore || '2.2 bar'}
                  </div>
                </div>

                {/* KM e DATA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      KM *
                    </label>
                    <input
                      type="number"
                      required
                      value={km || ''}
                      onChange={(e) => setKm(Number(e.target.value))}
                      className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                </div>

                {/* LISTA OPERAZIONI GOMME */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Operazioni Pneumatici Effettuate
                  </label>

                  {/* Sostituzione Anteriori */}
                  <div
                    onClick={() => setSostituzioneAnteriori(!sostituzioneAnteriori)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      sostituzioneAnteriori
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                        : 'bg-[#152033] border-slate-800 text-slate-300 hover:bg-[#1a2942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        sostituzioneAnteriori ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Disc size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Sostituzione Gomme Anteriori</div>
                        <div className="text-[10px] text-slate-400">2 pneumatici anteriori nuovi</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      sostituzioneAnteriori ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-700'
                    }`}>
                      {sostituzioneAnteriori && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Sostituzione Posteriori */}
                  <div
                    onClick={() => setSostituzionePosteriori(!sostituzionePosteriori)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      sostituzionePosteriori
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                        : 'bg-[#152033] border-slate-800 text-slate-300 hover:bg-[#1a2942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        sostituzionePosteriori ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Disc size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Sostituzione Gomme Posteriori</div>
                        <div className="text-[10px] text-slate-400">2 pneumatici posteriori nuovi</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      sostituzionePosteriori ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-700'
                    }`}>
                      {sostituzionePosteriori && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Inversione */}
                  <div
                    onClick={() => setInversione(!inversione)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      inversione
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-md'
                        : 'bg-[#152033] border-slate-800 text-slate-300 hover:bg-[#1a2942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        inversione ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <ArrowUpDown size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Inversione Pneumatici</div>
                        <div className="text-[10px] text-slate-400">Rotazione anteriore / posteriore per usura uniforme</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      inversione ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700'
                    }`}>
                      {inversione && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Equilibratura */}
                  <div
                    onClick={() => setEquilibratura(!equilibratura)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      equilibratura
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                        : 'bg-[#152033] border-slate-800 text-slate-300 hover:bg-[#1a2942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        equilibratura ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <RotateCw size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Equilibratura Ruote</div>
                        <div className="text-[10px] text-slate-400">Bilanciamento per eliminare vibrazioni dello sterzo</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      equilibratura ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700'
                    }`}>
                      {equilibratura && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Convergenza */}
                  <div
                    onClick={() => setConvergenza(!convergenza)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      convergenza
                        ? 'bg-teal-950/40 border-teal-500 text-white shadow-md'
                        : 'bg-[#152033] border-slate-800 text-slate-300 hover:bg-[#1a2942]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        convergenza ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Compass size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase">Convergenza / Assetto</div>
                        <div className="text-[10px] text-slate-400">Assetto ruote e allineamento geometrico</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      convergenza ? 'bg-teal-500 border-teal-400 text-white' : 'border-slate-700'
                    }`}>
                      {convergenza && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* Marca Pneumatici */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Marca Pneumatici
                  </label>
                  <input
                    type="text"
                    placeholder="es. Michelin, Pirelli, Continental..."
                    value={marcaGomme}
                    onChange={(e) => setMarcaGomme(e.target.value)}
                    className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
                    {quickBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMarcaGomme(b)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 border cursor-pointer ${
                          marcaGomme === b
                            ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                            : 'bg-[#141e2e] text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gommista / Centro Pneumatici */}
                <OfficinaSelector
                  value={officina}
                  onChange={setOfficina}
                  officineSalvate={officineSalvate}
                  label="Gommista / Centro Pneumatici"
                  placeholder="Nome del gommista o seleziona dalle officine salvate..."
                  accentColor="cyan"
                />

                {/* Costo Gomme */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Importo / Spesa (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base font-black text-white focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-cyan-400">
                      EUR (€)
                    </span>
                  </div>
                </div>

                {/* Scansione ricevuta */}
                <ReceiptInvoiceUpload
                  value={fotoRicevutaUrl}
                  onChange={(val) => setFotoRicevutaUrl(val)}
                  label="Scansiona ricevuta o fattura gommista"
                />

                {/* CTA Salva Gomme */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 cursor-pointer"
                >
                  <Save size={18} />
                  <span>Salva nel Registro Gomme</span>
                </button>
              </div>
            ) : activeTab === 'altri_interventi' ? (
              /* =========================================
                  TAB 2: ALTRI INTERVENTI (RAPIDO)
              ========================================= */
              <div className="space-y-4 animate-in fade-in">
                {/* Due colonne: KM e DATA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      KM *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="es. 200000"
                      value={km || ''}
                      onChange={(e) => setKm(Number(e.target.value))}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>

                {/* DESCRIZIONE */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Descrizione Intervento *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Descrivi l'intervento effettuato (es. Riparazione serratura, sostituzione lampadina, lucidatura fari, controllo livelli...)"
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>

                {/* Costo Facoltativo */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Importo / Spesa (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00 (facoltativo)"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                {/* Officina / Specialista in Altri Interventi */}
                <OfficinaSelector
                  value={officina}
                  onChange={setOfficina}
                  officineSalvate={officineSalvate}
                  label="Officina / Specialista Intervento"
                  placeholder="Nome officina, carrozziere o specialista..."
                  accentColor="purple"
                />

                {/* Scansiona o allega ricevuta / fattura */}
                <ReceiptInvoiceUpload
                  value={fotoRicevutaUrl}
                  onChange={(val) => setFotoRicevutaUrl(val)}
                  label="Ricevuta o Fattura Intervento (Facoltativa)"
                />

                {/* CTA Salva Altri Interventi */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-950 cursor-pointer"
                >
                  <Save size={18} />
                  <span>Salva in Altri Interventi</span>
                </button>
              </div>
            ) : (
              /* =========================================
                  TAB 3: MANUTENZIONE & TAGLIANDI
              ========================================= */
              <div className="space-y-4 animate-in fade-in">
                {/* Scanziona ricevuta o fattura */}
                <ReceiptInvoiceUpload
                  value={fotoRicevutaUrl}
                  onChange={(val) => setFotoRicevutaUrl(val)}
                  label="Scansiona ricevuta o fattura"
                />

                {/* Due colonne: DATA & KM */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      KM
                    </label>
                    <input
                      type="number"
                      required
                      value={km || ''}
                      onChange={(e) => setKm(Number(e.target.value))}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>

                {/* TITOLO / INTERVENTO */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Titolo / Intervento
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSelectorOpen(true)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Griglia Lavorazioni</span>
                      <span className="text-xs">➔</span>
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="es. Tagliando Completo, Cambio Olio..."
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSelectorOpen(true)}
                      className="absolute right-2 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Scegli
                    </button>
                  </div>

                  {selectedLavorazioni.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-2xl bg-[#0d1522] border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Attività selezionate dalla griglia ({selectedLavorazioni.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLavorazioni.map((s) => (
                          <span
                            key={s.lavorazioneId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-950 border border-blue-700 text-blue-300"
                          >
                            {s.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* COSTO (€) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Costo (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base text-white font-bold focus:outline-none focus:border-blue-500"
                    />
                    {costo && (
                      <button
                        type="button"
                        onClick={() => setCosto('')}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* OFFICINA / GARAGE CON SELETTORE SALVATE O NUOVA */}
                <OfficinaSelector
                  value={officina}
                  onChange={setOfficina}
                  officineSalvate={officineSalvate}
                  label="Officina / Garage"
                  placeholder="Nome dell'officina..."
                  accentColor="orange"
                />

                {/* Promemoria Card */}
                <div className="p-3.5 rounded-2xl bg-[#172033] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Bell size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Aggiungere un promemoria?
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Avvisami al prossimo tagliando o scadenza
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHaPromemoria(!haPromemoria)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        haPromemoria ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          haPromemoria ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {haPromemoria && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          Data Promemoria
                        </label>
                        <input
                          type="date"
                          value={dataPromemoria}
                          onChange={(e) => setDataPromemoria(e.target.value)}
                          className="w-full bg-[#121927] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          KM Promemoria
                        </label>
                        <input
                          type="number"
                          placeholder="es. 220000"
                          value={kmPromemoria}
                          onChange={(e) => setKmPromemoria(e.target.value)}
                          className="w-full bg-[#121927] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Note Facoltative */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                    Note Aggiuntive
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Note opzionali sull'intervento..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[#1a2536] border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* CTA Salva Manutenzione */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-950 cursor-pointer"
                >
                  <Save size={18} />
                  <span>Salva Intervento</span>
                </button>
              </div>
            )}

          </form>

        </div>
      </div>

      {/* Maintenance Selector Catalog Modal */}
      <MaintenanceSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        catalogo={catalogo}
        onUpdateCatalogo={onUpdateCatalogo}
        initialSelected={selectedLavorazioni}
        onConfirm={handleLavorazioniSelected}
      />
    </>
  );
};

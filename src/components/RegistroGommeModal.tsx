import React, { useState } from 'react';
import { Veicolo, InterventoRecord, RegistroGommeData } from '../types';
import { ReceiptInvoiceUpload } from './ReceiptInvoiceUpload';
import { OfficinaSelector } from './OfficinaSelector';
import {
  X,
  ArrowLeft,
  Disc,
  Save,
  Check,
  RotateCw,
  Sliders,
  Compass,
  ArrowUpDown,
  Tag,
  Euro,
  Gauge,
  Calendar,
} from 'lucide-react';

interface RegistroGommeModalProps {
  isOpen: boolean;
  onClose: () => void;
  veicolo: Veicolo;
  onSaveRecord: (record: InterventoRecord) => void;
  editingRecord?: InterventoRecord | null;
  officineSalvate?: string[];
}

export const RegistroGommeModal: React.FC<RegistroGommeModalProps> = ({
  isOpen,
  onClose,
  veicolo,
  onSaveRecord,
  editingRecord,
  officineSalvate = [],
}) => {
  const [km, setKm] = useState<number>(veicolo?.kmAttuali || 0);
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10));

  // Toggles for tyre operations
  const [sostituzioneAnteriori, setSostituzioneAnteriori] = useState<boolean>(false);
  const [sostituzionePosteriori, setSostituzionePosteriori] = useState<boolean>(false);
  const [inversione, setInversione] = useState<boolean>(false);
  const [equilibratura, setEquilibratura] = useState<boolean>(false);
  const [convergenza, setConvergenza] = useState<boolean>(false);

  const [marca, setMarca] = useState<string>('');
  const [gommista, setGommista] = useState<string>('');
  const [importo, setImporto] = useState<string>('');
  const [fotoRicevutaUrl, setFotoRicevutaUrl] = useState<string>('');

  React.useEffect(() => {
    if (editingRecord && isOpen) {
      setKm(editingRecord.km || 0);
      setData(editingRecord.data || new Date().toISOString().slice(0, 10));
      setImporto(editingRecord.costo ? editingRecord.costo.toString() : '');
      setFotoRicevutaUrl(editingRecord.fotoRicevutaUrl || '');
      setGommista(editingRecord.officina || '');
      if (editingRecord.registroGomme) {
        setSostituzioneAnteriori(!!editingRecord.registroGomme.sostituzioneAnteriori);
        setSostituzionePosteriori(!!editingRecord.registroGomme.sostituzionePosteriori);
        setInversione(!!editingRecord.registroGomme.inversione);
        setEquilibratura(!!editingRecord.registroGomme.equilibratura);
        setConvergenza(!!editingRecord.registroGomme.convergenza);
        setMarca(editingRecord.registroGomme.marca || '');
      } else {
        setSostituzioneAnteriori(false);
        setSostituzionePosteriori(false);
        setInversione(false);
        setEquilibratura(false);
        setConvergenza(false);
        setMarca('');
      }
    } else if (veicolo && isOpen) {
      setKm(veicolo.kmAttuali || 0);
      setData(new Date().toISOString().slice(0, 10));
      setSostituzioneAnteriori(false);
      setSostituzionePosteriori(false);
      setInversione(false);
      setEquilibratura(false);
      setConvergenza(false);
      setMarca('');
      setImporto('');
      setFotoRicevutaUrl('');
      const defaultGommista =
        veicolo.specialisti?.find((s) => s.tipo === 'Gommista')?.nome ||
        veicolo.officina ||
        '';
      setGommista(defaultGommista);
    }
  }, [veicolo, isOpen, editingRecord]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedOperations: string[] = [];
    if (sostituzioneAnteriori) selectedOperations.push('Sost. Gomme Anteriori');
    if (sostituzionePosteriori) selectedOperations.push('Sost. Gomme Posteriori');
    if (inversione) selectedOperations.push('Inversione');
    if (equilibratura) selectedOperations.push('Equilibratura');
    if (convergenza) selectedOperations.push('Convergenza');

    const opTitle = selectedOperations.length > 0 ? selectedOperations.join(', ') : 'Servizio Gomme';
    const finalTitle = marca.trim() ? `${opTitle} (${marca.trim()})` : opTitle;

    const registroGomme: RegistroGommeData = {
      sostituzioneAnteriori,
      sostituzionePosteriori,
      inversione,
      equilibratura,
      convergenza,
      marca: marca.trim(),
      importo: parseFloat(importo) || 0,
    };

    const newRecord: InterventoRecord = {
      id: editingRecord ? editingRecord.id : `rec-gomme-${Date.now()}`,
      veicoloId: veicolo.id,
      tipo: 'Gomme',
      titolo: finalTitle,
      data,
      km: Number(km) || 0,
      costo: parseFloat(importo) || 0,
      officina: gommista.trim() || undefined,
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
      dataPromemoria: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // +6 mesi
      kmPromemoria: (Number(km) || 0) + 15000, // +15.000 km per inversione
      note: `Marca: ${marca || 'N/D'} • Misura: ${veicolo.dimensioniGomme || 'Standard'} • Pressioni: ${veicolo.pressioneAnteriore || '2.4 bar'} ant / ${veicolo.pressionePosteriore || '2.2 bar'} post`,
      fotoRicevutaUrl: fotoRicevutaUrl || undefined,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    onClose();
  };

  const quickBrands = ['Michelin', 'Pirelli', 'Continental', 'Goodyear', 'Bridgestone', 'Hankook'];

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[95vh] flex flex-col bg-[#111827] text-white rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-cyan-700 via-teal-700 to-blue-700 px-5 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Registro Gomme</h2>
              <p className="text-xs text-cyan-200 font-mono">
                {veicolo.marca} {veicolo.modello} • {veicolo.targa}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          
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
              <div className="relative">
                <input
                  type="number"
                  required
                  value={km || ''}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
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

          {/* LISTA INTERVENTI GOMME (Checkboxes/Toggles) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Operazioni Effettuate
            </label>

            {/* SOSTITUZIONE GOMME ANTERIORI */}
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
                  sostituzioneAnteriori ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Disc size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase">Sostituzione Gomme Anteriori</div>
                  <div className="text-[10px] text-slate-400">Montaggio nuovo treno anteriore</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                sostituzioneAnteriori ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-slate-700'
              }`}>
                {sostituzioneAnteriori && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            {/* SOSTITUZIONE GOMME POSTERIORI */}
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
                  sostituzionePosteriori ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Disc size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase">Sostituzione Gomme Posteriori</div>
                  <div className="text-[10px] text-slate-400">Montaggio nuovo treno posteriore</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                sostituzionePosteriori ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-slate-700'
              }`}>
                {sostituzionePosteriori && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            {/* INVERSIONE */}
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
                  <div className="text-xs font-bold uppercase">Inversione</div>
                  <div className="text-[10px] text-slate-400">Rotazione ruote ant. / post. per usura omogenea</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                inversione ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700'
              }`}>
                {inversione && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            {/* EQUILIBRATURA */}
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
                  <div className="text-xs font-bold uppercase">Equilibratura</div>
                  <div className="text-[10px] text-slate-400">Bilanciatura dinamica dei cerchi</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                equilibratura ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700'
              }`}>
                {equilibratura && <Check size={14} strokeWidth={3} />}
              </div>
            </div>

            {/* CONVERGENZA */}
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
                  <div className="text-xs font-bold uppercase">Convergenza</div>
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

          {/* MARCA GOMME */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Marca Pneumatici
            </label>
            <input
              type="text"
              placeholder="es. Michelin, Pirelli, Continental..."
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
            />
            {/* Quick Brand Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin">
              {quickBrands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMarca(b)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 border ${
                    marca === b
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400'
                      : 'bg-[#141e2e] text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* GOMMISTA / OFFICINA DI FIDUCIA */}
          <OfficinaSelector
            value={gommista}
            onChange={setGommista}
            officineSalvate={officineSalvate}
            label="Gommista / Centro Pneumatici"
            placeholder="Nome del gommista o seleziona dalle officine salvate..."
            accentColor="cyan"
          />

          {/* IMPORTO */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Importo (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="es. 400.00"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full bg-[#172233] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base font-black text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-cyan-400">
                EUR (€)
              </span>
            </div>
          </div>

          {/* Scansiona o allega ricevuta / fattura gommista */}
          <ReceiptInvoiceUpload
            value={fotoRicevutaUrl}
            onChange={(val) => setFotoRicevutaUrl(val)}
            label="Scansiona ricevuta o fattura gommista"
          />

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 cursor-pointer"
            >
              <Save size={18} />
              <span>Salva nel Registro Gomme</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface ReceiptInvoiceUploadProps {
  value?: string;
  onChange: (base64Url: string) => void;
  label?: string;
}

export const ReceiptInvoiceUpload: React.FC<ReceiptInvoiceUploadProps> = ({
  value,
  onChange,
  label = 'Scansiona ricevuta o fattura',
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Fattura / Ricevuta inserita
          </span>
        )}
      </div>

      {!value ? (
        /* Dotted action container */
        <div className="border border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-3 bg-[#0d1522]/70 flex items-center justify-around text-xs text-slate-300 transition-colors">
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-800/60">
            <Camera size={18} className="text-blue-400" />
            <span className="font-semibold text-xs">Scansiona con Fotocamera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="w-px h-6 bg-slate-800" />

          <label className="flex items-center gap-2 cursor-pointer hover:text-purple-400 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-800/60">
            <ImageIcon size={18} className="text-purple-400" />
            <span className="font-semibold text-xs">Galleria / File</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* Thumbnail and actions */
        <div className="p-3 rounded-2xl bg-[#0e1625] border border-slate-700/80 flex items-center justify-between gap-3">
          <div
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-slate-700 shrink-0 relative">
              <img
                src={value}
                alt="Fattura o Ricevuta"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <Eye size={16} className="text-white opacity-80" />
              </div>
            </div>

            <div className="truncate">
              <span className="text-xs font-bold text-white block group-hover:text-blue-300 transition-colors">
                Ricevuta / Fattura allegata
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Tocca per ingrandire l'immagine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
              Sostituisci
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => onChange('')}
              className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Rimuovi fattura"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {isPreviewOpen && value && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <FileText size={16} className="text-blue-400" />
              <span>Anteprima Ricevuta / Fattura</span>
            </div>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={value}
              alt="Ricevuta o Fattura a tutto schermo"
              className="max-h-[82vh] max-w-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

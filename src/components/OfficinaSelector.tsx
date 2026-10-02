import React, { useState } from 'react';
import { Building2, Plus, Check, ChevronDown, Wrench } from 'lucide-react';

interface OfficinaSelectorProps {
  value: string;
  onChange: (val: string) => void;
  officineSalvate: string[];
  label?: string;
  placeholder?: string;
  accentColor?: 'blue' | 'cyan' | 'purple' | 'orange';
}

export const OfficinaSelector: React.FC<OfficinaSelectorProps> = ({
  value,
  onChange,
  officineSalvate,
  label = 'Officina / Centro Assistenza',
  placeholder = 'Nome officina o specialista...',
  accentColor = 'blue',
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Filter and deduplicate saved workshops
  const uniqueSalvate = Array.from(
    new Set(
      officineSalvate
        .map((o) => o?.trim())
        .filter((o): o is string => Boolean(o && o.length > 1))
    )
  );

  const getBorderAccent = () => {
    if (accentColor === 'cyan') return 'focus:border-cyan-400 border-cyan-800/60';
    if (accentColor === 'purple') return 'focus:border-purple-400 border-purple-800/60';
    if (accentColor === 'orange') return 'focus:border-orange-400 border-orange-800/60';
    return 'focus:border-blue-400 border-slate-700/80';
  };

  const getPillActiveBg = () => {
    if (accentColor === 'cyan') return 'bg-cyan-500 text-black border-cyan-400 font-bold';
    if (accentColor === 'purple') return 'bg-purple-600 text-white border-purple-400 font-bold';
    if (accentColor === 'orange') return 'bg-orange-500 text-white border-orange-400 font-bold';
    return 'bg-blue-600 text-white border-blue-400 font-bold';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Building2 size={13} className="text-slate-400" />
          <span>{label}</span>
        </label>

        {uniqueSalvate.length > 0 && (
          <span className="text-[9px] text-slate-400 font-medium">
            {uniqueSalvate.length} {uniqueSalvate.length === 1 ? 'salvata' : 'salvate'}
          </span>
        )}
      </div>

      {/* Pillole rapide delle officine salvate in precedenza */}
      {uniqueSalvate.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
            Seleziona dalle officine salvate in precedenza:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
            {uniqueSalvate.map((off) => {
              const isSelected = value.trim().toLowerCase() === off.toLowerCase();
              return (
                <button
                  key={off}
                  type="button"
                  onClick={() => {
                    onChange(off);
                    setIsCustomMode(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isSelected
                      ? getPillActiveBg()
                      : 'bg-[#152033] hover:bg-[#1e2d47] text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
                >
                  <Building2 size={12} className={isSelected ? 'text-inherit' : 'text-slate-400'} />
                  <span className="truncate max-w-[180px]">{off}</span>
                  {isSelected && <Check size={12} strokeWidth={3} className="shrink-0" />}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                onChange('');
              }}
              className="px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition-colors cursor-pointer"
            >
              <Plus size={12} />
              <span>+ Inserisci nuova</span>
            </button>
          </div>
        </div>
      )}

      {/* Campo di testo per inserire o modificare l'officina */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#172233] border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-medium focus:outline-none ${getBorderAccent()}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs px-1"
            title="Cancella"
          >
            ✕
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-400 italic">
        Puoi selezionare un'officina già usata o scriverne una nuova: verrà ricordata per le prossime volte.
      </p>
    </div>
  );
};

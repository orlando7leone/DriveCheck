import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Share2,
  MoreVertical,
  Layers,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scarica / Installa l'App</h3>
              <p className="text-xs text-blue-400 font-medium">CarTracker Pro su Android & Smartphone</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status: Already Installed? */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/70 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>L'applicazione è già installata in modalità autonoma sul tuo dispositivo!</span>
          </div>
        ) : isInstallable ? (
          /* Direct 1-Click Install CTA if browser supports prompt */
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/70 space-y-2.5 text-center">
            <h4 className="text-sm font-bold text-white">Installazione Rapida</h4>
            <p className="text-xs text-slate-300">
              Installa l'app direttamente sul tuo dispositivo per utilizzarla a schermo intero come una normale app scaricata dal Play Store.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download size={18} />
              <span>Installa Subito CarTracker Pro</span>
            </button>
          </div>
        ) : null}

        {/* GUIDA PASSO PASSO ANDROID */}
        <div className="p-4 rounded-2xl bg-[#152033] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Smartphone size={16} /> Come installare su Android (Chrome o Samsung Internet)
          </div>

          <ol className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Apri questo link con il browser <strong>Google Chrome</strong> sul tuo telefono Android.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                Tocca i <strong>tre puntini (⋮)</strong> in alto a destra nel menu di Chrome.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                Tocca la voce <strong>"Aggiungi a schermata Home"</strong> oppure <strong>"Installa app"</strong>.
              </span>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                Conferma con <strong>"Installa"</strong>: l'icona di <strong>CarTracker Pro</strong> comparirà tra le applicazioni e sulla schermata del telefono, funzionando anche offline e senza barra del browser!
              </span>
            </li>
          </ol>
        </div>

        {/* GUIDA IPHONE / IPAD */}
        <div className="p-4 rounded-2xl bg-[#152033] border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Share2 size={16} /> Su iPhone / iPad (Safari)
          </div>

          <p className="text-xs text-slate-300">
            Apri il link in <strong>Safari</strong>, tocca l'icona di condivisione <Share2 className="inline text-blue-400 mx-1" size={13} />, scorri verso il basso e seleziona <strong>"Aggiungi alla schermata Home"</strong>.
          </p>
        </div>

        {/* Link Condivisibile */}
        <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Link dell'applicazione:</span>
            <button
              onClick={handleCopyLink}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Copiato!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copia link</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2 rounded-xl bg-[#141e2e] border border-slate-700/60 font-mono text-[11px] text-blue-300 break-all select-all">
            {currentUrl}
          </div>
        </div>

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Ho capito, chiudi
        </button>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Veicolo, InterventoRecord, CategoriaManutenzione, AppDataBackup, DriveBackupFileInfo } from '../types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
} from '../services/firebaseAuth';
import {
  saveBackupToGoogleDrive,
  restoreBackupFromGoogleDrive,
  findDriveBackupFile,
  deleteBackupFromGoogleDrive,
} from '../services/googleDriveService';
import { syncVehicleDeadlinesToGoogleCalendar } from '../services/googleCalendarService';
import {
  exportFullBackupJson,
  downloadJsonBackupFile,
  exportRecordsToCsv,
  downloadCsvFile,
  exportCatalogJson,
  downloadCatalogJsonFile,
  formatDateIt,
} from '../services/storageService';
import { DEFAULT_CATALOG } from '../data/defaultCatalog';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sliders,
  Globe,
  Moon,
  Bell,
  HelpCircle,
  FileText,
  Info,
  Car,
  Smartphone,
  HardDrive,
  Wifi,
  FolderDown,
  FolderUp,
  FolderSync,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  veicoli: Veicolo[];
  record: InterventoRecord[];
  catalogo: CategoriaManutenzione[];
  selectedVehicleId: string;
  onRestoreAllData: (data: AppDataBackup) => void;
  onResetCatalog: () => void;
  onUpdateCatalogo?: (catalogo: CategoriaManutenzione[]) => void;
  onOpenInstallModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  veicoli,
  record,
  catalogo,
  selectedVehicleId,
  onRestoreAllData,
  onResetCatalog,
  onUpdateCatalogo,
  onOpenInstallModal,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [driveBackupInfo, setDriveBackupInfo] = useState<DriveBackupFileInfo | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Destructive Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'restore_drive' | 'delete_drive' | 'restore_local' | 'reset_catalog' | 'import_catalog';
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'restore_drive',
  });

  const selectedVehicle = veicoli.find((v) => v.id === selectedVehicleId) || veicoli[0];

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        checkDriveBackup();
      },
      () => {
        setCurrentUser(null);
        setDriveBackupInfo(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const checkDriveBackup = async () => {
    try {
      const file = await findDriveBackupFile();
      setDriveBackupInfo(file);
    } catch (e) {
      console.warn('Controllo backup Drive:', e);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setFeedbackMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setFeedbackMessage({
          type: 'success',
          text: `Accesso eseguito come ${res.user.email}. Google Drive pronto per il backup.`,
        });
        await checkDriveBackup();
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Errore di accesso con Google: ${err.message || err}`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setDriveBackupInfo(null);
    setFeedbackMessage({
      type: 'info',
      text: 'Disconnesso da Google Account.',
    });
  };

  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);

  const handleSyncAllVehiclesToCalendar = async () => {
    setIsSyncingCalendar(true);
    setFeedbackMessage(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn(true);
        token = res.accessToken;
        setCurrentUser(res.user);
      }

      if (!token) {
        throw new Error('Accesso Google non completato.');
      }

      const activeVehicles = veicoli.filter((v) => v.scadenzaBollo || v.scadenzaRevisione || v.scadenzaAssicurazione);
      if (activeVehicles.length === 0) {
        throw new Error('Nessun veicolo ha scadenze impostate per Bollo, Revisione o Assicurazione.');
      }

      let totalAdded = 0;
      let totalUpdated = 0;
      let calendarName = 'Scadenze Auto';

      for (const v of activeVehicles) {
        const syncRes = await syncVehicleDeadlinesToGoogleCalendar(token, v);
        totalAdded += syncRes.eventsAdded;
        totalUpdated += syncRes.eventsUpdated;
        calendarName = syncRes.calendarName;
      }

      setFeedbackMessage({
        type: 'success',
        text: `✓ Calendario Google "${calendarName}" sincronizzato con successo (${totalAdded + totalUpdated} scadenze per ${activeVehicles.length} veicoli)!`,
      });
    } catch (err: any) {
      console.error('Errore sincronizzazione calendario:', err);
      if (err?.message?.includes('Permessi') || err?.message?.includes('401') || err?.message?.includes('403')) {
        try {
          const fresh = await googleSignIn(true);
          setCurrentUser(fresh.user);
          setFeedbackMessage({
            type: 'info',
            text: 'Autorizzazioni Google Calendar aggiornate! Clicca di nuovo per sincronizzare le scadenze.',
          });
          return;
        } catch (innerErr: any) {
          setFeedbackMessage({
            type: 'error',
            text: `Errore autorizzazione Google Calendar: ${innerErr?.message || innerErr}`,
          });
          return;
        }
      }

      setFeedbackMessage({
        type: 'error',
        text: `Errore sincronizzazione: ${err?.message || err}`,
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!currentUser) {
      handleGoogleLogin();
      return;
    }

    setIsSyncing(true);
    setFeedbackMessage(null);
    try {
      const backupData: AppDataBackup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        veicoli,
        record,
        catalogoPersonalizzato: catalogo,
        veicoloSelezionatoId: selectedVehicleId,
      };

      const result = await saveBackupToGoogleDrive(backupData);
      await checkDriveBackup();
      setFeedbackMessage({
        type: 'success',
        text: `Backup salvato con successo su Google Drive (${new Date().toLocaleTimeString('it-IT')})!`,
      });
    } catch (e: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Errore salvataggio su Drive: ${e.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const requestRestoreFromDrive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ripristinare i dati da Google Drive?',
      description:
        'ATTENZIONE: Questa operazione sovrascriverà i dati correnti del parco macchine e dello storico manutenzioni con la copia presente su Google Drive.',
      actionType: 'restore_drive',
    });
  };

  const requestDeleteFromDrive = () => {
    if (!driveBackupInfo) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminare il backup da Google Drive?',
      description:
        'ATTENZIONE: Il file "cartracker_pro_backup.json" verrà rimosso definitivamente dal tuo Google Drive. Questa azione non può essere annullata.',
      actionType: 'delete_drive',
      payload: driveBackupInfo.id,
    });
  };

  const executeConfirmedAction = async () => {
    const { actionType, payload } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, isOpen: false });

    if (actionType === 'restore_drive') {
      setIsSyncing(true);
      setFeedbackMessage(null);
      try {
        const { data } = await restoreBackupFromGoogleDrive();
        onRestoreAllData(data);
        setFeedbackMessage({
          type: 'success',
          text: `Dati ripristinati con successo da Google Drive! (${data.veicoli.length} veicoli, ${data.record.length} record)`,
        });
      } catch (e: any) {
        setFeedbackMessage({
          type: 'error',
          text: `Errore ripristino da Drive: ${e.message}`,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (actionType === 'delete_drive') {
      setIsSyncing(true);
      try {
        await deleteBackupFromGoogleDrive(payload);
        setDriveBackupInfo(null);
        setFeedbackMessage({
          type: 'success',
          text: 'Backup rimosso da Google Drive con successo.',
        });
      } catch (e: any) {
        setFeedbackMessage({
          type: 'error',
          text: `Errore eliminazione backup: ${e.message}`,
        });
      } finally {
        setIsSyncing(false);
      }
    } else if (actionType === 'restore_local') {
      onRestoreAllData(payload);
      setFeedbackMessage({
        type: 'success',
        text: 'Backup locale ripristinato con successo!',
      });
    } else if (actionType === 'reset_catalog') {
      onResetCatalog();
      setFeedbackMessage({
        type: 'info',
        text: 'Catalogo originale delle lavorazioni ripristinato.',
      });
    } else if (actionType === 'import_catalog') {
      if (onUpdateCatalogo) {
        onUpdateCatalogo(payload);
      }
      setFeedbackMessage({
        type: 'success',
        text: `Catalogo importato con successo (${payload.length} categorie)!`,
      });
    }
  };

  const handleExportCatalog = () => {
    const json = exportCatalogJson(catalogo);
    downloadCatalogJsonFile(json);
    setFeedbackMessage({
      type: 'success',
      text: 'File JSON del catalogo salvato con successo sul tuo dispositivo!',
    });
  };

  const handleImportCatalogFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed) || !parsed[0]?.sottocategorie) {
          throw new Error('Il file non contiene un catalogo valido di categorie e lavorazioni');
        }
        setConfirmDialog({
          isOpen: true,
          title: 'Importare il catalogo degli interventi?',
          description: `Verranno importate ${parsed.length} categorie di interventi. Il catalogo attuale verrà aggiornato.`,
          actionType: 'import_catalog',
          payload: parsed,
        });
      } catch (err: any) {
        setFeedbackMessage({
          type: 'error',
          text: `Errore caricamento catalogo: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJson = () => {
    const jsonStr = exportFullBackupJson(veicoli, record, catalogo, selectedVehicleId);
    downloadJsonBackupFile(jsonStr);
  };

  const handleLocalFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: AppDataBackup = JSON.parse(event.target?.result as string);
        if (!parsed.veicoli || !Array.isArray(parsed.veicoli)) {
          throw new Error('Formato backup non valido');
        }
        setConfirmDialog({
          isOpen: true,
          title: 'Ripristinare il file di backup locale?',
          description: `Il file contiene ${parsed.veicoli.length} veicoli e ${parsed.record?.length || 0} interventi. I dati correnti verranno sostituiti.`,
          actionType: 'restore_local',
          payload: parsed,
        });
      } catch (err: any) {
        setFeedbackMessage({
          type: 'error',
          text: `Errore lettura file JSON: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCsv = (soloVeicoloSelezionato: boolean) => {
    const recordsToExport = soloVeicoloSelezionato && selectedVehicle
      ? record.filter((r) => r.veicoloId === selectedVehicle.id)
      : record;

    const csvStr = exportRecordsToCsv(selectedVehicle, recordsToExport);
    const filename = soloVeicoloSelezionato && selectedVehicle
      ? `cartracker_${selectedVehicle.targa}_report.csv`
      : 'cartracker_tutta_la_cronologia.csv';
    downloadCsvFile(csvStr, filename);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Impostazioni & Backup
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cloud sync Google Drive, esportazione report e preferenze
        </p>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs animate-in slide-in-from-top-2 border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-600/70 text-rose-200'
              : 'bg-blue-950/40 border-blue-600/70 text-blue-200'
          }`}
        >
          {feedbackMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
          {feedbackMessage.type === 'error' && <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
          {feedbackMessage.type === 'info' && <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />}
          <div className="flex-1 font-medium">{feedbackMessage.text}</div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Banner Installa Applicazione su Android / Telefono */}
      {onOpenInstallModal && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/50 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Installa CarTracker Pro su Android
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Usa l'app a schermo intero come una normale app scaricata
              </p>
            </div>
          </div>

          <button
            onClick={onOpenInstallModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-md cursor-pointer transition-colors"
          >
            Istruzioni
          </button>
        </div>
      )}

      {/* Come funziona il salvataggio: Offline & Cloud */}
      <div className="p-4 rounded-3xl bg-[#141e2e] border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <HardDrive size={16} /> Dove vengono salvati i tuoi dati?
        </div>

        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="p-3 rounded-2xl bg-[#0e1625] border border-slate-800/80 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              1
            </div>
            <div>
              <strong className="text-white block">Senza Internet (Offline al 100%):</strong>
              Tutti i dati che inserisci (nuove auto, tagliandi, chilometri, scadenze bollo/revisione, registro gomme) vengono salvati <strong>istantaneamente nella memoria protetta del tuo telefono</strong>. Non perdi nulla anche se sei in garage o in officina senza segnale!
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0e1625] border border-slate-800/80 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              2
            </div>
            <div>
              <strong className="text-white block">Quando torna la connessione Internet:</strong>
              Ti basta toccare il pulsante <strong>"Salva su Google Drive"</strong> qui sotto: l'app caricherà sul tuo cloud personale un backup sicuro e aggiornato con tutte le modifiche fatte offline.
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0e1625] border border-slate-800/80 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              3
            </div>
            <div>
              <strong className="text-white block">Ripristino su un altro telefono:</strong>
              Se cambi smartphone o reinstalli l'app, tocca <strong>"Ripristina da Drive"</strong> per riscaricare in 2 secondi tutto il tuo parco macchine e lo storico completo!
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: BACKUP SU GOOGLE DRIVE (matching screenshot 11) */}
      <div className="rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="text-blue-400" size={18} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Backup Cloud Google Drive
            </h2>
          </div>
          {isSyncing && (
            <span className="text-[10px] text-blue-300 flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" /> Sincronizzazione...
            </span>
          )}
        </div>

        <div className="p-4 space-y-4">
          
          {/* Account Google row */}
          {!currentUser ? (
            <div className="p-4 rounded-2xl bg-[#0e1625] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Account Google</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connetti il tuo account Google per salvare e sincronizzare in sicurezza su Google Drive
                </p>
              </div>

              {/* Official Google sign-in button design */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs flex items-center gap-2.5 shadow-md hover:bg-slate-100 transition-all cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.64-5.2 3.64-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.67-4.93H1.27v3.15C3.33 21.45 7.4 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.33 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.06-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.4 0 3.33 2.55 1.27 6.58l4.06 3.15c.93-2.83 3.57-4.98 6.67-4.98z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Connessione...' : 'Accedi con Google'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0e1625] border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-blue-500/60"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Account Google'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoogleLogin}
                  className="text-xs text-blue-300 hover:text-white font-semibold flex items-center gap-1 border border-blue-500/40 px-2.5 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 transition-colors cursor-pointer"
                  title="Cambia account Google o autorizza Google Calendar"
                >
                  <RefreshCw size={13} />
                  <span>Cambia / Autorizza</span>
                </button>

                <button
                  onClick={handleGoogleLogout}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Disconnetti"
                >
                  <LogOut size={14} /> Esci
                </button>
              </div>
            </div>
          )}

          {/* Drive Action Buttons (matching screenshot 11: Salva, Ripristina, Rimuovi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Salva su Drive */}
            <button
              onClick={handleSaveToDrive}
              disabled={isSyncing}
              className="p-3.5 rounded-2xl bg-[#1b273b] hover:bg-[#22334d] border border-slate-700/80 flex items-center gap-3 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CloudUpload size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Salva su Google Drive</h4>
                <p className="text-[10px] text-slate-400">
                  Carica veicoli e manutenzioni sul cloud
                </p>
              </div>
            </button>

            {/* Ripristina da Drive */}
            <button
              onClick={requestRestoreFromDrive}
              disabled={isSyncing || !currentUser}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all group cursor-pointer ${
                currentUser
                  ? 'bg-[#1b273b] hover:bg-[#22334d] border-slate-700/80'
                  : 'bg-[#121926] border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CloudDownload size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ripristina da Drive</h4>
                <p className="text-[10px] text-slate-400">
                  Scarica e ricarica i tuoi dati salvati
                </p>
              </div>
            </button>

          </div>

          {/* Status info of file in Google Drive */}
          {driveBackupInfo && (
            <div className="p-3 rounded-xl bg-[#0b101b] border border-slate-800 flex items-center justify-between text-[11px]">
              <div className="text-slate-400">
                Ultimo backup salvato su Drive:{' '}
                <strong className="text-white">
                  {driveBackupInfo.modifiedTime ? formatDateIt(driveBackupInfo.modifiedTime.slice(0, 10)) : 'Presente'}
                </strong>
              </div>
              <button
                onClick={requestDeleteFromDrive}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 text-[10px]"
              >
                <Trash2 size={12} /> Rimuovi backup
              </button>
            </div>
          )}

        </div>
      </div>

      {/* SECTION: GOOGLE CALENDAR - SCADENZE AUTO */}
      <div className="rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-950 via-[#192437] to-[#121c2d] border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <CalendarDays size={16} /> Google Calendar: "Scadenze Auto"
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700 text-indigo-200 font-mono">
            Sincronizzazione
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <p className="text-xs text-slate-300 leading-relaxed">
            Invia in automatico tutte le scadenze del tuo parco auto (<strong>Bollo Auto</strong> con dicitura <em>Pagabile entro</em>, <strong>Revisione</strong> ed <strong>Assicurazione RCA</strong>) nel calendario Google dedicato <strong>"Scadenze Auto"</strong> con promemoria a 30 e 7 giorni.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={handleSyncAllVehiclesToCalendar}
              disabled={isSyncingCalendar}
              className="flex-1 min-w-[220px] py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncingCalendar ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sincronizzazione in corso...</span>
                </>
              ) : (
                <>
                  <CalendarDays size={15} />
                  <span>Sincronizza tutte le auto su "Scadenze Auto"</span>
                </>
              )}
            </button>

            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
            >
              <ExternalLink size={13} />
              <span>Apri Google Calendar</span>
            </a>
          </div>
        </div>
      </div>

      {/* SECTION: ESPORTA E IMPORTA DATI LOCALI (matching screenshots 5 & 11) */}
      <div className="rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-slate-900 to-[#192437] border-b border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <FileSpreadsheet size={16} /> Esporta e Importa Dati Locali
          </h2>
        </div>

        <div className="p-4 space-y-3">
          
          {/* CSV / Excel Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handleExportCsv(true)}
              className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Report CSV {selectedVehicle?.targa}
                </span>
                <span className="text-[10px] text-slate-400">
                  Esporta per Excel l'auto selezionata
                </span>
              </div>
            </button>

            <button
              onClick={() => handleExportCsv(false)}
              className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Report CSV Completo
                </span>
                <span className="text-[10px] text-slate-400">
                  Tutti i veicoli e cronologia completa
                </span>
              </div>
            </button>
          </div>

          {/* JSON Backup & Restore Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            
            {/* Esporta JSON */}
            <button
              onClick={handleExportJson}
              className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Download size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Backup Completo (JSON)
                </span>
                <span className="text-[10px] text-slate-400">
                  Salva file .json con veicoli e catalogo
                </span>
              </div>
            </button>

            {/* Importa JSON */}
            <label className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Upload size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Ripristina da File JSON
                </span>
                <span className="text-[10px] text-slate-400">
                  Seleziona file .json salvato sul dispositivo
                </span>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleLocalFileImport}
                className="hidden"
              />
            </label>

          </div>

        </div>
      </div>

      {/* SECTION: CATALOGO MANUTENZIONI */}
      <div className="rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl p-4 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <FolderSync size={16} /> Catalogo Interventi e Categorie
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {catalogo.length} categorie e tutte le lavorazioni (ordinamento A-Z attivo)
            </p>
          </div>
          <button
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Ripristinare il catalogo predefinito?',
                description:
                  'Verranno ripristinate le categorie e lavorazioni standard della tabella iniziale.',
                actionType: 'reset_catalog',
              })
            }
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            Ripristina Predefinito
          </button>
        </div>

        {/* Pulsanti Esporta & Importa Catalogo (Locale e Cloud) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportCatalog}
            className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <FolderDown size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Esporta Catalogo (JSON Locale)
              </span>
              <span className="text-[10px] text-slate-400">
                Scarica file con le categorie e lavorazioni
              </span>
            </div>
          </button>

          <label className="p-3 rounded-2xl bg-[#0e1625] hover:bg-[#152236] border border-slate-800 flex items-center gap-3 text-left transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <FolderUp size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Importa Catalogo da File
              </span>
              <span className="text-[10px] text-slate-400">
                Carica file JSON del catalogo personalizzato
              </span>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportCatalogFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Chiarimento Backup Completo */}
        <div className="p-3 rounded-2xl bg-[#0d1422] border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block">Il Backup Completo esporta anche il catalogo?</strong>
            <span className="text-slate-400">
              Sì! Quando effettui un <strong>Backup Completo</strong> (sia salvando su <strong>Google Drive</strong> che esportando il file <strong>JSON Locale</strong>), l'applicazione esporta automaticamente l'intero parco auto, tutti i veicoli, la cronologia completa delle manutenzioni <strong>e l'intero catalogo personalizzato con categorie e lavorazioni</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: PREFERENZE & INFO (matching screenshot 2 & 11) */}
      <div className="rounded-3xl bg-[#141e2e] border border-slate-800 shadow-xl divide-y divide-slate-800/80">
        <div className="p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Globe size={16} className="text-blue-400" />
            <span>Lingua dell'applicazione</span>
          </div>
          <span className="font-bold text-white">Italiano</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Moon size={16} className="text-indigo-400" />
            <span>Tema dell'applicazione</span>
          </div>
          <span className="font-bold text-blue-400">Scuro (Android)</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Sliders size={16} className="text-amber-400" />
            <span>Unità di distanza e valuta</span>
          </div>
          <span className="font-bold text-white">Chilometro (km) • Euro (€)</span>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE OPERATIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1e293b] border border-slate-700 rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {confirmDialog.title}
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0f172a] p-3 rounded-2xl border border-slate-800">
              {confirmDialog.description}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

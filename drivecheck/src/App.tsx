import React, { useState, useEffect, useMemo } from 'react';
import { Veicolo, InterventoRecord, CategoriaManutenzione, AppDataBackup, TipoPagamentoScadenza } from './types';
import {
  loadStoredVeicoli,
  saveStoredVeicoli,
  loadStoredRecord,
  saveStoredRecord,
  loadStoredCatalog,
  saveStoredCatalog,
  getStoredSelectedVehicleId,
  saveStoredSelectedVehicleId,
  formatKm,
  computeBolloPagabileEntro,
} from './services/storageService';
import { DEFAULT_CATALOG } from './data/defaultCatalog';
import { Navigation, TabType } from './components/Navigation';
import { FabSpeedDial } from './components/FabSpeedDial';
import { NewRecordModal } from './components/NewRecordModal';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { VehicleDetailsModal } from './components/VehicleDetailsModal';
import { AddVehicleModal } from './components/AddVehicleModal';
import { UpdateKmModal } from './components/UpdateKmModal';
import { RegistroGommeModal } from './components/RegistroGommeModal';
import { RegistroPagamentiModal } from './components/RegistroPagamentiModal';
import { InstallAppModal } from './components/InstallAppModal';
import { GoogleCalendarSyncModal } from './components/GoogleCalendarSyncModal';
import { SummaryView } from './views/SummaryView';
import { HistoryView } from './views/HistoryView';
import { GarageView } from './views/GarageView';
import { SettingsView } from './views/SettingsView';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Car, ChevronDown, Download, Smartphone, WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();
  const [veicoli, setVeicoli] = useState<Veicolo[]>(() => loadStoredVeicoli());
  const [record, setRecord] = useState<InterventoRecord[]>(() => loadStoredRecord());
  const [catalogo, setCatalogo] = useState<CategoriaManutenzione[]>(() => loadStoredCatalog());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() =>
    getStoredSelectedVehicleId(veicoli)
  );

  const [activeTab, setActiveTab] = useState<TabType>('garage');
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);

  // Modals state
  const [isNewRecordOpen, setIsNewRecordOpen] = useState<boolean>(false);
  const [recordModalMode, setRecordModalMode] = useState<'manutenzione' | 'gomme' | 'altri_interventi'>('manutenzione');
  const [isRegistroGommeOpen, setIsRegistroGommeOpen] = useState<boolean>(false);
  const [isRegistroPagamentiOpen, setIsRegistroPagamentiOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<InterventoRecord | null>(null);
  const [editingGommeRecord, setEditingGommeRecord] = useState<InterventoRecord | null>(null);
  const [editingPagamentoRecord, setEditingPagamentoRecord] = useState<InterventoRecord | null>(null);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<InterventoRecord | null>(null);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState<boolean>(false);
  const [isVehicleDetailsOpen, setIsVehicleDetailsOpen] = useState<boolean>(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [isUpdateKmOpen, setIsUpdateKmOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState<boolean>(false);

  // Vehicle selector dropdown in top bar
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    saveStoredVeicoli(veicoli);
  }, [veicoli]);

  useEffect(() => {
    saveStoredRecord(record);
  }, [record]);

  useEffect(() => {
    saveStoredCatalog(catalogo);
  }, [catalogo]);

  useEffect(() => {
    if (selectedVehicleId) {
      saveStoredSelectedVehicleId(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  // Resume listener to prevent disconnection after 1 hour or phone standby
  useEffect(() => {
    const handleResume = () => {
      try {
        const freshVeicoli = loadStoredVeicoli();
        if (freshVeicoli.length > 0) {
          setVeicoli(freshVeicoli);
        }
        const freshRecord = loadStoredRecord();
        setRecord(freshRecord);
      } catch (e) {
        console.warn('Resume check:', e);
      }
    };
    window.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      window.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  const currentVehicle = veicoli.find((v) => v.id === selectedVehicleId) || veicoli[0];

  // Elenco cumulativo di tutte le officine, gommisti e specialisti salvati
  const officineSalvate = useMemo(() => {
    const list = new Set<string>();
    veicoli.forEach((v) => {
      if (v.officina) list.add(v.officina.trim());
      if (v.specialisti) {
        v.specialisti.forEach((s) => {
          if (s.nome) list.add(s.nome.trim());
        });
      }
    });
    record.forEach((r) => {
      if (r.officina) list.add(r.officina.trim());
      if (r.registroPagamento?.enteOCompagnia) list.add(r.registroPagamento.enteOCompagnia.trim());
    });
    return Array.from(list).filter(Boolean);
  }, [veicoli, record]);

  // Handler: Save or Update Record
  const handleSaveRecord = (newOrUpdated: InterventoRecord) => {
    setRecord((prev) => {
      const exists = prev.some((r) => r.id === newOrUpdated.id);
      if (exists) {
        return prev.map((r) => (r.id === newOrUpdated.id ? newOrUpdated : r));
      }
      return [newOrUpdated, ...prev];
    });

    // Auto-update car KM if record KM is higher
    if (currentVehicle && newOrUpdated.km > currentVehicle.kmAttuali) {
      handleUpdateVehicleKm(newOrUpdated.km);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecord((prev) => prev.filter((r) => r.id !== recordId));
  };

  const handleUpdateVehicleKm = (nuoviKm: number) => {
    if (!currentVehicle) return;
    setVeicoli((prev) =>
      prev.map((v) => (v.id === currentVehicle.id ? { ...v, kmAttuali: nuoviKm } : v))
    );
  };

  const handleSaveVehicle = (updatedVehicle: Veicolo) => {
    setVeicoli((prev) =>
      prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
    );
  };

  const handleAddVehicle = (newVehicle: Veicolo) => {
    setVeicoli((prev) => [...prev, newVehicle]);
    setSelectedVehicleId(newVehicle.id);
  };

  const handleDeleteVehicle = (veicoloId: string) => {
    setVeicoli((prev) => prev.filter((v) => v.id !== veicoloId));
    setRecord((prev) => prev.filter((r) => r.veicoloId !== veicoloId));
    if (selectedVehicleId === veicoloId) {
      const remaining = veicoli.filter((v) => v.id !== veicoloId);
      if (remaining.length > 0) {
        setSelectedVehicleId(remaining[0].id);
      }
    }
  };

  const handleRestoreAllData = (backup: AppDataBackup) => {
    if (backup.veicoli && Array.isArray(backup.veicoli)) {
      setVeicoli(backup.veicoli);
      if (backup.veicoli.length > 0) {
        setSelectedVehicleId(backup.veicoloSelezionatoId || backup.veicoli[0].id);
      }
    }
    if (backup.record && Array.isArray(backup.record)) {
      setRecord(backup.record);
    }
    if (backup.catalogoPersonalizzato && Array.isArray(backup.catalogoPersonalizzato)) {
      setCatalogo(backup.catalogoPersonalizzato);
    }
  };

  const handleResetCatalog = () => {
    setCatalogo(DEFAULT_CATALOG);
  };

  const handleUpdateVehicleDeadline = (
    veicoloId: string,
    tipo: TipoPagamentoScadenza,
    nuovaScadenza: string,
    importo?: number,
    compagnia?: string
  ) => {
    setVeicoli((prev) =>
      prev.map((v) => {
        if (v.id !== veicoloId) return v;
        if (tipo === 'Bollo') {
          return {
            ...v,
            scadenzaBollo: nuovaScadenza,
            pagabileEntroBollo: computeBolloPagabileEntro(nuovaScadenza),
            importoBollo: importo !== undefined && importo > 0 ? importo : v.importoBollo,
          };
        } else if (tipo === 'Revisione') {
          return { ...v, scadenzaRevisione: nuovaScadenza };
        } else if (tipo === 'Assicurazione') {
          return {
            ...v,
            scadenzaAssicurazione: nuovaScadenza,
            importoAssicurazione:
              importo !== undefined && importo > 0 ? importo : v.importoAssicurazione,
            compagniaAssicurazione: compagnia || v.compagniaAssicurazione,
          };
        }
        return v;
      })
    );
  };

  const handleFabAction = (
    action: 'manutenzione' | 'registro_gomme' | 'altri_interventi' | 'registro_pagamenti'
  ) => {
    if (action === 'manutenzione') {
      setRecordModalMode('manutenzione');
      setEditingRecord(null);
      setIsNewRecordOpen(true);
    } else if (action === 'registro_gomme') {
      setRecordModalMode('gomme');
      setEditingRecord(null);
      setIsNewRecordOpen(true);
    } else if (action === 'altri_interventi') {
      setRecordModalMode('altri_interventi');
      setEditingRecord(null);
      setIsNewRecordOpen(true);
    } else if (action === 'registro_pagamenti') {
      setIsRegistroPagamentiOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-100 flex justify-center font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Android Container Viewport */}
      <div className="w-full max-w-md md:max-w-xl min-h-screen bg-[#0d1420] border-x border-slate-900/60 flex flex-col relative shadow-2xl mx-auto">
        
        {/* Top Status Bar with DriveCheck Branding */}
        <header className="sticky top-0 z-40 bg-[#0d1420]/95 backdrop-blur-md px-4 py-3 border-b border-slate-800/80 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-950/60 p-1">
              <img src="/icon.svg" alt="DriveCheck" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-green-300 to-teal-300 bg-clip-text text-transparent block leading-tight">
                DriveCheck
              </span>
              <span className="text-[9px] text-emerald-400/80 font-mono block">Gestione Parco & Scadenze</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
              title="Scarica / Installa app su Android"
            >
              <Download size={13} />
              <span>Scarica App</span>
            </button>
          </div>
        </header>

        {/* Offline Banner Indicator */}
        {!isOnline && (
          <div className="bg-amber-600/95 text-white px-3.5 py-2 text-xs flex items-center gap-2.5 border-b border-amber-500 shadow-md">
            <WifiOff size={16} className="shrink-0 text-amber-200 animate-pulse" />
            <div className="flex-1 text-[11px] leading-tight">
              <strong className="block text-white">Modalità Offline attiva</strong>
              I dati che inserisci vengono salvati localmente sul dispositivo e saranno sincronizzabili sul cloud non appena riavrai connessione.
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-3 sm:px-4 pt-3 pb-28">
          {activeTab === 'riepilogo' && (
            <SummaryView
              veicolo={currentVehicle}
              veicoli={veicoli}
              record={record}
              catalogo={catalogo}
              onOpenNewRecord={() => {
                setRecordModalMode('manutenzione');
                setEditingRecord(null);
                setIsNewRecordOpen(true);
              }}
              onOpenRegistroGomme={() => {
                setRecordModalMode('gomme');
                setEditingRecord(null);
                setIsNewRecordOpen(true);
              }}
              onOpenAltriInterventi={() => {
                setRecordModalMode('altri_interventi');
                setEditingRecord(null);
                setIsNewRecordOpen(true);
              }}
              onOpenRegistroPagamenti={() => setIsRegistroPagamentiOpen(true)}
              onOpenUpdateKm={() => setIsUpdateKmOpen(true)}
              onOpenVehicleDetails={() => setIsVehicleDetailsOpen(true)}
              onSwitchTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'cronologia' && (
            <HistoryView
              veicolo={currentVehicle}
              record={record}
              onSelectRecord={(rec) => {
                setSelectedRecordForDetails(rec);
                setIsRecordDetailsOpen(true);
              }}
              onOpenNewRecord={(mode) => {
                setEditingRecord(null);
                setRecordModalMode(mode || 'manutenzione');
                setIsNewRecordOpen(true);
              }}
              onOpenRegistroPagamenti={(tipo) => {
                setEditingPagamentoRecord(null);
                setIsRegistroPagamentiOpen(true);
              }}
              onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
            />
          )}

          {activeTab === 'garage' && (
            <GarageView
              veicoli={veicoli}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={(id) => setSelectedVehicleId(id)}
              onOpenVehicleDetails={() => setIsVehicleDetailsOpen(true)}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onOpenUpdateKm={() => setIsUpdateKmOpen(true)}
            />
          )}

          {activeTab === 'imposta' && (
            <SettingsView
              veicoli={veicoli}
              record={record}
              catalogo={catalogo}
              selectedVehicleId={selectedVehicleId}
              onRestoreAllData={handleRestoreAllData}
              onResetCatalog={handleResetCatalog}
              onUpdateCatalogo={(nuovo) => setCatalogo(nuovo)}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          )}
        </main>

        {/* Speed Dial Overlay */}
        <FabSpeedDial
          isOpen={isFabOpen}
          onClose={() => setIsFabOpen(false)}
          onSelectAction={handleFabAction}
        />

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsFabOpen(false);
          }}
          onOpenFab={() => setIsFabOpen(!isFabOpen)}
          isFabOpen={isFabOpen}
        />

        {/* New / Edit Record Modal */}
        {currentVehicle && (
          <NewRecordModal
            isOpen={isNewRecordOpen}
            onClose={() => {
              setIsNewRecordOpen(false);
              setEditingRecord(null);
            }}
            veicolo={currentVehicle}
            catalogo={catalogo}
            onUpdateCatalogo={(nuovo) => setCatalogo(nuovo)}
            onSaveRecord={handleSaveRecord}
            editingRecord={editingRecord}
            initialMode={recordModalMode}
            officineSalvate={officineSalvate}
          />
        )}

        {/* Registro Gomme Modal */}
        {currentVehicle && (
          <RegistroGommeModal
            isOpen={isRegistroGommeOpen}
            onClose={() => {
              setIsRegistroGommeOpen(false);
              setEditingGommeRecord(null);
            }}
            veicolo={currentVehicle}
            onSaveRecord={handleSaveRecord}
            editingRecord={editingGommeRecord}
            officineSalvate={officineSalvate}
          />
        )}

        {/* Registro Pagamenti (Revisione, Bollo, Assicurazione) Modal */}
        {currentVehicle && (
          <RegistroPagamentiModal
            isOpen={isRegistroPagamentiOpen}
            onClose={() => {
              setIsRegistroPagamentiOpen(false);
              setEditingPagamentoRecord(null);
            }}
            veicolo={currentVehicle}
            onSaveRecord={handleSaveRecord}
            onUpdateVehicleDeadline={handleUpdateVehicleDeadline}
            editingRecord={editingPagamentoRecord}
            officineSalvate={officineSalvate}
          />
        )}

        {/* Record Details Modal */}
        <RecordDetailsModal
          isOpen={isRecordDetailsOpen}
          onClose={() => {
            setIsRecordDetailsOpen(false);
            setSelectedRecordForDetails(null);
          }}
          record={selectedRecordForDetails}
          veicolo={currentVehicle}
          onEdit={(rec) => {
            setIsRecordDetailsOpen(false);
            if (rec.tipo === 'Gomme' || !!rec.registroGomme) {
              setEditingGommeRecord(rec);
              setIsRegistroGommeOpen(true);
            } else if (rec.tipo === 'Pagamento Scadenza' || !!rec.registroPagamento) {
              setEditingPagamentoRecord(rec);
              setIsRegistroPagamentiOpen(true);
            } else {
              setEditingRecord(rec);
              setIsNewRecordOpen(true);
            }
          }}
          onDelete={handleDeleteRecord}
        />

        {/* Vehicle Details Modal (Scheda Tecnica) */}
        {currentVehicle && (
          <VehicleDetailsModal
            isOpen={isVehicleDetailsOpen}
            onClose={() => setIsVehicleDetailsOpen(false)}
            veicolo={currentVehicle}
            onSaveVehicle={handleSaveVehicle}
            onDeleteVehicle={veicoli.length > 1 ? handleDeleteVehicle : undefined}
          />
        )}

        {/* Add Vehicle Modal */}
        <AddVehicleModal
          isOpen={isAddVehicleOpen}
          onClose={() => setIsAddVehicleOpen(false)}
          onAddVehicle={handleAddVehicle}
        />

        {/* Update KM Modal */}
        {currentVehicle && (
          <UpdateKmModal
            isOpen={isUpdateKmOpen}
            onClose={() => setIsUpdateKmOpen(false)}
            veicolo={currentVehicle}
            onUpdateKm={handleUpdateVehicleKm}
          />
        )}

        {/* Install PWA Modal */}
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />

        {/* Google Calendar Sync Modal */}
        <GoogleCalendarSyncModal
          isOpen={isGoogleSyncModalOpen}
          onClose={() => setIsGoogleSyncModalOpen(false)}
          veicolo={currentVehicle}
        />

      </div>
    </div>
  );
}

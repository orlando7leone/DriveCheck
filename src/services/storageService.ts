import { Veicolo, InterventoRecord, CategoriaManutenzione, AppDataBackup } from '../types';
import { INITIAL_VEHICLES, INITIAL_RECORDS } from '../data/sampleData';
import { DEFAULT_CATALOG } from '../data/defaultCatalog';

const STORAGE_KEYS = {
  VEICOLI: 'drivecheck_veicoli',
  RECORD: 'drivecheck_record',
  CATALOGO: 'drivecheck_catalogo',
  SELECTED_VEHICLE: 'drivecheck_selected_vehicle_id',
  SETTINGS: 'drivecheck_settings',
  // Backwards compatibility legacy keys
  LEGACY_VEICOLI: 'cartracker_veicoli',
  LEGACY_RECORD: 'cartracker_record',
  LEGACY_CATALOGO: 'cartracker_catalogo',
  LEGACY_SELECTED: 'cartracker_selected_vehicle_id',
};

export const loadStoredVeicoli = (): Veicolo[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEICOLI) || localStorage.getItem(STORAGE_KEYS.LEGACY_VEICOLI);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VEICOLI, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Errore caricamento veicoli da localStorage', e);
    return INITIAL_VEHICLES;
  }
};

export const saveStoredVeicoli = (veicoli: Veicolo[]) => {
  localStorage.setItem(STORAGE_KEYS.VEICOLI, JSON.stringify(veicoli));
};

export const loadStoredRecord = (): InterventoRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORD) || localStorage.getItem(STORAGE_KEYS.LEGACY_RECORD);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RECORD, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Errore caricamento record da localStorage', e);
    return INITIAL_RECORDS;
  }
};

export const saveStoredRecord = (record: InterventoRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.RECORD, JSON.stringify(record));
};

export const loadStoredCatalog = (): CategoriaManutenzione[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOGO) || localStorage.getItem(STORAGE_KEYS.LEGACY_CATALOGO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATALOGO, JSON.stringify(DEFAULT_CATALOG));
      return DEFAULT_CATALOG;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Errore caricamento catalogo', e);
    return DEFAULT_CATALOG;
  }
};

export const saveStoredCatalog = (catalog: CategoriaManutenzione[]) => {
  localStorage.setItem(STORAGE_KEYS.CATALOGO, JSON.stringify(catalog));
};

export const getStoredSelectedVehicleId = (veicoli: Veicolo[]): string => {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_VEHICLE) || localStorage.getItem(STORAGE_KEYS.LEGACY_SELECTED);
  if (stored && veicoli.some(v => v.id === stored)) {
    return stored;
  }
  return veicoli[0]?.id || '';
};

export const saveStoredSelectedVehicleId = (id: string) => {
  localStorage.setItem(STORAGE_KEYS.SELECTED_VEHICLE, id);
};

export const exportFullBackupJson = (
  veicoli: Veicolo[],
  record: InterventoRecord[],
  catalogo: CategoriaManutenzione[],
  selectedVehicleId?: string
): string => {
  const backup: AppDataBackup = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    veicoli,
    record,
    catalogoPersonalizzato: catalogo,
    veicoloSelezionatoId: selectedVehicleId,
  };
  return JSON.stringify(backup, null, 2);
};

export const downloadJsonBackupFile = (jsonString: string) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cartracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportRecordsToCsv = (veicolo: Veicolo | undefined, record: InterventoRecord[]): string => {
  const header = ['ID', 'Data', 'KM', 'Tipo', 'Titolo', 'Costo (€)', 'Officina', 'Lavorazioni', 'Note'].join(';');
  const rows = record.map(r => {
    const lavs = r.lavorazioniSelezionate.map(l => l.nome).join(' | ');
    const note = (r.note || '').replace(/"/g, '""');
    return [
      r.id,
      r.data,
      r.km,
      r.tipo,
      `"${r.titolo.replace(/"/g, '""')}"`,
      r.costo.toFixed(2),
      `"${(r.officina || '').replace(/"/g, '""')}"`,
      `"${lavs}"`,
      `"${note}"`,
    ].join(';');
  });
  return [header, ...rows].join('\r\n');
};

export const downloadCsvFile = (csvContent: string, filename: string) => {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
};

export const formatKm = (km: number): string => {
  return new Intl.NumberFormat('it-IT').format(km) + ' km';
};

export const formatDateIt = (dateStr?: string): string => {
  if (!dateStr) return '--/--/----';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const getDaysUntil = (dateStr: string): number => {
  if (!dateStr) return 999;
  const target = new Date(dateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateDeadlineMessage = (
  veicolo: Veicolo,
  scadenzaTipo: 'Bollo' | 'Revisione' | 'Assicurazione' | 'Scadenze',
  dataScadenza: string,
  importo?: number
): string => {
  const nome = veicolo.proprietario ? `Gentile ${veicolo.proprietario}` : 'Gentile cliente';
  const importoStr = importo && importo > 0 ? ` per un importo stimato di ${formatCurrency(importo)}` : '';
  const ggRimasti = getDaysUntil(dataScadenza);
  const tempoMsg = ggRimasti > 0 ? `(tra ${ggRimasti} giorni)` : '(SCADUTO)';

  return (
    `🔔 *PROMEMORIA SCADENZA VEICOLO - CarTracker Pro*\n\n` +
    `${nome},\n` +
    `ti ricordiamo che la scadenza *${scadenzaTipo.toUpperCase()}* per la tua vettura:\n` +
    `🚗 *${veicolo.marca} ${veicolo.modello}* (Targa: *${veicolo.targa}*)\n` +
    `è fissata per il: *${formatDateIt(dataScadenza)}* ${tempoMsg}${importoStr}.\n\n` +
    `Ti invitiamo a provvedere al rinnovo entro i termini di legge per evitare sanzioni.`
  );
};

export const createGoogleCalendarUrl = (options: {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  recurrence?: string; // e.g. 'RRULE:FREQ=YEARLY'
}): string => {
  const cleanStart = options.startDate.replace(/-/g, '');
  let endFormatted = cleanStart;
  try {
    const d = new Date(options.startDate);
    d.setDate(d.getDate() + 1);
    endFormatted = d.toISOString().slice(0, 10).replace(/-/g, '');
  } catch {}

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: options.title,
    dates: `${cleanStart}/${endFormatted}`,
    details: options.description,
    location: 'Calendario Manutenzione Auto',
  });

  if (options.recurrence) {
    params.set('recur', options.recurrence);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const openGoogleCalendarEvent = (options: {
  title: string;
  description: string;
  startDate: string;
  recurrence?: string;
}) => {
  if (!options.startDate) return;
  const url = createGoogleCalendarUrl(options);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadIcsFile = (options: {
  title: string;
  description: string;
  startDate: string;
  rrule?: string;
}) => {
  const cleanDate = options.startDate.replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DriveCheck//Manutenzione Auto//IT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Manutenzione Auto',
    'X-WR-CALDESC:Scadenze veicoli e manutenzioni DriveCheck',
    'BEGIN:VEVENT',
    `SUMMARY:${options.title}`,
    `DESCRIPTION:${options.description}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    options.rrule ? `RRULE:${options.rrule}` : '',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P30D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria Scadenza (30 giorni prima)',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria Scadenza Imminente (7 giorni prima)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `manutenzione_auto_${cleanDate}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export interface FutureDeadlineItem {
  ciclo: number;
  dataScadenza: string;
  pagabileEntro?: string;
  etichetta: string;
}

// Calcola la catena di scadenze future consecutive
export const computeFutureDeadlinesSeries = (
  baseDate: string,
  tipo: 'Bollo' | 'Revisione' | 'Assicurazione',
  frequenza: string = 'Annuale',
  count: number = 4
): FutureDeadlineItem[] => {
  if (!baseDate) return [];
  const results: FutureDeadlineItem[] = [];
  let currentDate = baseDate;

  for (let i = 1; i <= count; i++) {
    const nextDate = computeNextDeadlineDate(currentDate, frequenza);
    if (!nextDate) break;

    let pagEntro: string | undefined;
    if (tipo === 'Bollo') {
      pagEntro = computeBolloPagabileEntro(nextDate);
    }

    let etichetta = `Scadenza ${i}° ciclo futuro`;
    if (tipo === 'Bollo') {
      etichetta = `Bollo ${nextDate.slice(0, 4)}`;
    } else if (tipo === 'Revisione') {
      etichetta = `Revisione ${nextDate.slice(0, 4)}`;
    } else if (tipo === 'Assicurazione') {
      etichetta = `Rata ${frequenza} (${formatDateIt(nextDate)})`;
    }

    results.push({
      ciclo: i,
      dataScadenza: nextDate,
      pagabileEntro: pagEntro,
      etichetta,
    });

    currentDate = nextDate;
  }

  return results;
};

// Genera e scarica il file completo .ics per creare/popolare il calendario "Manutenzione Auto" su Google Calendar
export const downloadFleetCalendarIcs = (veicoli: Veicolo[], includeFutureCycles: boolean = true) => {
  const events: string[] = [];

  veicoli.forEach((v) => {
    // 1. Bollo
    if (v.scadenzaBollo) {
      const cleanBollo = v.scadenzaBollo.replace(/-/g, '');
      const pagEntro = v.pagabileEntroBollo || computeBolloPagabileEntro(v.scadenzaBollo);
      events.push(
        'BEGIN:VEVENT',
        `UID:bollo-${v.id}-${cleanBollo}@drivecheck.app`,
        `SUMMARY:🚗 [${v.targa}] Scadenza Bollo Auto (${v.marca} ${v.modello})`,
        `DESCRIPTION:Veicolo: ${v.marca} ${v.modello} (${v.targa})\\nProprietario: ${v.proprietario || 'N/D'}\\nScadenza Bollo: ${formatDateIt(v.scadenzaBollo)}\\n${pagEntro ? 'Pagabile entro: ' + pagEntro + '\\n' : ''}Importo: ${v.importoBollo ? v.importoBollo + ' €' : 'N/D'}`,
        `DTSTART;VALUE=DATE:${cleanBollo}`,
        `DTEND;VALUE=DATE:${cleanBollo}`,
        'RRULE:FREQ=YEARLY',
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Bollo (30 giorni prima)',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Bollo (7 giorni prima)',
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // 2. Revisione
    if (v.scadenzaRevisione) {
      const cleanRev = v.scadenzaRevisione.replace(/-/g, '');
      events.push(
        'BEGIN:VEVENT',
        `UID:revisione-${v.id}-${cleanRev}@drivecheck.app`,
        `SUMMARY:🔧 [${v.targa}] Scadenza Revisione MCTC (${v.marca} ${v.modello})`,
        `DESCRIPTION:Veicolo: ${v.marca} ${v.modello} (${v.targa})\\nProprietario: ${v.proprietario || 'N/D'}\\nScadenza Revisione: ${formatDateIt(v.scadenzaRevisione)}\\nFrequenza: ${v.frequenzaRevisione || 'Biennale'}\\nOfficina/Centro: ${v.officina || 'N/D'}`,
        `DTSTART;VALUE=DATE:${cleanRev}`,
        `DTEND;VALUE=DATE:${cleanRev}`,
        'RRULE:FREQ=YEARLY;INTERVAL=2',
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Revisione (30 giorni prima)',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Revisione (7 giorni prima)',
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // 3. Assicurazione
    if (v.scadenzaAssicurazione) {
      const cleanAssic = v.scadenzaAssicurazione.replace(/-/g, '');
      const isSemestrale = (v.frequenzaAssicurazione || '').toLowerCase().includes('semestral');
      const rrule = isSemestrale ? 'RRULE:FREQ=MONTHLY;INTERVAL=6' : 'RRULE:FREQ=YEARLY';
      events.push(
        'BEGIN:VEVENT',
        `UID:assicurazione-${v.id}-${cleanAssic}@drivecheck.app`,
        `SUMMARY:🛡️ [${v.targa}] Scadenza Assicurazione (${v.marca} ${v.modello})`,
        `DESCRIPTION:Veicolo: ${v.marca} ${v.modello} (${v.targa})\\nCompagnia: ${v.compagniaAssicurazione || 'N/D'}\\nFrequenza: ${v.frequenzaAssicurazione || 'Semestrale'}\\nImporto rata: ${v.importoAssicurazione ? v.importoAssicurazione + ' €' : 'N/D'}`,
        `DTSTART;VALUE=DATE:${cleanAssic}`,
        `DTEND;VALUE=DATE:${cleanAssic}`,
        rrule,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Assicurazione (30 giorni prima)',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Scadenza Assicurazione (7 giorni prima)',
        'END:VALARM',
        'END:VEVENT'
      );
    }
  });

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DriveCheck//Scadenze Auto//IT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Scadenze Auto',
    'X-WR-CALDESC:Scadenze Auto - Bollo, Revisione e Assicurazione',
    'X-WR-TIMEZONE:Europe/Rome',
    ...events,
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scadenze_auto_${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportCatalogJson = (catalog: CategoriaManutenzione[]): string => {
  return JSON.stringify(catalog, null, 2);
};

export const downloadCatalogJsonFile = (jsonString: string) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `drivecheck_catalogo_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Calcolo automatico prossima scadenza in base a frequenza
export const computeNextDeadlineDate = (
  baseDate: string,
  frequenza: string = 'Annuale'
): string => {
  if (!baseDate) return '';
  let isoDate = baseDate;
  if (baseDate.includes('/')) {
    const parts = baseDate.split('/');
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';

  const freqLower = frequenza.toLowerCase();

  if (freqLower.includes('semestral') || freqLower.includes('6')) {
    d.setMonth(d.getMonth() + 6);
  } else if (freqLower.includes('trimestral') || freqLower.includes('3')) {
    d.setMonth(d.getMonth() + 3);
  } else if (freqLower.includes('mensil') || freqLower.includes('1 mese')) {
    d.setMonth(d.getMonth() + 1);
  } else if (freqLower.includes('normale') || freqLower.includes('2 anni') || freqLower.includes('biennal')) {
    d.setFullYear(d.getFullYear() + 2);
  } else if (freqLower.includes('nuova') || freqLower.includes('4 anni')) {
    d.setFullYear(d.getFullYear() + 4);
  } else {
    // Default 1 anno
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().slice(0, 10);
};

// Calcolo "Pagabile entro" per il Bollo (legge il mese della scadenza ed inserisce il mese successivo, es. 30/04/2026 -> Tutto Maggio 2026)
export const computeBolloPagabileEntro = (scadenzaStr: string): string => {
  if (!scadenzaStr || typeof scadenzaStr !== 'string') return '';
  const trimmed = scadenzaStr.trim();
  if (!trimmed) return '';

  let year = new Date().getFullYear();
  let month = -1;

  // Normalizza trattini e punti in slash
  const clean = trimmed.replace(/-/g, '/').replace(/\./g, '/');
  const parts = clean.split('/').map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));

  if (parts.length === 3) {
    if (parts[0] > 1000) {
      // Formato YYYY/MM/DD (es. 2026/04/30)
      year = parts[0];
      month = parts[1] - 1;
    } else {
      // Formato DD/MM/YYYY (es. 30/04/2026)
      month = parts[1] - 1;
      year = parts[2];
    }
  } else if (parts.length === 2) {
    if (parts[1] > 1000) {
      // MM/YYYY (es. 04/2026)
      month = parts[0] - 1;
      year = parts[1];
    } else if (parts[0] > 1000) {
      // YYYY/MM (es. 2026/04)
      year = parts[0];
      month = parts[1] - 1;
    }
  }

  // Fallback con Date parser
  if (month < 0 || month > 11) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      month = d.getMonth();
      year = d.getFullYear();
    } else {
      return '';
    }
  }

  // Calcola il mese successivo per il pagamento
  let nextMonthIndex = month + 1;
  let nextYear = year;
  if (nextMonthIndex > 11) {
    nextMonthIndex = 0;
    nextYear += 1;
  }

  const mesiItaliani = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  return `Tutto ${mesiItaliani[nextMonthIndex]} ${nextYear}`;
};

// Genera e scarica il calendario dedicato "Revisioni Auto" (.ics) per Google Calendar con ricorrenza ogni 2 anni
export const downloadRevisioniCalendarIcs = (veicoli: Veicolo[]) => {
  const events: string[] = [];

  veicoli.forEach((v) => {
    if (v.scadenzaRevisione) {
      let dataIso = v.scadenzaRevisione.trim();
      if (dataIso.includes('/')) {
        const parts = dataIso.split('/');
        if (parts.length === 3) {
          dataIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      const cleanStart = dataIso.replace(/-/g, '');

      events.push(
        'BEGIN:VEVENT',
        `UID:rev-${v.id}-${cleanStart}@drivecheck.app`,
        `SUMMARY:🔧 [${v.targa}] Revisione Auto MCTC (${v.marca} ${v.modello})`,
        `DESCRIPTION:Revisione Ministeriale MCTC obbligatoria per:\\nVeicolo: ${v.marca} ${v.modello} (${v.targa})\\nProprietario: ${v.proprietario || 'N/D'}\\nScadenza: ${formatDateIt(dataIso)}\\nCentro Revisioni: ${v.officina || 'Centro MCTC Autorizzato'}\\nRicorrenza: Ogni 2 anni (Biennale)`,
        `DTSTART;VALUE=DATE:${cleanStart}`,
        `DTEND;VALUE=DATE:${cleanStart}`,
        'RRULE:FREQ=YEARLY;INTERVAL=2',
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Revisione Auto: mancano 30 giorni',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria Revisione Auto: mancano 7 giorni',
        'END:VALARM',
        'END:VEVENT'
      );
    }
  });

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DriveCheck//Revisioni Auto//IT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Revisioni Auto',
    'X-WR-CALDESC:Calendario Revisioni Ministeriali MCTC dei Veicoli',
    'X-WR-TIMEZONE:Europe/Rome',
    ...events,
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendario_revisioni_auto_${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openWhatsAppReminder = (
  cellulare: string,
  messaggio: string
) => {
  const cleanPhone = cellulare.replace(/[^0-9]/g, '');
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messaggio)}`;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const openSmsReminder = (
  cellulare: string,
  messaggio: string
) => {
  const cleanPhone = cellulare.replace(/[^0-9]/g, '');
  const url = `sms:${cleanPhone}?body=${encodeURIComponent(messaggio)}`;
  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

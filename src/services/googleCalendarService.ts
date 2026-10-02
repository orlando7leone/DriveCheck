import {
  auth,
  getAccessToken,
  googleSignIn,
  getCurrentUser,
  logout as logoutGoogle,
} from './firebaseAuth';
import { Veicolo } from '../types';
import { computeBolloPagabileEntro, formatDateIt, formatCurrency } from './storageService';

export { auth, getAccessToken, googleSignIn, getCurrentUser, logoutGoogle };

// Funzione per trovare o creare il calendario secondario dedicato "Scadenze Auto"
export const getOrCreateScadenzeAutoCalendar = async (
  token: string
): Promise<{ id: string; name: string; isNew: boolean }> => {
  // 1. Cerca nella lista calendari dell'utente
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    // Se 401 o 403, rilanciamo con messaggio specifico per forzare nuova autorizzazione
    if (listRes.status === 401 || listRes.status === 403) {
      throw new Error(`Permessi Google Calendar mancanti o scaduti (${listRes.status}). Riconnetti l'account Google consentendo l'accesso a Google Calendar.`);
    }
    throw new Error(`Impossibile leggere i calendari Google: ${listRes.status} ${errText}`);
  }

  const listData = await listRes.json();
  const existingCal = (listData.items || []).find(
    (c: any) => c.summary && c.summary.toLowerCase().trim() === 'scadenze auto'
  );

  if (existingCal) {
    // Assicura che sia visibile e selezionato nella barra laterale di Google Calendar
    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(existingCal.id)}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selected: true }),
        }
      );
    } catch (e) {
      console.warn('Avviso aggiornamento selezione calendario:', e);
    }

    return { id: existingCal.id, name: existingCal.summary, isNew: false };
  }

  // 2. Se non esiste, crea il nuovo calendario secondario "Scadenze Auto"
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: 'Scadenze Auto',
      description: 'Calendario automatico DriveCheck: scadenze Bollo, Revisione ed Assicurazione auto',
      timeZone: 'Europe/Rome',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Impossibile creare il calendario "Scadenze Auto": ${createRes.status} ${errText}`);
  }

  const newCalData = await createRes.json();

  // 3. Aggiunge esplicitamente il nuovo calendario nella lista dell'utente affinché compaia subito in https://calendar.google.com
  try {
    await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: newCalData.id,
        selected: true,
      }),
    });
  } catch (e) {
    console.warn('Avviso aggiunta calendarList:', e);
  }

  return { id: newCalData.id, name: newCalData.summary || 'Scadenze Auto', isNew: true };
};

// Calcola la data finale (esclusiva) per l'evento all-day di Google Calendar
const getNextDayIso = (isoDate: string): string => {
  try {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  } catch {
    return isoDate;
  }
};

export interface SyncResult {
  calendarName: string;
  eventsAdded: number;
  eventsUpdated: number;
  eventsSkipped: string[];
  vehiclePlate: string;
}

// Sincronizza tutte le scadenze del veicolo sul calendario Google "Scadenze Auto"
export const syncVehicleDeadlinesToGoogleCalendar = async (
  token: string,
  veicolo: Veicolo
): Promise<SyncResult> => {
  const { id: calendarId, name: calendarName } = await getOrCreateScadenzeAutoCalendar(token);

  // Leggi eventi già presenti nel calendario per evitare duplicati
  const eventsRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=250`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const existingEvents = eventsRes.ok ? (await eventsRes.json()).items || [] : [];

  let added = 0;
  let updated = 0;
  const skipped: string[] = [];

  // Scadenze da sincronizzare
  const deadLinesToSync: Array<{
    tipoKey: string;
    summary: string;
    description: string;
    startDate: string;
    rrule?: string;
  }> = [];

  // 1. Bollo Auto
  if (veicolo.scadenzaBollo && veicolo.scadenzaBollo.trim() !== '') {
    const pagEntro = computeBolloPagabileEntro(veicolo.scadenzaBollo);
    const impStr = veicolo.importoBollo ? formatCurrency(veicolo.importoBollo) : 'N/D';
    deadLinesToSync.push({
      tipoKey: 'Bollo',
      summary: `🚗 [${veicolo.targa}] Scadenza Bollo: ${veicolo.marca} ${veicolo.modello}`,
      description: `Veicolo: ${veicolo.marca} ${veicolo.modello} (${veicolo.targa})\nData Scadenza: ${formatDateIt(
        veicolo.scadenzaBollo
      )}\nPagabile entro: ${pagEntro}\nImporto previsto: ${impStr}\n\nGestito automaticamente da DriveCheck`,
      startDate: veicolo.scadenzaBollo,
      rrule: 'RRULE:FREQ=YEARLY',
    });
  } else {
    skipped.push('Bollo Auto (data di scadenza non impostata)');
  }

  // 2. Revisione
  if (veicolo.scadenzaRevisione && veicolo.scadenzaRevisione.trim() !== '') {
    const freq = veicolo.frequenzaRevisione || 'Auto Biennale';
    deadLinesToSync.push({
      tipoKey: 'Revisione',
      summary: `🔧 [${veicolo.targa}] Scadenza Revisione: ${veicolo.marca} ${veicolo.modello}`,
      description: `Veicolo: ${veicolo.marca} ${veicolo.modello} (${veicolo.targa})\nData Scadenza: ${formatDateIt(
        veicolo.scadenzaRevisione
      )}\nFrequenza: ${freq}\nTariffa indicativa: 79,02 €\n\nGestito automaticamente da DriveCheck`,
      startDate: veicolo.scadenzaRevisione,
      rrule: 'RRULE:FREQ=YEARLY;INTERVAL=2',
    });
  } else {
    skipped.push('Revisione (data di scadenza non impostata)');
  }

  // 3. Assicurazione
  if (veicolo.scadenzaAssicurazione && veicolo.scadenzaAssicurazione.trim() !== '') {
    const comp = veicolo.compagniaAssicurazione || 'Compagnia N/D';
    const isSemestrale = (veicolo.frequenzaAssicurazione || '').toLowerCase().includes('semestral');
    const rrule = isSemestrale ? 'RRULE:FREQ=MONTHLY;INTERVAL=6' : 'RRULE:FREQ=YEARLY';
    const impStr = veicolo.importoAssicurazione ? formatCurrency(veicolo.importoAssicurazione) : 'N/D';
    deadLinesToSync.push({
      tipoKey: 'Assicurazione',
      summary: `🛡️ [${veicolo.targa}] Scadenza Assicurazione: ${veicolo.marca} ${veicolo.modello}`,
      description: `Veicolo: ${veicolo.marca} ${veicolo.modello} (${veicolo.targa})\nCompagnia: ${comp}\nData Scadenza: ${formatDateIt(
        veicolo.scadenzaAssicurazione
      )}\nImporto rata: ${impStr}\n\nGestito automaticamente da DriveCheck`,
      startDate: veicolo.scadenzaAssicurazione,
      rrule,
    });
  } else {
    skipped.push('Assicurazione RCA (data di scadenza non impostata)');
  }

  if (deadLinesToSync.length === 0) {
    throw new Error(
      `Nessuna data di scadenza impostata per ${veicolo.marca} ${veicolo.modello} (${veicolo.targa}). Compila la data di Bollo, Revisione o Assicurazione prima di sincronizzare!`
    );
  }

  // Invia gli eventi
  for (const item of deadLinesToSync) {
    const existing = existingEvents.find(
      (ev: any) =>
        ev.summary && ev.summary.includes(`[${veicolo.targa}]`) && ev.summary.includes(item.tipoKey)
    );

    const eventPayload: any = {
      summary: item.summary,
      description: item.description,
      start: { date: item.startDate },
      end: { date: getNextDayIso(item.startDate) },
      recurrence: item.rrule ? [item.rrule] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 43200 }, // 30 giorni prima
          { method: 'popup', minutes: 10080 }, // 7 giorni prima
          { method: 'popup', minutes: 1440 },  // 1 giorno prima
        ],
      },
    };

    if (existing) {
      // Aggiorna evento esistente
      const putRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existing.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      );
      if (putRes.ok) updated++;
    } else {
      // Crea nuovo evento
      const postRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      );
      if (postRes.ok) added++;
    }
  }

  return {
    calendarName,
    eventsAdded: added,
    eventsUpdated: updated,
    eventsSkipped: skipped,
    vehiclePlate: veicolo.targa,
  };
};

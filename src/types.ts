export interface SpecialistaOfficina {
  id?: string;
  tipo: 'Meccanico' | 'Gommista' | 'Carrozziere' | 'Elettrauto' | 'Centro Revisioni' | 'Altro';
  nome: string;
  telefono: string;
  referente?: string;
  indirizzo?: string;
  note?: string;
}

export interface Veicolo {
  id: string;
  targa: string;
  // Dati Proprietario
  proprietario: string;
  natoIlA: string;
  residenteIn: string;
  viaCorsoPiazza: string;
  cellulare: string;
  // Dati Veicolo
  marca: string;
  modello: string;
  cilindrata: string;
  alimentazione: 'DIESEL' | 'BENZINA' | 'IBRIDA' | 'ELETTRICA' | 'GPL' | 'METANO';
  annoAcquisto: string;
  importoBollo: number;
  scadenzaBollo: string; // YYYY-MM-DD
  meseScadenzaBollo?: string; // es. "08/2026"
  pagabileEntroBollo?: string; // es. "Tutto Settembre 2026"
  scadenzaRevisione: string; // YYYY-MM-DD
  frequenzaRevisione?: 'Auto (Normale)' | 'Nuova Immatricolazione' | 'Speciale';
  scadenzaAssicurazione?: string; // YYYY-MM-DD
  frequenzaAssicurazione?: 'Annuale' | 'Semestrale' | 'Trimestrale' | 'Mensile';
  importoAssicurazione?: number;
  compagniaAssicurazione?: string;
  notificaMessaggioAttiva?: boolean;
  // Dati Officina
  officina: string;
  rifOfficina: string;
  telefonoOfficina: string;
  specialisti?: SpecialistaOfficina[];
  // Dati Pneumatici
  dimensioniGomme: string;
  pressioneAnteriore: string;
  pressionePosteriore: string;
  // Stato
  kmAttuali: number;
  immagine?: string;
  note?: string;
}

export interface LavorazioneItem {
  id: string;
  nome: string;
  categoriaId: string;
  sottocategoriaId: string;
  iconName?: string;
  coloreIcona?: string;
}

export interface SottocategoriaManutenzione {
  id: string;
  nome: string;
  categoriaId: string;
  lavorazioni: LavorazioneItem[];
}

export interface CategoriaManutenzione {
  id: string;
  nome: string;
  numero: number;
  iconName?: string;
  sottocategorie: SottocategoriaManutenzione[];
}

export interface RegistroGommeData {
  sostituzioneAnteriori: boolean;
  sostituzionePosteriori: boolean;
  inversione: boolean;
  equilibratura: boolean;
  convergenza: boolean;
  marca: string;
  importo: number;
}

export type TipoPagamentoScadenza = 'Revisione' | 'Bollo' | 'Assicurazione';

export interface RegistroPagamentoData {
  tipoPagamento: TipoPagamentoScadenza;
  dataPagamento: string;
  dataScadenza: string;
  importo: number;
  frequenza?: string;
  pagabileEntro?: string;
  enteOCompagnia?: string;
  numeroPolizza?: string;
  note?: string;
  pagato?: boolean;
}

export type TipoRecord = 'Manutenzione' | 'Rifornimento' | 'Riparazione' | 'Gomme' | 'Altri Interventi' | 'Pagamento Scadenza' | 'Altro';

export interface InterventoRecord {
  id: string;
  veicoloId: string;
  tipo: TipoRecord;
  titolo: string;
  data: string; // YYYY-MM-DD
  km: number;
  costo: number;
  officina?: string;
  lavorazioniSelezionate: {
    lavorazioneId: string;
    nome: string;
    categoria: string;
    sottocategoria: string;
  }[];
  registroGomme?: RegistroGommeData;
  registroPagamento?: RegistroPagamentoData;
  descrizione?: string;
  haPromemoria: boolean;
  dataPromemoria?: string;
  kmPromemoria?: number;
  note?: string;
  fotoRicevutaUrl?: string;
  createdAt: string;
}

export interface DriveBackupFileInfo {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
}

export interface AppDataBackup {
  version: string;
  timestamp: string;
  veicoli: Veicolo[];
  record: InterventoRecord[];
  catalogoPersonalizzato: CategoriaManutenzione[];
  veicoloSelezionatoId?: string;
}

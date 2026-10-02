import { getAccessToken } from './firebaseAuth';
import { AppDataBackup, DriveBackupFileInfo } from '../types';

const BACKUP_FILENAME = 'cartracker_pro_backup.json';

export const findDriveBackupFile = async (): Promise<DriveBackupFileInfo | null> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Token Google non disponibile. Effettua prima l\'accesso.');

  const query = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Errore ricerca file Drive: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (result.files && result.files.length > 0) {
    return result.files[0];
  }
  return null;
};

export const saveBackupToGoogleDrive = async (data: AppDataBackup): Promise<{ id: string; modifiedTime: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Token Google non disponibile. Effettua l\'accesso.');

  const existingFile = await findDriveBackupFile();
  const fileContent = JSON.stringify(data, null, 2);

  if (existingFile) {
    // Aggiorna file esistente
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!updateRes.ok) {
      throw new Error(`Errore aggiornamento file su Drive: ${updateRes.status}`);
    }

    const updatedData = await updateRes.json();
    return {
      id: updatedData.id,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Crea nuovo file con multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      description: 'Backup completo CarTracker Pro per parco auto e manutenzioni',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Errore creazione file su Drive: ${createRes.status} - ${err}`);
    }

    const createdData = await createRes.json();
    return {
      id: createdData.id,
      modifiedTime: new Date().toISOString(),
    };
  }
};

export const restoreBackupFromGoogleDrive = async (): Promise<{
  backupInfo: DriveBackupFileInfo;
  data: AppDataBackup;
}> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Token Google non disponibile. Effettua l\'accesso.');

  const backupFile = await findDriveBackupFile();
  if (!backupFile) {
    throw new Error('Nessun file di backup (cartracker_pro_backup.json) trovato su Google Drive.');
  }

  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!downloadRes.ok) {
    throw new Error(`Errore download backup da Drive: ${downloadRes.status}`);
  }

  const data: AppDataBackup = await downloadRes.json();
  if (!data.veicoli || !Array.isArray(data.veicoli)) {
    throw new Error('Il file di backup non contiene una struttura dati valida per CarTracker Pro.');
  }

  return {
    backupInfo: backupFile,
    data,
  };
};

export const deleteBackupFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Token Google non disponibile. Effettua l\'accesso.');

  const deleteRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!deleteRes.ok && deleteRes.status !== 204 && deleteRes.status !== 404) {
    throw new Error(`Errore eliminazione backup da Drive: ${deleteRes.status}`);
  }

  return true;
};

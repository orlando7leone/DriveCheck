import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider Google configurato con entrambi gli scopi: Drive (per i backup) e Calendar (per Scadenze Auto)
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
// Forza la selezione dell'account e la richiesta di consenso per le autorizzazioni
googleProvider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (forceConsent: boolean = true): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    
    // Assicura che venga richiesto il cambio account e il consenso alle autorizzazioni
    if (forceConsent) {
      googleProvider.setCustomParameters({
        prompt: 'select_account consent',
      });
    }

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere il token di accesso Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Errore durante il login Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

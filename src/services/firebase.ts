import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  currentAuth?: Auth | null
): never {
  const currentUser = currentAuth?.currentUser || auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Production Firebase configuration for NeuroFactory AI
// Embedded directly to ensure zero-config functionality out-of-the-box upon GitHub push/clone
export const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'celestial-ellipse-701dl',
  appId: '1:547356574854:web:0f26ef82dc6f4c4e96bd07',
  apiKey: 'AIzaSyBYWO_PjNViJX47WqAln1l7EftLcFdwtpo',
  authDomain: 'celestial-ellipse-701dl.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-vf-02b1fa69-251c-4c94-a03f-a526ea788def',
  storageBucket: 'celestial-ellipse-701dl.firebasestorage.app',
  messagingSenderId: '547356574854',
  measurementId: '',
  oAuthClientId: '547356574854-75nb45t149afk2i0ctthiittib026np7.apps.googleusercontent.com',
};

// Hierarchical resolution: Environment variables -> firebase-applet-config.json -> Embedded Production Config
const resolvedApiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  firebaseAppletConfig?.apiKey ||
  DEFAULT_FIREBASE_CONFIG.apiKey;

const resolvedProjectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  firebaseAppletConfig?.projectId ||
  DEFAULT_FIREBASE_CONFIG.projectId;

const resolvedAuthDomain =
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
  firebaseAppletConfig?.authDomain ||
  DEFAULT_FIREBASE_CONFIG.authDomain ||
  (resolvedProjectId ? `${resolvedProjectId}.firebaseapp.com` : undefined);

const resolvedStorageBucket =
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
  firebaseAppletConfig?.storageBucket ||
  DEFAULT_FIREBASE_CONFIG.storageBucket ||
  (resolvedProjectId ? `${resolvedProjectId}.firebasestorage.app` : undefined);

const resolvedMessagingSenderId =
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
  firebaseAppletConfig?.messagingSenderId ||
  DEFAULT_FIREBASE_CONFIG.messagingSenderId;

const resolvedAppId =
  import.meta.env.VITE_FIREBASE_APP_ID ||
  firebaseAppletConfig?.appId ||
  DEFAULT_FIREBASE_CONFIG.appId;

const resolvedDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  firebaseAppletConfig?.firestoreDatabaseId ||
  DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId ||
  '(default)';

export const isFirebaseConfigured = Boolean(
  resolvedApiKey &&
    resolvedProjectId &&
    resolvedApiKey !== '' &&
    resolvedProjectId !== '' &&
    resolvedProjectId !== 'remixed-project-id'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: resolvedApiKey,
      authDomain: resolvedAuthDomain,
      projectId: resolvedProjectId,
      storageBucket: resolvedStorageBucket,
      messagingSenderId: resolvedMessagingSenderId,
      appId: resolvedAppId,
    };

    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    // Connect to specific database if custom database ID is provisioned
    db =
      resolvedDatabaseId && resolvedDatabaseId !== '(default)'
        ? getFirestore(app, resolvedDatabaseId)
        : getFirestore(app);

    // Initial connection test as mandated by Firebase integration skill
    (async () => {
      try {
        if (db) {
          await getDocFromServer(doc(db, 'test', 'connection'));
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          console.warn('Firebase client is offline or network is warming up.');
        }
      }
    })();
  } catch (initErr) {
    console.warn('Firebase SDK init warning (falling back to defensive mode):', initErr);
  }
}

export { app, auth, db };

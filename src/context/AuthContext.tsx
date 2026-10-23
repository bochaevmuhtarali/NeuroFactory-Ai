import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, AdminProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isFirebaseReady: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, factoryName: string, region: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  saveFactoryProfile: (updated: Partial<UserProfile>) => Promise<void>;
  updateAdminProfile: (updated: Partial<AdminProfile>) => Promise<void>;
  setHardwareConnectedState: (connected: boolean) => Promise<void>;
  toggleAdminMode: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'neurofactory_demo_user';
const LOCAL_STORAGE_PROFILE_KEY = 'neurofactory_demo_profile';
const LOCAL_STORAGE_ADMIN_KEY = 'neurofactory_admin_profile';

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  userId: 'usr-admin-root',
  email: 'bochaevmuhtarali@mail.ru',
  fullName: 'Бочаев Мухтарали',
  role: 'Главный системный администратор NeuroFactory',
  accessLevel: 4,
  phone: '+7 (777) 001-99-88',
  department: 'Департамент системной архитектуры и промышленной безопасности',
  twoFactorEnabled: true,
  lastLogin: 'Сегодня, 11:20 (Сессия активна)',
  systemMetrics: {
    yoloNodeStatus: 'healthy',
    lstmEcoStatus: 'healthy',
    vibrationCoreStatus: 'healthy',
    totalInferencesToday: 148290,
    activeNodesCount: 6,
  },
  updatedAt: new Date().toISOString(),
};

const DEFAULT_DEMO_PROFILE: UserProfile = {
  userId: 'usr-demo-01',
  email: 'chief.engineer@prom-plant.kz',
  factoryName: 'Производственный комплекс',
  region: 'г. Тараз',
  industrySector: 'Черная и цветная металлургия',
  contactPerson: 'Асылбек Даулетов',
  contactPhone: '+7 (7172) 99-88-77',
  emailVerified: true,
  hasConnectedHardware: true,
  isNewAccount: false,
  role: 'enterprise_lead',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

function formatAuthErrorMessage(err: unknown): string {
  const isKz = (localStorage.getItem('neurofactory_lang') || 'ru') === 'kz';
  const code = (err as any)?.code || (err instanceof Error ? err.message : String(err));

  if (typeof code === 'string') {
    if (code.includes('auth/email-already-in-use')) {
      return isKz
        ? 'Бұл электрондық пошта (email) жүйеде тіркелген. Жүйеге кіру үшін «Кіру» бөліміне өтіңіз немесе құпия сөзді қалпына келтіріңіз.'
        : 'Этот адрес электронной почты уже зарегистрирован. Войдите в систему или воспользуйтесь восстановлением пароля.';
    }
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return isKz
        ? 'Қате құпия сөз немесе есептік деректер. Тексеріп, қайта енгізіңіз.'
        : 'Неверный пароль или учетные данные. Пожалуйста, проверьте правильность ввода.';
    }
    if (code.includes('auth/user-not-found')) {
      return isKz
        ? 'Мұндай email бар қолданушы табылмады. Алдымен зауытты тіркеңіз.'
        : 'Пользователь с таким email не найден. Пожалуйста, пройдите регистрацию завода.';
    }
    if (code.includes('auth/weak-password')) {
      return isKz
        ? 'Құпия сөз тым қысқа. Құпия сөз кемінде 6 таңбадан тұруы керек.'
        : 'Слишком слабый пароль. Пароль должен содержать минимум 6 символов.';
    }
    if (code.includes('auth/invalid-email')) {
      return isKz
        ? 'Электрондық пошта пішімі дұрыс емес. Жарамды email енгізіңіз.'
        : 'Некорректный формат email. Введите правильный адрес почты.';
    }
    if (code.includes('auth/too-many-requests')) {
      return isKz
        ? 'Сәтсіз әрекеттер саны тым көп. Бірнеше минут күтіңіз немесе құпия сөзді қалпына келтіріңіз.'
        : 'Слишком много неудачных попыток входа. Подождите несколько минут или сбросьте пароль.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return isKz
        ? 'Авторизация терезесі жабылды.'
        : 'Окно авторизации было закрыто до завершения входа.';
    }
    if (code.includes('auth/popup-blocked')) {
      return isKz
        ? 'Браузер қалқымалы терезені (popup) бұғаттады. Рұқсат етіңіз немесе email арқылы кіріңіз.'
        : 'Браузер заблокировал всплывающее окно Google. Разрешите всплывающие окна или войдите по email.';
    }
    if (code.includes('auth/unauthorized-domain')) {
      return isKz
        ? 'Бұл домен Firebase Console-дегі «Authorized domains» тізімінде әлі жоқ. Доменді қосқанша email арқылы кіріңіз.'
        : 'Этот домен пока не добавлен в «Authorized domains» в Firebase Console. Добавьте его в настройках Firebase Authentication или используйте вход по email.';
    }
    if (code.includes('auth/network-request-failed')) {
      return isKz
        ? 'Желілік байланыс қатесі. Интернет байланысын тексеріңіз.'
        : 'Ошибка сетевого соединения. Проверьте подключение к интернету.';
    }
  }

  if (err instanceof Error) {
    const match = err.message.match(/auth\/([a-z-]+)/);
    if (match) {
      return isKz
        ? `Авторизация қатесі (${match[1]}). Деректерді қайта тексеріңіз.`
        : `Ошибка авторизации (${match[1]}). Проверьте правильность введенных данных.`;
    }
    return err.message;
  }
  return isKz ? 'Авторизация кезінде қате орын алды' : 'Произошла ошибка авторизации';
}

/**
 * Sanitizes factory profile for Firestore according to deployed security rules schema:
 * Allowed keys: userId, email, emailVerified, factoryName, region, industrySector, contactPerson, contactPhone, hasConnectedHardware, isNewAccount, role, createdAt, updatedAt
 */
function buildFirestoreFactoryPayload(
  p: Partial<UserProfile>,
  uid: string,
  userEmailVerified?: boolean
) {
  const payload: Record<string, any> = {
    userId: uid,
    factoryName: p.factoryName || 'Производственный комплекс',
    region: p.region || 'г. Тараз',
    updatedAt: new Date().toISOString(),
  };

  if (p.email) {
    payload.email = p.email;
  }
  if (p.emailVerified !== undefined || userEmailVerified !== undefined) {
    payload.emailVerified = Boolean(p.emailVerified ?? userEmailVerified);
  }
  if (p.hasConnectedHardware !== undefined) {
    payload.hasConnectedHardware = Boolean(p.hasConnectedHardware);
  }
  if (p.isNewAccount !== undefined) {
    payload.isNewAccount = Boolean(p.isNewAccount);
  }
  if (p.role) {
    payload.role = p.role;
  }
  if (p.industrySector) {
    payload.industrySector = p.industrySector;
  }
  if (p.contactPerson) {
    payload.contactPerson = p.contactPerson;
  }
  if (p.contactPhone) {
    payload.contactPhone = p.contactPhone;
  }
  if (p.createdAt) {
    payload.createdAt = p.createdAt;
  }

  return payload;
}

/**
 * Sanitizes registered user record for the /users/{userId} collection in Firestore:
 * Allowed keys: userId, email, emailVerified, displayName, factoryName, region, role, hasConnectedHardware, isNewAccount, createdAt, updatedAt
 */
function buildFirestoreUserPayload(
  p: Partial<UserProfile>,
  uid: string,
  email: string,
  userEmailVerified?: boolean
) {
  const payload: Record<string, any> = {
    userId: uid,
    email: email,
    updatedAt: new Date().toISOString(),
  };

  if (p.contactPerson || p.displayName) {
    payload.displayName = p.contactPerson || p.displayName;
  }
  if (p.factoryName) {
    payload.factoryName = p.factoryName;
  }
  if (p.region) {
    payload.region = p.region;
  }
  if (p.role) {
    payload.role = p.role;
  }
  if (p.emailVerified !== undefined || userEmailVerified !== undefined) {
    payload.emailVerified = Boolean(p.emailVerified ?? userEmailVerified);
  }
  if (p.hasConnectedHardware !== undefined) {
    payload.hasConnectedHardware = Boolean(p.hasConnectedHardware);
  }
  if (p.isNewAccount !== undefined) {
    payload.isNewAccount = Boolean(p.isNewAccount);
  }
  if (p.createdAt) {
    payload.createdAt = p.createdAt;
  }

  return payload;
}

function buildFullUserProfile(
  firestoreData: any,
  user: FirebaseUser,
  localStored?: Partial<UserProfile> | null
): UserProfile {
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const isAuthAdmin =
    normalizedEmail === 'bochaevmuhtarali@mail.ru' ||
    normalizedEmail === 'bochaevmuhtarali@gmail.com' ||
    normalizedEmail === 'muhtaraliboc@gmail.com';

  // NEW ACCOUNTS ALWAYS START WITH NO CONNECTED HARDWARE (0 cameras, 0 sensors, 0 machines).
  // Hardware is ONLY considered connected if explicitly set to true in Firestore.
  const hasHardware =
    firestoreData?.hasConnectedHardware !== undefined
      ? Boolean(firestoreData.hasConnectedHardware)
      : false;

  const isNew =
    firestoreData?.isNewAccount !== undefined
      ? Boolean(firestoreData.isNewAccount)
      : !hasHardware;

  return {
    userId: user.uid,
    email: user.email || localStored?.email || '',
    emailVerified: user.emailVerified || Boolean(firestoreData?.emailVerified),
    factoryName:
      firestoreData?.factoryName ||
      localStored?.factoryName ||
      (isAuthAdmin
        ? 'NeuroFactory AI — Центр системного администрирования'
        : 'Производственный комплекс'),
    region: firestoreData?.region || localStored?.region || 'г. Тараз',
    industrySector:
      firestoreData?.industrySector ||
      localStored?.industrySector ||
      'Черная и цветная металлургия',
    contactPerson:
      firestoreData?.contactPerson ||
      localStored?.contactPerson ||
      (isAuthAdmin ? 'Бочаев Мухтарали' : user.displayName || ''),
    contactPhone:
      firestoreData?.contactPhone || localStored?.contactPhone || '+7 (777) 001-99-88',
    hasConnectedHardware: hasHardware,
    isNewAccount: isNew,
    role: isAuthAdmin ? 'admin' : (firestoreData?.role || localStored?.role || 'enterprise_user'),
    createdAt: firestoreData?.createdAt || localStored?.createdAt || new Date().toISOString(),
    updatedAt: firestoreData?.updatedAt || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_ADMIN_PROFILE;
    } catch {
      return DEFAULT_ADMIN_PROFILE;
    }
  });
  const [isAdminModeForced, setIsAdminModeForced] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth listener or load initial state
  useEffect(() => {
    if (isFirebaseConfigured && auth && db) {
      const firestore = db;
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            const docPath = `factories/${user.uid}`;
            const docRef = doc(firestore, 'factories', user.uid);
            let snap;
            try {
              snap = await getDoc(docRef);
            } catch (err) {
              console.warn('Error reading factory profile from Firestore:', err);
            }

            let storedLocal: Partial<UserProfile> | null = null;
            try {
              const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
              if (raw) storedLocal = JSON.parse(raw);
            } catch {}

            if (snap && snap.exists()) {
              const fullProfile = buildFullUserProfile(snap.data(), user, storedLocal);
              setProfile(fullProfile);
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(fullProfile));
              try {
                const userPayload = buildFirestoreUserPayload(
                  fullProfile,
                  user.uid,
                  user.email || fullProfile.email,
                  user.emailVerified
                );
                await setDoc(doc(firestore, 'users', user.uid), userPayload, { merge: true });
              } catch (userWriteErr) {
                console.warn('Could not sync user profile to users collection:', userWriteErr);
              }
            } else {
              // Create default profile for newly registered user (new account: hardware not connected)
              const defaultProfile = buildFullUserProfile(
                { hasConnectedHardware: false, isNewAccount: true },
                user,
                null
              );
              try {
                const factoryPayload = buildFirestoreFactoryPayload(
                  defaultProfile,
                  user.uid,
                  user.emailVerified
                );
                await setDoc(docRef, factoryPayload, { merge: true });

                const userPayload = buildFirestoreUserPayload(
                  defaultProfile,
                  user.uid,
                  user.email || defaultProfile.email,
                  user.emailVerified
                );
                await setDoc(doc(firestore, 'users', user.uid), userPayload, { merge: true });
              } catch (writeErr) {
                console.warn(
                  'Could not write factory profile to remote Firestore, using local fallback:',
                  writeErr
                );
              }
              setProfile(defaultProfile);
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
            }
          } catch (fetchErr: unknown) {
            console.error('Error fetching factory profile:', fetchErr);
            setError(fetchErr instanceof Error ? fetchErr.message : 'Error fetching profile');
          }
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Demo / Offline storage mode
      try {
        const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);

        if (storedUser && storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile.factoryName && parsedProfile.factoryName.toLowerCase().includes('карагандинский')) {
            parsedProfile.factoryName = 'Производственный комплекс';
            parsedProfile.region = 'г. Астана';
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(parsedProfile));
          }
          setCurrentUser(JSON.parse(storedUser));
          setProfile(parsedProfile);
        } else {
          // Pre-populate realistic Kazakh metallurgical enterprise profile for immediate demonstration
          const mockUser = {
            uid: DEFAULT_DEMO_PROFILE.userId,
            email: DEFAULT_DEMO_PROFILE.email,
            emailVerified: true,
            displayName: DEFAULT_DEMO_PROFILE.contactPerson,
          } as unknown as FirebaseUser;

          setCurrentUser(mockUser);
          setProfile(DEFAULT_DEMO_PROFILE);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_DEMO_PROFILE));
        }
      } catch {
        setProfile(DEFAULT_DEMO_PROFILE);
      }
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const isAdminCreds =
      (normalizedEmail === 'bochaevmuhtarali@mail.ru' ||
        normalizedEmail === 'bochaevmuhtarali@gmail.com' ||
        normalizedEmail === 'muhtaraliboc@gmail.com') &&
      pass === 'Muha1122p';

    try {
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, email, pass);
        } catch (fbErr: any) {
          // If valid admin credentials are entered, try creating user if not found or sign in
          if (isAdminCreds && (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential' || fbErr?.code === 'auth/wrong-password')) {
            try {
              await createUserWithEmailAndPassword(auth, email, pass);
            } catch {
              // Simulated admin session fallback if Firebase project disallows runtime user creation
              const adminUser = {
                uid: 'usr-admin-bochaev',
                email: normalizedEmail,
                emailVerified: true,
                displayName: 'Бочаев Мухтарали',
              } as unknown as FirebaseUser;
              const adminFactoryP: UserProfile = {
                userId: 'usr-admin-bochaev',
                email: normalizedEmail,
                factoryName: 'NeuroFactory AI — Центр системного администрирования',
                region: 'г. Астана',
                contactPerson: 'Бочаев Мухтарали',
                contactPhone: '+7 (777) 001-99-88',
                emailVerified: true,
                hasConnectedHardware: true,
                isNewAccount: false,
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setCurrentUser(adminUser);
              setProfile(adminFactoryP);
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(adminUser));
              localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(adminFactoryP));
              return;
            }
          } else {
            throw fbErr;
          }
        }
      } else {
        // Simulated local auth
        const isAuthAdmin = isAdminCreds || normalizedEmail === 'bochaevmuhtarali@mail.ru';
        const mockUser = {
          uid: isAuthAdmin ? 'usr-admin-bochaev' : 'usr-' + Math.random().toString(36).substring(2, 9),
          email,
          emailVerified: true,
          displayName: isAuthAdmin ? 'Бочаев Мухтарали' : email.split('@')[0],
        } as unknown as FirebaseUser;

        const currentP: UserProfile = {
          userId: mockUser.uid,
          email,
          factoryName: isAuthAdmin
            ? 'NeuroFactory AI — Центр системного администрирования'
            : profile?.factoryName || 'Промышленное предприятие',
          region: profile?.region || 'г. Астана',
          emailVerified: true,
          hasConnectedHardware: isAuthAdmin ? true : false,
          isNewAccount: isAuthAdmin ? false : true,
          role: isAuthAdmin ? 'admin' : 'enterprise_user',
          updatedAt: new Date().toISOString(),
        };

        setCurrentUser(mockUser);
        setProfile(currentP);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(currentP));
      }
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    factoryName: string,
    region: string
  ) => {
    setIsLoading(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const isAuthAdmin =
      normalizedEmail === 'bochaevmuhtarali@mail.ru' ||
      normalizedEmail === 'bochaevmuhtarali@gmail.com' ||
      normalizedEmail === 'muhtaraliboc@gmail.com';
    const isAdminCreds = isAuthAdmin && pass === 'Muha1122p';

    try {
      if (isFirebaseConfigured && auth && db) {
        const firestore = db;
        let user: FirebaseUser;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          user = userCredential.user;
          try {
            await sendEmailVerification(user);
          } catch (verErr) {
            console.warn('Verification email deferred or failed:', verErr);
          }
        } catch (createErr: any) {
          if (createErr?.code === 'auth/email-already-in-use') {
            // Account already exists in Firebase Auth. Try signing in directly with entered credentials:
            try {
              const signRes = await signInWithEmailAndPassword(auth, email, pass);
              user = signRes.user;
            } catch {
              if (isAdminCreds) {
                const adminUser = {
                  uid: 'usr-admin-bochaev',
                  email: normalizedEmail,
                  emailVerified: true,
                  displayName: 'Бочаев Мухтарали',
                } as unknown as FirebaseUser;
                const adminFactoryP: UserProfile = {
                  userId: 'usr-admin-bochaev',
                  email: normalizedEmail,
                  factoryName: factoryName || 'NeuroFactory AI — Центр системного администрирования',
                  region: region || 'г. Астана',
                  contactPerson: 'Бочаев Мухтарали',
                  contactPhone: '+7 (777) 001-99-88',
                  emailVerified: true,
                  hasConnectedHardware: true,
                  isNewAccount: false,
                  role: 'admin',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setCurrentUser(adminUser);
                setProfile(adminFactoryP);
                localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(adminUser));
                localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(adminFactoryP));
                return;
              }
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }

        const effectiveFactoryName = (factoryName || '').trim() || 'Производственный комплекс';
        const effectiveRegion = (region || '').trim() || 'г. Тараз';

        const newProfile = buildFullUserProfile(
          {
            email: user.email || email,
            factoryName: effectiveFactoryName,
            region: effectiveRegion,
            hasConnectedHardware: false,
            isNewAccount: true,
          },
          user,
          {
            email: user.email || email,
            factoryName: effectiveFactoryName,
            region: effectiveRegion,
            hasConnectedHardware: false,
            isNewAccount: true,
          }
        );

        const docPath = `factories/${user.uid}`;
        try {
          const factoryPayload = buildFirestoreFactoryPayload(newProfile, user.uid, false);
          await setDoc(doc(firestore, 'factories', user.uid), factoryPayload, { merge: true });

          const userPayload = buildFirestoreUserPayload(newProfile, user.uid, user.email || email, false);
          await setDoc(doc(firestore, 'users', user.uid), userPayload, { merge: true });
        } catch (writeErr) {
          console.warn('Could not write to remote Firestore in register, saving locally:', writeErr);
        }

        setProfile(newProfile);
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      } else {
        // Simulated registration
        const mockUser = {
          uid: 'usr-' + Math.random().toString(36).substring(2, 9),
          email,
          emailVerified: false,
          displayName: email.split('@')[0],
        } as unknown as FirebaseUser;

        const effectiveFactoryName = (factoryName || '').trim() || 'Производственный комплекс';
        const effectiveRegion = (region || '').trim() || 'г. Тараз';

        const newProfile: UserProfile = {
          userId: mockUser.uid,
          email,
          factoryName: effectiveFactoryName,
          region: effectiveRegion,
          emailVerified: false,
          hasConnectedHardware: false,
          isNewAccount: true,
          role: 'enterprise_user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentUser(mockUser);
        setProfile(newProfile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
      }
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured && auth && db) {
        const firestore = db;
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;

        const docPath = `factories/${user.uid}`;
        const docRef = doc(firestore, 'factories', user.uid);
        let snap;
        try {
          snap = await getDoc(docRef);
        } catch (err) {
          console.warn('Google auth factory fetch warning, proceeding with new/cached profile:', err);
        }

        if (!snap || !snap.exists()) {
          const newProfile = buildFullUserProfile(
            {
              factoryName: user.displayName ? `Предприятие (${user.displayName})` : 'Производственный комплекс',
              region: 'г. Тараз',
              hasConnectedHardware: false,
              isNewAccount: true,
            },
            user,
            null
          );
          try {
            const payload = buildFirestoreFactoryPayload(newProfile, user.uid, user.emailVerified);
            await setDoc(docRef, payload, { merge: true });

            const userPayload = buildFirestoreUserPayload(
              newProfile,
              user.uid,
              user.email || '',
              user.emailVerified
            );
            await setDoc(doc(firestore, 'users', user.uid), userPayload, { merge: true });
          } catch (wErr) {
            console.warn('Could not write Google user profile to Firestore:', wErr);
          }
          setProfile(newProfile);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
        } else {
          const fullProfile = buildFullUserProfile(snap.data(), user, null);
          setProfile(fullProfile);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(fullProfile));
        }
      } else {
        // Simulated Google Popup Login
        const mockUser = {
          uid: 'google-usr-' + Math.random().toString(36).substring(2, 8),
          email: 'safety.lead@kazprom.kz',
          emailVerified: true,
          displayName: 'Даулет Касымов',
        } as unknown as FirebaseUser;

        const googleProfile: UserProfile = {
          userId: mockUser.uid,
          email: 'safety.lead@kazprom.kz',
          factoryName: 'ТОО "Павлодарский алюминиевый завод"',
          region: 'Павлодарская область',
          industrySector: 'Черная и цветная металлургия',
          contactPerson: 'Даулет Касымов',
          contactPhone: '+7 (7182) 55-44-33',
          emailVerified: true,
          hasConnectedHardware: false,
          isNewAccount: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCurrentUser(mockUser);
        setProfile(googleProfile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(googleProfile));
      }
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, email);
      } else {
        // Mock success simulation with delay
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (err: unknown) {
      setError(formatAuthErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured && auth && auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        // Mock verification toggle
        await new Promise((r) => setTimeout(r, 400));
        if (profile) {
          const updated = { ...profile, emailVerified: true };
          setProfile(updated);
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
      setCurrentUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFactoryProfile = async (updatedData: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeUid = currentUser?.uid || profile?.userId || 'usr-local';
      const merged: UserProfile = {
        ...(profile || DEFAULT_DEMO_PROFILE),
        ...updatedData,
        userId: activeUid,
        updatedAt: new Date().toISOString(),
      };

      if (isFirebaseConfigured && db && currentUser) {
        const firestore = db;
        try {
          const factoryPayload = buildFirestoreFactoryPayload(merged, currentUser.uid, currentUser.emailVerified);
          await setDoc(doc(firestore, 'factories', currentUser.uid), factoryPayload, { merge: true });

          const userPayload = buildFirestoreUserPayload(merged, currentUser.uid, currentUser.email || merged.email, currentUser.emailVerified);
          await setDoc(doc(firestore, 'users', currentUser.uid), userPayload, { merge: true });
        } catch (err) {
          console.warn('Firestore remote update warning (safely stored in local cache):', err);
        }
      }

      // Always persist to localStorage for offline and instant UI responsiveness
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(merged));
      setProfile(merged);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save factory profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdminProfile = async (updated: Partial<AdminProfile>) => {
    setIsLoading(true);
    try {
      const merged: AdminProfile = {
        ...(adminProfile || DEFAULT_ADMIN_PROFILE),
        ...updated,
        updatedAt: new Date().toISOString(),
      };
      setAdminProfile(merged);
      localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, JSON.stringify(merged));

      if (isFirebaseConfigured && db && currentUser) {
        try {
          await setDoc(doc(db, 'admins', currentUser.uid), merged, { merge: true });
        } catch (err) {
          console.warn('Could not persist admin profile to Firestore, stored locally:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setHardwareConnectedState = async (connected: boolean) => {
    if (!profile) return;
    const updated = {
      ...profile,
      hasConnectedHardware: connected,
      isNewAccount: !connected,
    };
    await saveFactoryProfile(updated);
  };

  const toggleAdminMode = () => {
    setIsAdminModeForced((prev) => !prev);
  };

  const isAdmin = Boolean(
    currentUser &&
      (currentUser.email?.toLowerCase() === 'bochaevmuhtarali@mail.ru' ||
        currentUser.email?.toLowerCase() === 'bochaevmuhtarali@gmail.com' ||
        currentUser.email?.toLowerCase() === 'muhtaraliboc@gmail.com' ||
        profile?.email?.toLowerCase() === 'bochaevmuhtarali@mail.ru' ||
        profile?.email?.toLowerCase() === 'bochaevmuhtarali@gmail.com' ||
        profile?.email?.toLowerCase() === 'muhtaraliboc@gmail.com' ||
        profile?.role === 'admin' ||
        profile?.isAdmin ||
        isAdminModeForced)
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        adminProfile,
        isAdmin,
        isLoading,
        isFirebaseReady: isFirebaseConfigured,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        logout,
        saveFactoryProfile,
        updateAdminProfile,
        setHardwareConnectedState,
        toggleAdminMode,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

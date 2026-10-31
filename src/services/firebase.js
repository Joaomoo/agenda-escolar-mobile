import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4akUHmThQ2Ajej5rDag56HEK3ltLApJI",
  authDomain: "cimagenda.firebaseapp.com",
  projectId: "cimagenda",
  storageBucket: "cimagenda.firebasestorage.app",
  messagingSenderId: "734388178",
  appId: "1:734388178:web:eb682c9c46931b627bf20b"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh pode executar este módulo novamente depois da inicialização.
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }

  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

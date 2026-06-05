import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth"
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"

export const firebaseConfig = {
  apiKey: "AIzaSyCyt9eDjuttp1LmsCyI0K5-WX310AHaheo",
  authDomain: "partyspace-d135f.firebaseapp.com",
  projectId: "partyspace-d135f",
  storageBucket: "partyspace-d135f.firebasestorage.app",
  messagingSenderId: "834325903410",
  appId: "1:834325903410:web:363e51362e43ade5e4242b",
  measurementId: "G-5EZJLQNFCR",
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let analyticsInstance: Analytics | null = null;
let authPersistenceInitialized = false;

export const getFirebaseApp = (): FirebaseApp => {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
};

export const getAuthWithPersistence = async (): Promise<Auth> => {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
    
    if (!authPersistenceInitialized) {
      try {
        await setPersistence(authInstance, browserLocalPersistence);
        authPersistenceInitialized = true;
      } catch (error) {
        console.log("Auth persistence already set or not available");
        authPersistenceInitialized = true;
      }
    }
  }
  return authInstance;
};

export const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (process.env.NODE_ENV !== "production" || typeof window === "undefined") {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  try {
    if (await isSupported()) {
      const app = getFirebaseApp();
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }

  return null;
};

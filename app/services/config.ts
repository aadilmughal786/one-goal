// app/services/config.ts
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore';

declare const __firebase_config: string | undefined;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// FIX: Guard the entire Firebase initialization to only run on the client-side.
// The `typeof window !== 'undefined'` check is a standard way to determine
// if the code is running in a browser environment. This block will be skipped
// during the server-side build process, preventing the "invalid-api-key" error.
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    let firebaseConfig;

    if (typeof __firebase_config !== 'undefined') {
      // Use the runtime config in production
      firebaseConfig = JSON.parse(__firebase_config);
    } else {
      // Fallback to environment variables for local development
      firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
    }

    // Initialize the app only if the config is valid
    if (firebaseConfig && firebaseConfig.apiKey) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({}),
      });
    } else {
      // This case would only happen if the config is somehow missing on the client.
      // We can log an error to the console.
      console.error('Firebase config is missing or invalid on the client-side.');
    }
  } else {
    // If the app is already initialized, get the existing instance.
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

// Export the variables. They will be `undefined` on the server but will be
// correctly initialized on the client before any service that uses them is called.
export { auth, db };

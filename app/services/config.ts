// app/services/config.ts
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

/**
 * @file app/services/config.ts
 * @description Centralized Firebase Initialization.
 *
 * This module is responsible for initializing the Firebase app and its core services
 * (Firestore, Auth). It now securely handles configuration for both production
 * and local development environments.
 */

// This global variable will be injected at runtime in the production environment.
// It ensures that Firebase secrets are NEVER hardcoded into the build files.
declare const __firebase_config: string | undefined;

let firebaseConfig;

// Check if the runtime-injected config is available.
if (typeof __firebase_config !== 'undefined') {
  // In a production/hosted environment, parse the injected config string.
  firebaseConfig = JSON.parse(__firebase_config);
} else {
  // For local development, fall back to using environment variables.
  // This ensures developers can still run the app locally without issue.
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * The single, initialized Firebase App instance.
 */
const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * The shared Authentication service instance.
 * All authentication operations will use this instance.
 */
export const auth: Auth = getAuth(app);

/**
 * The shared Firestore database instance.
 *
 * This instance is initialized using `initializeFirestore` with a configuration
 * for a persistent local cache. This is the most modern and robust way to enable
 * offline capabilities that work across multiple browser tabs.
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
});

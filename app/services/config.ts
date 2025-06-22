// app/services/config.ts
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

/**
 * @file app/services/config.ts
 * @description Centralized Firebase Initialization.
 *
 * This module is responsible for initializing the Firebase app and its core services
 * (Firestore, Auth). By centralizing this logic, we ensure that these services
 * are instantiated only once and can be shared across the entire application.
 *
 * It also enables Firestore's offline persistence, a crucial feature for a robust
 * user experience, allowing the app to function with an intermittent or no network connection.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
 *
 * - `persistentLocalCache({})`: Configures Firestore to save data on the user's device.
 * When called with an empty object, it uses a default configuration that enables
 * multi-tab synchronization if the browser environment supports it.
 *
 * If persistence fails to initialize (e.g., due to browser limitations or permissions),
 * Firestore will gracefully fall back to in-memory caching for the current session.
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
});

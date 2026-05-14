
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// This check is more robust, ensuring essential keys are present.
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;


if (isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();

    if (typeof window !== 'undefined') {
        // Enable offline persistence only on the client-side
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence is not available in this browser.');
            }
        });
        
        // Register service worker only on the client-side
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
            .register(`/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}&measurementId=${firebaseConfig.measurementId}`)
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(err => {
                console.error('Service Worker registration failed:', err);
            });
        }
    }

} else {
  // Provide dummy objects if not configured to prevent crashes on server during build.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  googleProvider = {} as GoogleAuthProvider;
}

export { app, auth, db, googleProvider, isFirebaseConfigured };

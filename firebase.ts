import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback to prevent app crash on load, but features will fail if used
    // We throw here if we want ErrorBoundary to catch it, but module-level throw crashes app.
    // Better to let it be undefined or mock, but for now let's just log.
    // The app will likely crash when 'auth' is used, but that should be caught by ErrorBoundary or React.
}

export { auth, db, googleProvider };

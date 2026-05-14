
import * as admin from 'firebase-admin';

// Correctly structure the service account object
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key needs to be parsed correctly, replacing \\n with \n
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const isConfigured = !!serviceAccount.projectId && !!serviceAccount.clientEmail && !!serviceAccount.privateKey;

/**
 * Initializes the Firebase Admin app if not already initialized.
 * This is a singleton pattern to prevent re-initialization.
 */
function initializeAdminApp() {
  if (!isConfigured) {
    console.warn("Firebase Admin SDK is not configured. Missing required environment variables. Skipping initialization.");
    return;
  }
  
  if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
    } catch (error: any) {
        console.error("Firebase Admin SDK initialization error:", error.message);
        // Do not throw here, as it can crash the server during build.
        // Let getAdminApp handle the error reporting.
    }
  }
}

// Initialize the app on module load
initializeAdminApp();

/**
 * Gets the initialized Firebase Admin app.
 * Throws an error if the app is not configured or fails to initialize.
 * @returns The Firebase Admin app instance.
 */
export function getAdminApp() {
    if (!isConfigured) {
        throw new Error("Firebase Admin SDK is not configured due to missing environment variables.");
    }
    if (admin.apps.length === 0) {
       // This condition would mean initializeApp failed above.
       throw new Error("Firebase Admin SDK failed to initialize. Check server logs for details.");
    }
    return admin.app();
}

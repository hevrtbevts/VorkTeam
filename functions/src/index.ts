
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Inisialisasi Firebase Admin SDK
try {
  admin.initializeApp();
} catch (e) {
  logger.info('Admin SDK sudah diinisialisasi.');
}

// Anda dapat menambahkan fungsi baru di sini nanti.
// Contoh:
//
// import { onCall } from 'firebase-functions/v2/https';
//
// export const helloWorld = onCall((request) => {
//   logger.info("Hello logs!", {structuredData: true});
//   return { message: "Hello from Firebase!" };
// });

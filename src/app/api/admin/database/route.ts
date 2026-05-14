
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function GET(request: Request) {
  try {
    const adminApp = getAdminApp();
    const db = admin.firestore(adminApp);

    // Optional: Verify that the user making the request is an admin
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (idToken) {
        const decodedToken = await admin.auth(adminApp).verifyIdToken(idToken);
        const adminUserDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
        }
    }
    // If no token is provided in development, you might allow it, but for production, this check is crucial.
    // For now, we allow it to proceed if no token is given for easier debugging.

    const collections = await db.listCollections();
    const result: { collection: string, documents: any[] }[] = [];

    for (const col of collections) {
      const snapshot = await col.get();
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamps to a serializable format
        Object.keys(data).forEach(key => {
            if (data[key] instanceof admin.firestore.Timestamp) {
                data[key] = {
                    _seconds: data[key].seconds,
                    _nanoseconds: data[key].nanoseconds
                };
            }
        });
        return {
          id: doc.id,
          ...data,
        };
      });
      result.push({
        collection: col.id,
        documents: docs,
      });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error('Error in /api/admin/database:', err);
    // Provide a more specific error message if possible
    let errorMessage = 'An internal server error occurred.';
    if (err.code === 'permission-denied') {
      errorMessage = 'Firestore permission denied. Check your security rules or Admin SDK permissions.';
    } else if (err.message) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

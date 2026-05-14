
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import type { User } from '@/lib/types';

type UserManagementData = Partial<Pick<User, 'role' | 'status'>>;

export async function POST(request: Request) {
  try {
    getAdminApp(); // Ensure admin app is initialized

    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const adminUid = decodedToken.uid;
    
    // Fetch admin user's data to verify their role
    const adminUserDoc = await admin.firestore().collection('users').doc(adminUid).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const body = await request.json();
    const { userIdToUpdate, updates } = body as { userIdToUpdate: string, updates: UserManagementData };

    if (!userIdToUpdate || !updates) {
      return NextResponse.json({ error: 'Bad Request: Missing userIdToUpdate or updates' }, { status: 400 });
    }

    const userToUpdateRef = admin.firestore().collection('users').doc(userIdToUpdate);

    const updatePayload: any = { ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    await userToUpdateRef.update(updatePayload);

    return NextResponse.json({ success: true, message: `User ${userIdToUpdate} updated successfully.` });
    
  } catch (error: any) {
    console.error('Error in /api/admin/users:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

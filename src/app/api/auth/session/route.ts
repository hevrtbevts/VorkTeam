
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';

// Inisialisasi Firebase Admin SDK
try {
  getAdminApp();
} catch (e) {
  console.error('/api/auth/session: Gagal menginisialisasi Firebase Admin SDK', e);
}

// Endpoint untuk membuat cookie sesi setelah login di client
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  // Durasi cookie sesi (misalnya, 5 hari)
  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  try {
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // Konversi ke detik
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session cookie' }, { status: 401 });
  }
}

// Endpoint untuk menghapus cookie sesi saat logout
export async function DELETE() {
  const options = {
    name: 'session',
    value: '',
    maxAge: -1, // Hapus cookie
    path: '/',
  };

  const response = NextResponse.json({ status: 'success' }, { status: 200 });
  response.cookies.set(options);

  return response;
}

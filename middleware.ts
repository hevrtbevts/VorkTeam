
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';

// Set runtime ke nodejs karena firebase-admin tidak didukung di edge runtime.
export const runtime = 'nodejs';

// Fungsi untuk memverifikasi cookie sesi dari request.
async function verifySessionCookie(req: NextRequest): Promise<adminAuth.DecodedIdToken | null> {
  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    // Memastikan Firebase Admin SDK sudah diinisialisasi sebelum digunakan.
    getAdminApp();
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    // Jika verifikasi gagal (misalnya, cookie kadaluwarsa), cookie akan dihapus.
    console.warn('Middleware: Gagal memverifikasi cookie sesi, cookie akan dihapus.', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = await verifySessionCookie(request);

  // Daftar halaman otentikasi yang tidak memerlukan login.
  const isAuthPage = ['/login', '/pending-approval'].includes(pathname);

  // Jika pengguna sudah login (memiliki token yang valid)
  if (authenticatedUser) {
    // dan mencoba mengakses halaman login/pending, arahkan ke dashboard.
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  // Jika pengguna belum login (tidak punya token yang valid)
  else {
    // dan mencoba mengakses halaman aplikasi yang dilindungi (bukan halaman auth), arahkan ke login.
    if (!isAuthPage) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Hapus cookie 'session' jika ada yang tidak valid.
      response.cookies.delete('session');
      return response;
    }
  }

  // Jika tidak ada kondisi di atas yang terpenuhi, lanjutkan ke halaman yang dituju.
  return NextResponse.next();
}

// Konfigurasi path mana saja yang akan dijalankan oleh middleware.
export const config = {
  matcher: [
    /*
     * Cocokkan semua path permintaan kecuali untuk:
     * - api (rute API)
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico (file favicon)
     * - File di dalam /public (seperti gambar, manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

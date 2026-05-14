
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.28,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login();
    } catch (error: any) {
      if (error.code === 'auth/project-soft-deleted') {
        setLoginError('Proyek Firebase telah dihapus. Harap buat proyek baru di Firebase Console dan perbarui kredensial di file .env Anda.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('Login dibatalkan karena jendela pop-up ditutup.');
      } else if (error.code === 'auth/unauthorized-domain') {
          setLoginError('Domain aplikasi ini tidak diizinkan untuk otentikasi. Tambahkan domain ini ke daftar domain resmi di Firebase Console Anda.');
      } else if (error.code === 'auth/internal-error' && error.message.includes('deleted_client')) {
          setLoginError('Kredensial OAuth tidak valid atau telah dihapus. Harap buat ulang "OAuth 2.0 Client ID" di Google Cloud Console dan perbarui NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID di file .env Anda.');
      }
      else {
        setLoginError(error.message || 'Terjadi kesalahan saat login.');
      }
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && !loading && user) {
      if (user.status === 'approved') {
        router.push('/dashboard');
      } else {
        router.push('/pending-approval');
      }
    }
  }, [user, loading, router]);

  if (loading && isFirebaseConfigured) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevents flicker when redirecting
  if (isFirebaseConfigured && user) return null;

  return (
    <div className="w-full max-w-sm flex flex-col items-center text-center p-8">
        <h1 className="font-['Clash_Display'] text-5xl font-bold tracking-tight text-white uppercase leading-none">
            TEAM REWANG
        </h1>
        <p className="mt-2 text-white/80">Save time, minimize errors, and improve work efficiency.</p>
      
        <div className="flex flex-col gap-4 mt-8 w-full">
          {!isFirebaseConfigured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Konfigurasi Dibutuhkan</AlertTitle>
              <AlertDescription>
                Kredensial Firebase belum diatur di file <strong>.env</strong>. Silakan salin kredensial dari Firebase Console Anda.
              </AlertDescription>
            </Alert>
          )}
          {loginError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Login</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
          )}
          <Button variant="secondary" className="w-full" onClick={handleLogin} disabled={loading || !isFirebaseConfigured}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span className="ml-2">Login with Google</span>
              </>
            )}
          </Button>
          <p className="px-8 text-center text-xs text-white/60">
            By clicking continue, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
    </div>
  );
}

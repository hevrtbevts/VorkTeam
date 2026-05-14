
'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import FCMSetup from '@/components/FCMSetup';

// Fungsi untuk mengelola cookie sesi
async function setSessionCookie(idToken: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSessionCookie() {
  await fetch('/api/auth/session', { method: 'DELETE' });
}


interface FullUser extends User {
    firebaseUser?: FirebaseAuthUser | null;
}

interface AuthContextType {
  user: FullUser | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FullUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Pengguna login. Set cookie sesi.
        const idToken = await fbUser.getIdToken();
        await setSessionCookie(idToken);

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, firebaseUser: fbUser });
          }
          // Kita tidak perlu menangani kasus 'else' di sini karena
          // user document seharusnya sudah dibuat saat login pertama kali.
          // Jika belum ada, akan dibuat oleh fungsi login.
          setLoading(false);
        }, (error) => {
          console.error("Auth Hook: Error onSnapshot:", error);
          setUser(null);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // Pengguna logout. Hapus cookie sesi.
        await clearSessionCookie();
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    try {
      // Proses login dengan Google
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;

      // Cek apakah user sudah ada di Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Jika user baru, buat dokumen di Firestore
        const newUser: Omit<User, 'id'> = {
          name: fbUser.displayName || 'Pengguna Baru',
          email: fbUser.email!,
          avatarUrl: fbUser.photoURL || '',
          phoneNumber: fbUser.phoneNumber || '',
          role: 'sales',
          status: 'pending',
          weeklyTarget: 0,
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUser);
      }
      // State akan diupdate oleh onAuthStateChanged, kita tidak perlu setState di sini.
      // Cukup arahkan router. Middleware akan menangani sisanya.
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Login failed:", error);
      setLoading(false);
      // Lempar error agar bisa ditangkap oleh komponen login
      throw error;
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
    // onAuthStateChanged akan menangani penghapusan state dan cookie.
    router.push('/login');
  };

  const value = { user, firebaseUser, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
        {children}
        {user && user.status === 'approved' && <FCMSetup userId={user.id} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

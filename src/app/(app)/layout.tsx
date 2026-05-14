
'use client';

import React from 'react';
import { MainSidebar } from '@/components/main-sidebar';
import { BottomNavbar } from '@/components/bottom-navbar';
import { FilterProvider } from '@/context/FilterContext';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Middleware sudah melindungi rute ini, tapi kita tetap butuh loading state
  // saat data user dari Firestore sedang disinkronisasi di client.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FilterProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <MainSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <header className="sticky top-0 z-30 hidden h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:flex justify-end">
              <Header />
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-28 sm:pb-4">
            {children}
          </main>
        </div>
        <BottomNavbar />
      </div>
    </FilterProvider>
  );
}

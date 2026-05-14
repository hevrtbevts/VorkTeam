
'use client';

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import type { Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientDetailContent } from '@/components/clients/client-detail-content';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ClientDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;

    const docRef = doc(db, 'konsumen', clientId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const clientData = { id: doc.id, ...doc.data() } as Client;
        // Basic authorization: check if user owns the data or is an admin
        if (user?.role === 'admin' || clientData.uid === user?.id) {
          setClient(clientData);
        } else {
          setError('Anda tidak memiliki izin untuk melihat klien ini.');
        }
      } else {
        setError('Klien tidak ditemukan.');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching client details:", err);
      setError('Gagal memuat data klien.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, user]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={() => router.back()} className="self-start gap-2">
        <ArrowLeft />
        Kembali
      </Button>
      
      {error && (
        <Card>
          <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {client && !error && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-2xl uppercase">{client.nama}</CardTitle>
              <StatusBadge status={client.status} className="self-start sm:self-center" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientDetailContent client={client} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

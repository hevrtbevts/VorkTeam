
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Client, ClientStatus, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientCard } from './client-card';
import { collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot, Query, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoadingSkeleton = () => (
  <div className="space-y-4 mt-4">
    {[...Array(3)].map((_, i) => (
      <Skeleton key={i} className="h-[125px] w-full rounded-lg" />
    ))}
  </div>
);

interface ClientListViewProps {
  view: 'pipeline' | 'client' | 'archive';
  user: User;
  onCardClick: (client: Client) => void;
  onStatusChange: (client: Client, newStatus: ClientStatus) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const PAGE_SIZE = 10;

export function ClientListView({ view, user, onCardClick, onStatusChange, onEdit, onDelete }: ClientListViewProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver>();

  const { statusFilters } = useMemo(() => ({
      statusFilters: {
          pipeline: ['PROSPEK', 'SURVEY', 'ACC'],
          client: ['TERKIRIM', 'PENDING'],
          archive: ['DI PENDING', 'BATAL']
      }[view],
  }), [view]);

  const statusOptions = useMemo(() => {
    if (view === 'pipeline') {
      return ['PROSPEK', 'SURVEY', 'ACC', 'DI PENDING', 'BATAL'];
    }
    if (view === 'client') {
      return ['TERKIRIM', 'PENDING', 'DI PENDING', 'BATAL'];
    }
    return ['PROSPEK', 'SURVEY', 'TERKIRIM', 'PENDING'];
  }, [view]) as ClientStatus[];

  const buildQuery = useCallback((afterDoc: QueryDocumentSnapshot<DocumentData> | null = null): Query => {
    let baseQuery = query(
      collection(db, 'konsumen'),
      where('status', 'in', statusFilters),
      where('uid', '==', user.id)
    );
    
    let finalQuery = query(baseQuery, orderBy('tanggal', 'desc'), limit(PAGE_SIZE));
    
    if (afterDoc) {
      finalQuery = query(finalQuery, startAfter(afterDoc));
    }

    return finalQuery;
  }, [statusFilters, user.id]);

  const loadMoreClients = useCallback(async () => {
    if (loadingMore || !hasMore || !lastVisible) return;
    setLoadingMore(true);

    try {
      const q = buildQuery(lastVisible);
      const documentSnapshots = await getDocs(q);

      const newClients = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setClients(prev => [...prev, ...newClients]);
      setLastVisible(lastDoc || null);
      setHasMore(documentSnapshots.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error loading more clients:", error);
      toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Gagal memuat data klien selanjutnya.' });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastVisible, buildQuery, toast]);

  const lastElementRef = useCallback(node => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore) {
              loadMoreClients();
          }
      });
      if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadMoreClients]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    setClients([]);
    setLastVisible(null);
    setHasMore(true);

    const q = buildQuery();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newClients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      setClients(newClients);
      setLastVisible(lastDoc || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Gagal memuat data klien.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [view, user, buildQuery, toast]);
  
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="mt-4">
      {clients.length > 0 ? (
        clients.map((client, index) => {
           const card = (
                <ClientCard
                    key={client.id}
                    client={client}
                    user={user}
                    onCardClick={onCardClick}
                    onStatusChange={onStatusChange}
                    statusOptions={statusOptions}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
           );

           if (clients.length === index + 1) {
             return <div ref={lastElementRef} key={client.id}>{card}</div>;
           }
           return card;
        })
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground p-8">
              Tidak ada klien ditemukan untuk filter ini.
            </div>
          </CardContent>
        </Card>
      )}
      {loadingMore && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

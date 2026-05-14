
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, where, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client, ClientStatus, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { ClientCard } from '@/components/clients/client-card';
import { ClientListView } from '@/components/clients/client-list-view';
import { Loader2 } from 'lucide-react';

interface ClientTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    searchTerm: string;
    user: User;
    onCardClick: (client: Client) => void;
    onStatusChange: (client: Client, newStatus: ClientStatus) => void;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
}

export function ClientTabs({ 
    activeTab, onTabChange, searchTerm, user, 
    onCardClick, onStatusChange, onEdit, onDelete
}: ClientTabsProps) {
    const { toast } = useToast();
    const [searchClients, setSearchClients] = useState<Client[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    
    const statusOptions = useMemo(() => {
        return ['PROSPEK', 'SURVEY', 'ACC', 'TERKIRIM', 'PENDING', 'DI PENDING', 'BATAL'];
    }, []) as ClientStatus[];

    useEffect(() => {
        if (!user || !searchTerm) {
            setSearchClients([]);
            setLoadingSearch(false);
            return;
        }
        setLoadingSearch(true);

        const q: Query = query(collection(db, 'konsumen'), where('uid', '==', user.id));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            const upperCaseSearchTerm = searchTerm.toUpperCase();
            const filtered = clientsData.filter(client => 
                client.nama.toUpperCase().includes(upperCaseSearchTerm) ||
                (client.barang && client.barang.toUpperCase().includes(upperCaseSearchTerm)) ||
                client.alamat.toUpperCase().includes(upperCaseSearchTerm)
            );
            setSearchClients(filtered);
            setLoadingSearch(false);
        }, (error) => {
            console.error("Error searching clients: ", error);
            toast({
                variant: 'destructive',
                title: 'Gagal Mencari Data',
                description: 'Terjadi kesalahan saat mencari klien.'
            });
            setLoadingSearch(false);
        });

        return () => unsubscribe();
    }, [user, searchTerm, toast]);
    
    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <div className="flex justify-center">
                <TabsList>
                    <TabsTrigger value="arsip">Arsip</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    <TabsTrigger value="client">Client</TabsTrigger>
                </TabsList>
            </div>
            
            {searchTerm ? (
                 <div className="mt-4">
                    {loadingSearch ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : searchClients.length > 0 ? (
                        searchClients.map(client => (
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
                        ))
                    ) : (
                        <Card>
                        <CardContent className="p-4">
                            <div className="text-center text-muted-foreground p-8">
                            Tidak ada hasil untuk &quot;{searchTerm}&quot;.
                            </div>
                        </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <>
                    <TabsContent value="arsip" className="mt-0">
                        <ClientListView
                            view="archive"
                            user={user}
                            onCardClick={onCardClick}
                            onStatusChange={onStatusChange}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </TabsContent>
                    <TabsContent value="pipeline" className="mt-0">
                        <ClientListView
                            view="pipeline"
                            user={user}
                            onCardClick={onCardClick}
                            onStatusChange={onStatusChange}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </TabsContent>
                    <TabsContent value="client" className="mt-0">
                        <ClientListView
                            view="client"
                            user={user}
                            onCardClick={onCardClick}
                            onStatusChange={onStatusChange}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </TabsContent>
                </>
            )}
      </Tabs>
    );
}

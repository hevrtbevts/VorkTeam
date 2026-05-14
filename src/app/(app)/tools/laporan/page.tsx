
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from "lucide-react";
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { ReportStatsCards } from '@/components/reports/ReportStatsCards';
import { ReportTable } from '@/components/reports/ReportTable';
import { exportReportToJpg } from '@/lib/report-exporter';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';


export default function LaporanPenyelamPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [catatan, setCatatan] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);

    const { weekStart, weekEnd, dateRangeDisplay } = useMemo(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Senin
        const end = addDays(start, 5); // Sabtu
        const display = `${format(start, 'd MMM', { locale: localeId })} - ${format(end, 'd MMM yyyy', { locale: localeId })}`;
        return { weekStart: start, weekEnd: end, dateRangeDisplay: display };
    }, []);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const startTimestamp = Timestamp.fromDate(weekStart);
        const endTimestamp = Timestamp.fromDate(endOfWeek(weekEnd));

        const q = query(
            collection(db, 'konsumen'),
            where('uid', '==', user.id),
            where('tanggal', '>=', startTimestamp),
            where('tanggal', '<=', endTimestamp),
            where('status', 'in', ['TERKIRIM', 'PENDING', 'SURVEY']),
            orderBy('tanggal', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, weekStart, weekEnd]);
    
    useEffect(() => {
      if (user?.name) {
        setCatatan(`${user.name.toUpperCase()} - SALES`);
      }
    }, [user]);

    const stats = useMemo(() => {
        const terkirim = clients
            .filter(c => c.status === 'TERKIRIM')
            .reduce((acc, client) => acc + client.omset, 0);
        const pending = clients
            .filter(c => c.status === 'PENDING')
            .reduce((acc, client) => acc + client.omset, 0);
        const survey = clients
            .filter(c => c.status === 'SURVEY')
            .reduce((acc, client) => acc + client.omset, 0);
        return { terkirim, pending, survey };
    }, [clients]);

    const handleExport = async () => {
        setIsExporting(true);
        toast.info("Mempersiapkan JPG...");
        try {
            const fileName = `Laporan_${user?.name?.replace(/\s/g, '_') || 'Penyelam'}_${dateRangeDisplay.replace(/\s/g, '_')}.jpg`;
            await exportReportToJpg(reportRef, fileName, user?.name || '');
            toast.success("Laporan JPG berhasil diunduh!");
        } catch (error) {
            console.error("Error exporting to JPG:", error);
            toast.error("Gagal mengekspor laporan ke JPG.");
        } finally {
            setIsExporting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center w-full gap-4">
            <div ref={reportRef} className="w-full max-w-4xl bg-card rounded-2xl p-4 sm:p-6">
                <CardHeader className="p-0 pb-2 text-center">
                    <h1 className="text-xl font-bold">LAPORAN PENYELAM</h1>
                    <p className="text-base text-muted-foreground">{dateRangeDisplay}</p>
                    <Textarea
                        id="catatan-export"
                        placeholder="Nama - Sales..."
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        rows={1}
                        className="w-full text-center font-bold text-xl tracking-wider resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none uppercase"
                    />
                </CardHeader>
                <CardContent className="p-0">
                    <ReportStatsCards stats={stats} />
                    <ReportTable clients={clients} />
                </CardContent>
            </div>
            
            <Button onClick={handleExport} variant="outline" size="lg" className="w-full max-w-4xl" disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                <span className="ml-2">Export JPG</span>
            </Button>
        </div>
    );
}


'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client, ClientStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { ReportStatsCards } from '@/components/reports/ReportStatsCards';
import { ReportTable } from '@/components/reports/ReportTable';
import { exportReportToJpg } from '@/lib/report-exporter';
import { Loader2, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MonthPicker = ({ selectedMonth, onMonthChange }: { selectedMonth: Date, onMonthChange: (date: Date) => void }) => {
    return (
        <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onMonthChange(subMonths(selectedMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-center w-48">
                {format(selectedMonth, 'MMMM yyyy', { locale: localeId })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => onMonthChange(addMonths(selectedMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function MonthlyRecapPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date } | null>(null);
    const [dateRangeDisplay, setDateRangeDisplay] = useState('');
    const [catatan, setCatatan] = useState('');

    useEffect(() => {
        if (user?.name) {
          setCatatan(`${user.name.toUpperCase()} - SALES`);
        }
    }, [user]);

    const fetchMonthlySetting = useCallback(async (month: Date) => {
        setLoading(true);
        const docId = format(month, 'yyyy_MM');
        const settingsDocRef = doc(db, 'settings_bulan_ini', docId);
        const docSnap = await getDoc(settingsDocRef);

        let display: string;
        let range: { start: Date, end: Date };

        if (docSnap.exists()) {
            const data = docSnap.data();
            range = {
                start: data.start.toDate(),
                end: data.end.toDate(),
            };
            display = `${format(range.start, 'd MMM', { locale: localeId })} - ${format(range.end, 'd MMM yyyy', { locale: localeId })}`;
        } else {
            range = {
                start: startOfMonth(month),
                end: endOfMonth(month),
            };
            display = format(month, 'MMMM yyyy', { locale: localeId });
        }
        setDateRange(range);
        setDateRangeDisplay(display);
    }, []);

    useEffect(() => {
        fetchMonthlySetting(selectedMonth);
    }, [selectedMonth, fetchMonthlySetting]);
    
    useEffect(() => {
        if (!user || !dateRange) return;

        setLoading(true);
        const startTimestamp = Timestamp.fromDate(dateRange.start);
        const endTimestamp = Timestamp.fromDate(dateRange.end);

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
    }, [user, dateRange]);

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
        if (!user) return;
        setIsExporting(true);
        toast.info("Mempersiapkan JPG...");
        try {
            const fileName = `Rekap_Bulanan_${user?.name?.replace(/\s/g, '_') || 'Sales'}_${format(selectedMonth, 'MMM_yyyy')}.jpg`;
            await exportReportToJpg(reportRef, fileName, user.name);
            toast.success("Rekap JPG berhasil diunduh!");
        } catch (error) {
            console.error("Error exporting to JPG:", error);
            toast.error("Gagal mengekspor rekap ke JPG.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-4'>
                <MonthPicker selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                <Button onClick={handleExport} variant="outline" size="sm" disabled={isExporting || loading} className="w-full sm:w-auto">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    <span className="ml-2">Export JPG</span>
                </Button>
            </div>
            
             {loading ? (
                <div className="flex h-[calc(100vh-20rem)] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div ref={reportRef} className="bg-card rounded-2xl p-4 sm:p-6 w-full">
                    <div className='text-center mb-4'>
                        <h1 id="report-title" className="text-2xl font-bold">LAPORAN BULANAN</h1>
                        <p id="report-date-range" className="text-lg text-muted-foreground">{dateRangeDisplay}</p>
                        <p id="author-name" className="text-center font-bold text-xl tracking-wider uppercase mt-2">{catatan}</p>
                    </div>
                    
                    <ReportStatsCards stats={stats} />
                    <ReportTable clients={clients} />
                </div>
            )}
        </div>
    );
}


'use client';

import React from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { OmsetChart } from '@/components/dashboard/OmsetChart';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowUpRight, TrendingUp, Users, CalendarDays, ChevronLeft, ChevronRight, UserPlus, UserCheck, UserCog, MoreVertical } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, isAfter } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const formatRupiah = (value: number) => {
    if (isNaN(value)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatAngka = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
};

const MonthPicker = ({ selectedMonth, onMonthChange }: { selectedMonth: Date, onMonthChange: (date: Date) => void }) => {
    return (
        <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-full bg-black/20 p-2 shadow">
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white hover:bg-white/20 hover:text-white" onClick={() => onMonthChange(subMonths(selectedMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-white" />
                <p className="min-w-[8rem] text-center text-sm font-semibold text-white">
                    {format(selectedMonth, 'MMMM yyyy', { locale: localeId })}
                </p>
            </div>
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-white hover:bg-white/20 hover:text-white" onClick={() => onMonthChange(addMonths(selectedMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    );
};


export default function DashboardPage() {
    const { user } = useAuth();
    
    const [clients, setClients] = React.useState<Client[]>([]);
    const [weeklyClients, setWeeklyClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const [selectedMonth, setSelectedMonth] = React.useState(new Date());
    const [dateRange, setDateRange] = React.useState<{ from: Date, to: Date } | null>(null);

     const fetchMonthlySetting = React.useCallback(async (month: Date) => {
        const docId = format(month, 'yyyy_MM');
        const settingsDocRef = doc(db, 'settings_bulan_ini', docId);
        const docSnap = await getDoc(settingsDocRef);

        let range;
        if (docSnap.exists()) {
            const data = docSnap.data();
            range = { from: data.start.toDate(), to: data.end.toDate() };
        } else {
            range = { from: startOfMonth(month), to: endOfMonth(month) };
        }
        setDateRange(range);
    }, []);

    React.useEffect(() => {
        if (!selectedMonth) return;
        fetchMonthlySetting(selectedMonth);
    }, [selectedMonth, fetchMonthlySetting]);
    
    React.useEffect(() => {
        if (!user || !dateRange) return;
        setLoading(true);
        
        const fromTimestamp = Timestamp.fromDate(dateRange.from);
        const toTimestamp = Timestamp.fromDate(dateRange.to);
        
        let q;
        const konsumenCollection = collection(db, 'konsumen');

        if (user.role === 'admin') {
            q = query(
                konsumenCollection, 
                where('status', 'in', ['TERKIRIM', 'PENDING']),
                where('tanggal', '>=', fromTimestamp), 
                where('tanggal', '<=', toTimestamp)
            );
        } else {
            q = query(
                konsumenCollection, 
                where('uid', '==', user.id),
                where('status', 'in', ['TERKIRIM', 'PENDING']),
                where('tanggal', '>=', fromTimestamp), 
                where('tanggal', '<=', toTimestamp)
            );
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients for chart: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, dateRange]);

    React.useEffect(() => {
        if (!user) return;

        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const startTimestamp = Timestamp.fromDate(start);
        const endTimestamp = Timestamp.fromDate(end);

        let weeklyQuery;
        const konsumenCollection = collection(db, 'konsumen');
        
        if (user.role === 'admin') {
             weeklyQuery = query(
                 konsumenCollection, 
                 where('status', 'in', ['TERKIRIM', 'PENDING']),
                 where('tanggal', '>=', startTimestamp),
                 where('tanggal', '<=', endTimestamp)
            );
        } else {
             weeklyQuery = query(
                 konsumenCollection, 
                 where('uid', '==', user.id),
                 where('status', 'in', ['TERKIRIM', 'PENDING']),
                 where('tanggal', '>=', startTimestamp),
                 where('tanggal', '<=', endTimestamp)
            );
        }
        
        const unsubscribe = onSnapshot(weeklyQuery, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setWeeklyClients(clientsData);
        }, (error) => {
            console.error("Error fetching clients for weekly target: ", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMonthChange = (newMonth: Date) => {
        setSelectedMonth(newMonth);
    };

    const { totalOmset, totalKonsumen, omsetTerkirim, konsumenBaru, konsumenEks, konsumenLanggan } = React.useMemo(() => {
        const totalOmset = clients.reduce((acc, client) => acc + client.omset, 0);
        const omsetTerkirim = clients
            .filter(c => c.status === 'TERKIRIM')
            .reduce((acc, client) => acc + client.omset, 0);

        const totalKonsumen = clients.length;
        
        const konsumenBaru = clients.filter(c => c.konsumen === 'BARU').length;
        const konsumenEks = clients.filter(c => c.konsumen === 'EKS').length;
        const konsumenLanggan = clients.filter(c => c.konsumen === 'LANGGAN').length;

        return { totalOmset, totalKonsumen, omsetTerkirim, konsumenBaru, konsumenEks, konsumenLanggan };
    }, [clients]);

    if (!user) {
        return null;
    }
    
    const salesThisWeek = weeklyClients.reduce((acc, client) => acc + client.omset, 0);
    const weeklyTarget = user?.weeklyTarget || 0;
    const progress = weeklyTarget > 0 ? Math.min((salesThisWeek / weeklyTarget) * 100, 100) : 0;
    
    const chartTitle = "Your Daily Summary";

    return (
        <div className="flex flex-col gap-4">
            <div className='flex items-center justify-between'>
                <GreetingHeader user={user} />
                <div className='sm:hidden'>
                    <Header />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Card className="bg-card-dark text-card-foreground-dark dark:bg-card-dark dark:text-card-foreground-dark rounded-3xl p-4 pb-6 space-y-2 border-0">
                        <div className="flex flex-row items-center justify-between pb-2">
                            <div>
                              <h3 className="text-sm text-muted-foreground">{chartTitle}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="h-5 w-5 text-inherit" />
                                <MoreVertical className="h-5 w-5 text-inherit" />
                            </div>
                        </div>
                        <MonthPicker selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
                        <OmsetChart 
                            clients={clients}
                            loading={loading} 
                            dateRange={dateRange || undefined}
                            filterType={'month'}
                            user={user}
                            className="lg:col-span-2"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Card className="bg-primary text-black rounded-2xl p-4 flex flex-col justify-between border-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-black">Total Omset</h3>
                                    <ArrowUpRight className="h-5 w-5 text-inherit" />
                                </div>
                                <div className="flex-grow flex flex-col justify-center">
                                    <p className="text-3xl font-bold text-black">{formatRupiah(totalOmset)}</p>
                                </div>
                                 {totalKonsumen > 0 && (
                                     <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-black/20">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold">{totalKonsumen}</span>
                                            <span className="opacity-70">trx</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {konsumenBaru > 0 && (
                                            <div className="flex items-center gap-1">
                                                <UserPlus className="h-3 w-3" />
                                                <span className='font-semibold'>Baru:</span>
                                                <span className="font-semibold">{konsumenBaru}</span>
                                            </div>
                                            )}
                                            {konsumenEks > 0 && (
                                            <div className="flex items-center gap-1">
                                                <UserCog className="h-3 w-3" />
                                                <span className='font-semibold'>Eks:</span>
                                                <span className="font-semibold">{konsumenEks}</span>
                                            </div>
                                            )}
                                            {konsumenLanggan > 0 && (
                                            <div className="flex items-center gap-1">
                                                <UserCheck className="h-3 w-3" />
                                                <span className='font-semibold'>Langgan:</span>
                                                <span className="font-semibold">{konsumenLanggan}</span>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                            <Card className="bg-card dark:bg-card dark:text-card-foreground rounded-2xl p-4 flex flex-col justify-between border-0">
                                 <div className="flex justify-between items-start">
                                    <h3 className="font-semibold">Omset Terkirim</h3>
                                    <Users className="h-5 w-5" />
                                </div>
                                 <p className="text-3xl font-bold mt-2">{formatRupiah(omsetTerkirim)}</p>
                                 <p className="text-xs opacity-80 mt-1">dari total omset</p>
                            </Card>
                        </div>
                        
                        <div className="pt-2 mt-2 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Weekly Target</h3>
                                <ArrowUpRight className="h-5 w-5" />
                            </div>
                            <div className="flex-grow flex flex-col justify-center gap-2 mt-2">
                                {weeklyTarget > 0 ? (
                                    <>
                                        <div className="relative w-full h-3 rounded-full overflow-hidden bg-muted">
                                            <Progress value={progress} className="h-3" indicatorClassName="bg-primary" />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <p className="font-bold text-white">{formatRupiah(salesThisWeek)}</p>
                                            <p className="text-muted-foreground">{formatRupiah(weeklyTarget)}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground p-2 rounded-lg">
                                        Atur target mingguan Anda di halaman profil untuk melihat progress.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}

    
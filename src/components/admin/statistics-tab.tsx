
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, BarChart4 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatAngka = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
}

const formatChartYAxis = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} Jt`;
  }
  return value.toLocaleString('id-ID');
}

const COLORS = {
  acc: 'bg-[hsl(var(--status-terkirim))]',
  batal: 'bg-[hsl(var(--status-batal))]',
  baru: 'bg-blue-500',
  eks: 'bg-purple-500',
  langgan: 'bg-orange-500',
};

export function StatisticsTab() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (authUser?.role !== 'admin') {
      setLoading(false);
      setPermissionError(true);
      return;
    }

    // For admin, query the whole collection. This should be allowed by security rules.
    const q = query(collection(db, 'konsumen'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setPermissionError(false);
        const clientsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            tanggal: data.tanggal.toDate(),
          } as Client;
        });
        setClients(clientsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching client data for admin stats: ", error);
        if (error.code === 'permission-denied') {
            setPermissionError(true);
            toast({
              variant: 'destructive',
              title: 'Akses Ditolak',
              description: 'Anda tidak memiliki izin untuk melihat semua statistik klien. Hubungi developer untuk menyesuaikan Aturan Keamanan Firestore.'
            });
        } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: error.message || 'Gagal memuat statistik klien.'
            });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, toast]);

  const { stats, dailyOmset } = useMemo(() => {
    if (loading || clients.length === 0) return { stats: { totalOrder: 0, totalAcc: 0, totalBatal: 0, totalKonsumen: 0, konsumenBaru: 0, konsumenEks: 0, konsumenLanggan: 0 }, dailyOmset: [] };

    const accClients = clients.filter((c) => ['TERKIRIM', 'PENDING'].includes(c.status));
    const batalClients = clients.filter((c) => c.status === 'BATAL');
    
    const totalAcc = accClients.reduce((acc, client) => acc + (client.omset || 0), 0);
    const totalBatal = batalClients.reduce((acc, client) => acc + (client.omset || 0), 0);
    const totalOrder = totalAcc + totalBatal;
    
    const relevantClients = clients.filter(c => ['TERKIRIM', 'PENDING', 'BATAL'].includes(c.status));
    const totalKonsumen = relevantClients.length;
    const konsumenBaru = relevantClients.filter(c => c.konsumen === 'BARU').length;
    const konsumenEks = relevantClients.filter(c => c.konsumen === 'EKS').length;
    const konsumenLanggan = relevantClients.filter(c => c.konsumen === 'LANGGAN').length;

    const omsetByDate: Record<string, number> = {};
    accClients.forEach(client => {
        const dateKey = format(client.tanggal, 'yyyy-MM-dd');
        omsetByDate[dateKey] = (omsetByDate[dateKey] || 0) + client.omset;
    });

    const chartData = Object.keys(omsetByDate)
        .sort()
        .map(date => ({
            date: format(new Date(date), 'dd/MM'),
            totalOmset: omsetByDate[date]
        }));


    return {
      stats: {
          totalOrder,
          totalAcc,
          totalBatal,
          totalKonsumen,
          konsumenBaru,
          konsumenEks,
          konsumenLanggan
      },
      dailyOmset: chartData
    };
  }, [clients, loading]);

  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (permissionError) {
    return (
        <div className="text-center text-destructive p-8 border border-destructive/50 rounded-lg">
            <h3 className="font-bold">Akses Ditolak</h3>
            <p className="text-sm">Anda tidak memiliki izin untuk melihat statistik ini. Mohon sesuaikan Aturan Keamanan Firestore Anda untuk mengizinkan admin membaca semua data 'konsumen'.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg rounded-2xl text-center">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Total Order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6 pt-0">
            <div>
                <p className="text-sm text-muted-foreground">Total Omset</p>
                <p className="text-4xl font-bold">{formatRupiah(stats.totalOrder)}</p>
            </div>

            <div className="w-full max-w-lg grid grid-cols-2 gap-4">
                {stats.totalAcc > 0 && (
                  <div className="flex flex-col items-center gap-2 p-3">
                      <div className={cn("w-3 h-3 rounded-full", COLORS.acc)}></div>
                      <div>
                          <p className="text-sm text-muted-foreground">Total ACC</p>
                          <p className="font-semibold">{formatRupiah(stats.totalAcc)}</p>
                      </div>
                  </div>
                )}
                 {stats.totalBatal > 0 && (
                    <div className="flex flex-col items-center gap-2 p-3">
                        <div className={cn("w-3 h-3 rounded-full", COLORS.batal)}></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Batal</p>
                            <p className="font-semibold">{formatRupiah(stats.totalBatal)}</p>
                        </div>
                    </div>
                 )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl text-center">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Total Konsumen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-6 pt-0">
                <div>
                    <p className="text-sm text-muted-foreground">Jumlah Konsumen</p>
                    <p className="text-4xl font-bold">{formatAngka(stats.totalKonsumen)}</p>
                </div>

                <div className="w-full max-w-lg grid grid-cols-3 justify-center gap-2 sm:gap-4">
                    {stats.konsumenBaru > 0 && (
                      <div className="flex flex-col items-center gap-2 p-3">
                          <div className={cn("w-3 h-3 rounded-full", COLORS.baru)}></div>
                          <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Baru</p>
                              <p className="font-semibold text-sm sm:text-base">{formatAngka(stats.konsumenBaru)}</p>
                          </div>
                      </div>
                    )}
                    {stats.konsumenEks > 0 && (
                      <div className="flex flex-col items-center gap-2 p-3">
                          <div className={cn("w-3 h-3 rounded-full", COLORS.eks)}></div>
                          <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Eks</p>
                              <p className="font-semibold text-sm sm:text-base">{formatAngka(stats.konsumenEks)}</p>
                          </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2 p-3">
                        <div className={cn("w-3 h-3 rounded-full", COLORS.langgan)}></div>
                        <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Langgan</p>
                            <p className="font-semibold text-sm sm:text-base">{formatAngka(stats.konsumenLanggan)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg rounded-2xl">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart4 />
                    Grafik Omset Harian
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full p-2">
                {dailyOmset.length > 0 ? (
                    <ResponsiveContainer>
                        <AreaChart data={dailyOmset}>
                            <defs>
                                <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--status-terkirim))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--status-terkirim))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatChartYAxis} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                    fontSize: '12px',
                                    borderRadius: 'var(--radius)'
                                }}
                                labelStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => [formatRupiah(value), "Total Omset"]}
                            />
                            <Area type="monotone" dataKey="totalOmset" stroke="hsl(var(--status-terkirim))" fill="url(#colorOmset)" strokeWidth={2} name="Total Omset" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex justify-center items-center text-muted-foreground text-sm">
                        Tidak ada data omset untuk ditampilkan.
                    </div>
                )}
            </CardContent>
        </Card>

    </div>
  );
}

    
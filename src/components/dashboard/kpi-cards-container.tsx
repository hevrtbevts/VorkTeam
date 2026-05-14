
'use client';

import React, { useMemo } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, Target, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { Client, User } from '@/lib/types';
import { Progress } from "@/components/ui/progress";

const formatRupiah = (value: number) => {
    if (isNaN(value) || value === null) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export function KpiCardsContainer({ 
  clients, 
  user,
  loading,
  className
}: { 
  clients: Client[], 
  user: User,
  loading: boolean,
  className?: string
}) {
    const { totalOmset, totalKonsumen, targetMingguan, omsetTerkirim, omsetPending } = useMemo(() => {
        const omsetTerkirim = clients
            .filter(c => c.status === 'TERKIRIM')
            .reduce((acc, client) => acc + client.omset, 0);

        const omsetPending = clients
            .filter(c => c.status === 'PENDING')
            .reduce((acc, client) => acc + client.omset, 0);

        const totalOmset = omsetTerkirim + omsetPending;
        const totalKonsumen = clients.length;
        const targetMingguan = user.weeklyTarget || 0;

        return { totalOmset, totalKonsumen, targetMingguan, omsetTerkirim, omsetPending };
    }, [clients, user]);

    const progress = targetMingguan > 0 ? Math.min((totalOmset / targetMingguan) * 100, 100) : 0;

    if (loading) {
        return (
            <div className={cn("grid gap-4 md:grid-cols-2", className)}>
                <Card className="flex justify-center items-center h-24 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
                <Card className="flex justify-center items-center h-24 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
                <Card className="md:col-span-2 flex justify-center items-center h-32 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
            </div>
        )
    }

    return (
        <div className={cn("grid gap-4 md:grid-cols-2", className)}>
            <Card className="rounded-xl p-4 flex flex-col justify-between bg-card-dark text-card-foreground-dark">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/20 rounded-full">
                       <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Omset Terkirim</span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatRupiah(omsetTerkirim)}</p>
            </Card>
            
            <Card className="rounded-xl p-4 flex flex-col justify-between bg-card-dark text-card-foreground-dark">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/20 rounded-full">
                        <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Omset Pending</span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatRupiah(omsetPending)}</p>
            </Card>

            <Card className="md:col-span-2 rounded-xl p-4 flex flex-col justify-between bg-primary text-primary-foreground">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black/20 rounded-full">
                           <Target className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">Total Omset</span>
                    </div>
                    <div className="p-2 bg-black/20 rounded-full">
                        <ArrowUp className="h-4 w-4" />
                    </div>
                </div>
                <p className="text-3xl font-bold my-2">{formatRupiah(totalOmset)}</p>
                {targetMingguan > 0 && (
                     <div className="space-y-1">
                        <Progress value={progress} className="h-1 bg-white/30" indicatorClassName="bg-white" />
                        <div className="flex justify-between text-xs font-medium text-white/80">
                            <span>{formatRupiah(totalOmset)}</span>
                            <span>{formatRupiah(targetMingguan)}</span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

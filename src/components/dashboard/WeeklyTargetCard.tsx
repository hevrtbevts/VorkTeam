
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import type { Client, User } from '@/lib/types';

const formatRupiah = (value: number) => {
    if (isNaN(value)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export function WeeklyTargetCard({ 
  user, 
  clientsForTarget, 
  loading,
  className
}: { 
  user: User, 
  clientsForTarget: Client[], 
  loading: boolean,
  className?: string
}) {
    const salesThisWeek = useMemo(() => {
        if (loading) return 0;
        return clientsForTarget.reduce((acc, client) => acc + client.omset, 0);
    }, [clientsForTarget, loading]);

    const weeklyTarget = user?.weeklyTarget || 0;
    const progress = weeklyTarget > 0 ? Math.min((salesThisWeek / weeklyTarget) * 100, 100) : 0;

    return (
        <Card className={cn("rounded-xl shadow-md", className)}>
            <CardContent className="p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-full min-h-[40px]">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : weeklyTarget > 0 ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline text-sm">
                            <h3 className="font-bold text-base">Target Mingguan</h3>
                        </div>
                        <Progress 
                            value={progress}
                            aria-label={`${progress.toFixed(0)}% dari target mingguan`} 
                            className="h-2"
                            indicatorClassName="bg-primary"
                        />
                         <div className="flex justify-between items-baseline text-xs font-medium">
                            <span className="text-primary">{formatRupiah(salesThisWeek)}</span>
                            <span className="text-muted-foreground">{formatRupiah(weeklyTarget)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-2 bg-muted rounded-md h-full flex items-center justify-center min-h-[40px]">
                        Atur target mingguan Anda di halaman profil.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

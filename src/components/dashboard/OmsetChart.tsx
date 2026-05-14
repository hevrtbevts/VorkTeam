
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MoreVertical, ArrowUpRight } from "lucide-react";
import { LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, AreaChart, Area } from 'recharts';
import { format, eachDayOfInterval, eachMonthOfInterval, isAfter } from 'date-fns';
import type { Client, User } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { FilterType } from '@/context/FilterContext';
import { useTheme } from 'next-themes';

const formatRupiah = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    
    // In light mode, the card is dark. In dark mode, the card is light(white).
    const isDarkMode = theme === 'dark';
    const cardBg = isDarkMode ? 'hsl(var(--card-dark))' : 'hsl(var(--card-dark))';
    const textColor = isDarkMode ? 'hsl(var(--card-foreground-dark))' : 'hsl(var(--card-foreground-dark))';
    
    return (
      <div className="p-3 text-xs backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-xs" style={{ backgroundColor: cardBg, color: textColor }}>
        <p className="font-bold mb-1">{label}</p>
        <p className="font-bold mb-2 text-black" style={{ color: textColor }}>{`Total Omset: ${formatRupiah(payload[0].value)}`}</p>
        {dataPoint.clients.length > 0 && (
          <div className="border-t border-border/50 pt-2 mt-2 space-y-1">
             <p className="font-bold opacity-70">Rincian:</p>
            {dataPoint.clients.map((client: any, index: number) => (
              <div key={index} className="flex justify-between gap-2">
                <span className="truncate opacity-80">{client.name}</span>
                <span className="font-semibold whitespace-nowrap">{formatRupiah(client.omset)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function OmsetChart({ 
    clients, 
    loading, 
    dateRange, 
    filterType,
    user,
    className 
}: { 
    clients: Client[], 
    loading: boolean, 
    dateRange: DateRange | undefined, 
    filterType: FilterType,
    user: User,
    className?: string 
}) {
    
    const chartData = useMemo(() => {
        if (loading || !clients || !dateRange?.from) {
             return { data: [], total: 0 };
        }

        const omset: Record<string, { total: number; clients: { name: string; omset: number }[] }> = {};
        
        clients.forEach(client => {
            const date = client.tanggal.toDate();
            let dateKey: string;
            if (filterType === 'year') {
                dateKey = format(date, 'MMM');
            } else {
                dateKey = format(date, 'yyyy-MM-dd');
            }
            if (!omset[dateKey]) {
                omset[dateKey] = { total: 0, clients: [] };
            }
            omset[dateKey].total += client.omset;
            omset[dateKey].clients.push({ name: client.nama, omset: client.omset });
        });

        const total = Object.values(omset).reduce((sum, val) => sum + val.total, 0);
        
        let data;
        
        if (filterType === 'year' && dateRange.to) {
            const interval = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
            data = interval.map(month => {
                const monthKey = format(month, 'MMM');
                return {
                    date: monthKey.toLowerCase(),
                    omset: omset[monthKey]?.total || 0,
                    clients: omset[monthKey]?.clients || [],
                };
            });
        } else if (dateRange.to) {
            const today = new Date();
            const endDate = isAfter(dateRange.to, today) ? today : dateRange.to;
            const interval = eachDayOfInterval({ start: dateRange.from, end: endDate });
            data = interval.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                return {
                    date: format(day, 'dd/MM'),
                    omset: omset[dateKey]?.total || 0,
                    clients: omset[dateKey]?.clients || [],
                };
            });
        } else {
             const allDateKeys = new Set(Object.keys(omset));
             data = Array.from(allDateKeys)
                .sort()
                .map(dateKey => ({
                    date: format(new Date(dateKey), 'dd/MM'),
                    omset: omset[dateKey]?.total || 0,
                    clients: omset[dateKey]?.clients || [],
                }));
        }

        return { data, total };

    }, [clients, loading, dateRange, filterType]);
    
    return (
        <div className={cn("rounded-xl", className)}>
            <div className="h-[150px] w-full">
                {loading ? <div className="h-full w-full flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : 
                chartData.data.length > 0 ? (
                <ResponsiveContainer>
                    <AreaChart data={chartData.data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                        <Area
                            type="monotone"
                            dataKey="omset"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fill="url(#chartGradient)"
                            dot={{
                                r: 4,
                                fill: "hsl(var(--primary))",
                                stroke: "hsl(var(--background))",
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                fill: "hsl(var(--primary))",
                                stroke: "hsl(var(--background))",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex justify-center items-center text-muted-foreground opacity-50 text-sm">
                        No sales data for this period.
                    </div>
                )}
            </div>
        </div>
    );
}

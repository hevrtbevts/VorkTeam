
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

interface BreakdownItem {
    label: string;
    value: string;
    percentage: number;
}

export interface KpiCardData {
    title: string;
    totalValue: string;
    colorClass: string;
    breakdown: BreakdownItem[];
}

export const KpiCard = ({ data }: { data: KpiCardData }) => {
    const { title, totalValue, colorClass, breakdown } = data;
    
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="font-bold text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
                <p className={cn("text-3xl font-bold", colorClass.replace('bg-','text-'))} style={{ color: `hsl(var(--${colorClass.match(/--(.*?)]/)?.[1]}))` }}>
                    {totalValue}
                </p>
                <div className="space-y-3">
                    {breakdown.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                                <span className="font-medium text-muted-foreground">{item.label}</span>
                                <span className="font-bold text-foreground">{item.value}</span>
                            </div>
                            <Progress value={item.percentage} indicatorClassName={colorClass} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

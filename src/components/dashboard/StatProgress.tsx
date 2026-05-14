
'use client';

import React from 'react';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';

const formatValue = (value: number, format: 'currency' | 'number') => {
    if (format === 'currency') {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(value);
    }
    return new Intl.NumberFormat('id-ID').format(value);
};

export const StatProgress = ({ label, value, percentage, format, colorClass }: {
    label: string;
    value: number;
    percentage: number;
    format: 'currency' | 'number';
    colorClass: string;
}) => {
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline text-xs">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground">{formatValue(value, format)}</span>
            </div>
            <Progress value={percentage} indicatorClassName={colorClass} />
        </div>
    );
};

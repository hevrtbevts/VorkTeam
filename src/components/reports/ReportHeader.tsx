
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  dateRangeDisplay: string;
  onExport: () => void;
  isExporting: boolean;
  children?: React.ReactNode; // For month picker, etc.
}

export function ReportHeader({ title, dateRangeDisplay, onExport, isExporting, children }: ReportHeaderProps) {
  return (
    <div className='flex flex-col gap-4 mb-4'>
      <div className='flex items-center justify-between'>
        {children ? (
          children
        ) : (
          <div className='flex-grow text-center'>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-lg text-muted-foreground">{dateRangeDisplay}</p>
          </div>
        )}
        <Button onClick={onExport} variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          <span className="ml-2">Export JPG</span>
        </Button>
      </div>
    </div>
  );
}

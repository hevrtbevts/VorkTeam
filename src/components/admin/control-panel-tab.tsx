
'use client';

import React, { useContext, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { FilterContext } from '@/context/FilterContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function MonthYearPicker({ date, onChange, className }: { date: Date, onChange: (date: Date) => void, className?: string }) {
    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Button variant="outline" size="icon" onClick={() => onChange(subMonths(date, 1))}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-center font-semibold w-32">
                {format(date, 'MMMM yyyy', { locale: localeId })}
            </span>
            <Button variant="outline" size="icon" onClick={() => onChange(addMonths(date, 1))}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}


function MonthRangeSettings() {
  const { refreshAdminSettings, setFilterType } = useContext(FilterContext);
  const { toast } = useToast();
  
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(undefined);
  const [targetMonth, setTargetMonth] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handleSaveForMonth = async () => {
    if (!localDateRange?.from) {
        toast({ variant: 'destructive', title: 'Error', description: 'Harap pilih rentang tanggal terlebih dahulu.' });
        return;
    }
    const endDate = localDateRange.to || localDateRange.from;
    const docId = format(targetMonth, 'yyyy_MM');

    setIsSaving(true);
    try {
        const settingsDocRef = doc(db, 'settings_bulan_ini', docId);
        await setDoc(settingsDocRef, {
            start: Timestamp.fromDate(localDateRange.from),
            end: Timestamp.fromDate(endDate),
            updatedAt: Timestamp.now(),
        });
        toast({ title: 'Sukses!', description: `Rentang tanggal berhasil disimpan untuk ${format(targetMonth, 'MMMM yyyy', { locale: localeId })}.` });
    } catch (error: any) {
        console.error("Error saving month range:", error);
        toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: error.message || 'Gagal menyimpan pengaturan.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleActivateMonth = async () => {
     if (!localDateRange?.from) {
        toast({ variant: 'destructive', title: 'Error', description: 'Harap pilih rentang tanggal untuk diaktifkan.'});
        return;
    }
    const endDate = localDateRange.to || localDateRange.from;
    setIsActivating(true);
    try {
        const panelDocRef = doc(db, 'settings', 'panel');
        await setDoc(panelDocRef, {
            bulan_aktif: {
                start: Timestamp.fromDate(localDateRange.from),
                end: Timestamp.fromDate(endDate),
            },
            updatedAt: Timestamp.now(),
        }, { merge: true });

        toast({ title: 'Bulan Diaktifkan!', description: `Rentang ${format(localDateRange.from, "d MMM")} - ${format(endDate, "d MMM yyyy")} sekarang aktif.` });
        
        // Trigger context refresh
        setFilterType('month');
        refreshAdminSettings();

    } catch (error: any) {
         console.error("Error activating month range:", error);
        toast({ variant: 'destructive', title: 'Gagal Aktivasi', description: error.message || 'Gagal mengaktifkan bulan.'});
    } finally {
        setIsActivating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
       <Label htmlFor="date-range-picker" className="font-semibold">1. Pilih Rentang Tanggal</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range-picker"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !localDateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {localDateRange?.from ? (
                localDateRange.to ? (
                  <>
                    {format(localDateRange.from, "d MMM yyyy", { locale: localeId })} -{" "}
                    {format(localDateRange.to, "d MMM yyyy", { locale: localeId })}
                  </>
                ) : (
                  format(localDateRange.from, "d MMM yyyy", { locale: localeId })
                )
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={localDateRange?.from}
              selected={localDateRange}
              onSelect={setLocalDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label className="font-semibold">2. Simpan Rentang Sebagai Bulan</Label>
        <div className="flex flex-col sm:flex-row gap-2">
            <MonthYearPicker date={targetMonth} onChange={setTargetMonth} className="flex-shrink-0" />
            <Button onClick={handleSaveForMonth} disabled={isSaving || !localDateRange?.from} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan untuk {format(targetMonth, 'MMMM')}
            </Button>
        </div>
      </div>

       <div className="space-y-2 pt-4 border-t">
        <Label className="font-semibold">3. Aktifkan Rentang</Label>
         <p className="text-sm text-muted-foreground">Jadikan rentang yang dipilih di atas sebagai periode "Bulan Ini" di Dashboard.</p>
        <Button onClick={handleActivateMonth} disabled={isActivating || !localDateRange?.from} className="w-full" variant="secondary">
            {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Jadikan Bulan Aktif
        </Button>
      </div>

    </div>
  );
}


export function ControlPanelTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <MonthRangeSettings />
      </CardContent>
    </Card>
  );
}

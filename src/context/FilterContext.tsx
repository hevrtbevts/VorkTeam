
'use client';

import React, { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type FilterType = 'week' | 'month' | 'year' | 'all';

interface AdminSettings {
  bulan_aktif: {
    start: Date;
    end: Date;
  };
}

interface FilterContextType {
  dateRange: DateRange | undefined;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  adminSettings: AdminSettings | null;
  dateRangeDisplay: string;
  refreshAdminSettings: () => void;
}

const getFilterDateRange = (filter: FilterType, adminRange?: { start: Date; end: Date }): DateRange | undefined => {
  const today = new Date();
  
  switch (filter) {
    case "week":
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    case "month":
      return adminRange 
        ? { from: adminRange.start, to: adminRange.end } 
        : { from: startOfMonth(today), to: endOfMonth(today) };
    case "year":
      return { from: startOfYear(today), to: endOfYear(today) };
    case "all":
    default:
      return undefined;
  }
};

export const FilterContext = createContext<FilterContextType>({
  dateRange: undefined,
  filterType: 'month',
  setFilterType: () => {},
  adminSettings: null,
  dateRangeDisplay: 'Bulan Ini',
  refreshAdminSettings: () => {},
});

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filterType, setFilterTypeState] = useState<FilterType>('month');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);

  const fetchAdminSettings = useCallback(async () => {
    const settingsDocRef = doc(db, 'settings', 'panel');
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = {
        bulan_aktif: {
          start: data.bulan_aktif.start.toDate(),
          end: data.bulan_aktif.end.toDate(),
        }
      };
      setAdminSettings(settings);
    } else {
      setAdminSettings(null); // No settings found
    }
  }, []);

  useEffect(() => {
    fetchAdminSettings();
    const settingsDocRef = doc(db, 'settings', 'panel');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
       if (docSnap.exists()) {
        const data = docSnap.data();
        const settings = {
          bulan_aktif: {
            start: data.bulan_aktif.start.toDate(),
            end: data.bulan_aktif.end.toDate(),
          }
        };
        setAdminSettings(settings);
      } else {
        setAdminSettings(null);
      }
    });

    return () => unsubscribe();

  }, [fetchAdminSettings]);
  
  const refreshAdminSettings = useCallback(() => {
    fetchAdminSettings();
  }, [fetchAdminSettings]);

  useEffect(() => {
    const newRange = getFilterDateRange(filterType, adminSettings?.bulan_aktif);
    setDateRange(newRange);
  }, [filterType, adminSettings]);

  const dateRangeDisplay = useMemo(() => {
    if (!dateRange || !dateRange.from) {
        if (filterType === 'all') return 'Semua Waktu';
        return 'Memuat...';
    }

    if (filterType === 'week') {
        const end = dateRange.to || dateRange.from;
        return `${format(dateRange.from, 'd MMM', { locale: localeId })} - ${format(end, 'd MMM yyyy', { locale: localeId })}`;
    }
    if (filterType === 'year') {
        return format(dateRange.from, 'yyyy', { locale: localeId });
    }
    if (filterType === 'month') {
        const end = dateRange.to || dateRange.from;
        return `${format(dateRange.from, 'd MMM', { locale: localeId })} - ${format(end, 'd MMM yyyy', { locale: localeId })}`;
    }
    
    // Fallback for 'all' or other cases
    return 'Semua Waktu';
    
  }, [filterType, dateRange]);

  const setFilterType = (type: FilterType) => {
    setFilterTypeState(type);
  };

  const contextValue = { 
    dateRange, 
    filterType, 
    setFilterType, 
    adminSettings, 
    dateRangeDisplay,
    refreshAdminSettings,
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

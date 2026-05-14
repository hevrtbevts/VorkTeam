
'use client';

import { useMemo } from 'react';
import type { Client } from '@/lib/types';
import {
  DollarSign,
  Phone,
  Calendar,
  Package,
  Home,
  Hash,
  Clock,
  User as UserIcon,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label?: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3 text-muted-foreground">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="flex flex-col">
            {label && <span className="text-xs">{label}</span>}
            <span className="font-medium text-foreground break-all">{value}</span>
        </div>
    </div>
);

const toDate = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date(); // Return current date as a fallback for invalid timestamp
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Handle ISO string from server
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
        return d;
    }
  }
  // Fallback for invalid or unexpected formats
  return new Date();
}

export const ClientDetailContent = ({ client }: { client: Client }) => {
    const latestLog = useMemo(() => {
        if (!client.activityLogs || client.activityLogs.length === 0) {
            return null;
        }
        return [...client.activityLogs].sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime())[0];
    }, [client.activityLogs]);

    return (
    <div className="space-y-4">
        <DetailRow icon={Phone} value={client.nomor || '-'} />
        <DetailRow icon={Home} value={client.alamat} />
        <DetailRow icon={Package} value={client.barang || '-'} />
        <DetailRow icon={UserIcon} value={client.konsumen} />

        <hr className="my-4" />

        <div className="grid grid-cols-2 gap-4">
             <DetailRow 
                icon={DollarSign} 
                label="Angsuran/hari" 
                value={client.angsuran.toLocaleString('id-ID')}
            />
            <DetailRow 
                icon={Clock} 
                label="Tenor (Hari)" 
                value={client.tenor.toLocaleString('id-ID')} 
            />
        </div>
        <DetailRow 
            icon={Hash} 
            label="Total Omset" 
            value={`Rp ${client.omset.toLocaleString('id-ID')}`} 
        />
        
        {client.keterangan && (
            <div className="text-sm text-muted-foreground pt-2 mt-4 border-t">
                <p className='font-bold text-foreground'>Keterangan Pending/Batal:</p>
                <p className="italic">"{client.keterangan}"</p>
            </div>
        )}

        <hr className="my-4" />

        <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Transaksi: {format(toDate(client.tanggal), 'd MMM yyyy', { locale: id })}</span>
            </div>
            {latestLog && (
                 <div className="flex items-start gap-2.5 text-muted-foreground">
                    <History className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                        <span>
                            Update: {format(toDate(latestLog.timestamp), 'd MMM yyyy, HH:mm', { locale: id })}
                        </span>
                        <span className="font-semibold text-foreground"> {latestLog.oldStatus} → {latestLog.newStatus}</span>
                        {latestLog.keterangan && <span className="italic">"{latestLog.keterangan}"</span>}
                    </div>
                </div>
            )}
        </div>
    </div>
    );
};

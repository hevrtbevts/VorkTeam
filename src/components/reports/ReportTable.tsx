
'use client';

import React from 'react';
import type { Client } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { StatusBadge } from '../ui/status-badge';
import { cn } from '@/lib/utils';

const formatRupiah = (value: number) => {
    if (isNaN(value)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};


interface ReportTableProps {
  clients: Client[];
}

export function ReportTable({ clients }: ReportTableProps) {
  return (
    <div className="overflow-x-auto mt-6 border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/80 border-b">
              <TableHead className="text-center text-muted-foreground uppercase">Nama</TableHead>
              <TableHead className="text-center text-muted-foreground uppercase w-[100px]">Konsumen</TableHead>
              <TableHead className="text-center text-muted-foreground uppercase">Barang</TableHead>
              <TableHead className="text-center text-muted-foreground uppercase">Omset</TableHead>
              <TableHead className="text-center text-muted-foreground uppercase">Status</TableHead>
              <TableHead className="text-center text-muted-foreground uppercase">Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? clients.map((client, index) => (
              <TableRow 
                key={client.id} 
                className={cn(
                  "border-b last:border-b-0 hover:bg-muted/50",
                  index % 2 !== 0 && "bg-muted/30" // Zebra stripe for odd rows
                )}
              >
                <TableCell className="font-medium text-center whitespace-nowrap py-3 px-4 text-foreground align-middle">{client.nama}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-3 px-4 w-[100px] text-muted-foreground align-middle">{client.konsumen}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-3 px-4 text-muted-foreground align-middle">{client.barang}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-3 px-4 text-foreground font-semibold align-middle">{formatRupiah(client.omset)}</TableCell>
                <TableCell className="text-center whitespace-nowrap py-3 px-4 align-middle">
                  <StatusBadge status={client.status} variant="text" />
                </TableCell>
                <TableCell className="text-center align-middle py-1 px-2 h-full">
                  <textarea 
                    rows={1} 
                    className="keterangan-input w-full p-2 text-center resize-none border-0 bg-transparent shadow-none text-muted-foreground placeholder:text-muted-foreground/50" 
                    defaultValue={client.keterangan || ''}
                  />
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground align-middle">
                  Tidak ada data untuk periode ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  );
}

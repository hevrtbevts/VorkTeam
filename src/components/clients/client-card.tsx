
'use client';

import React from 'react';
import type { Client, ClientStatus, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  MapPin,
  Trash2,
  Edit2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '../ui/status-badge';

export const ClientCard = ({ 
    client,
    user,
    onCardClick, 
    onStatusChange,
    statusOptions,
    onEdit,
    onDelete
}: { 
    client: Client, 
    user: User,
    onCardClick: (client: Client) => void,
    onStatusChange: (client: Client, newStatus: ClientStatus) => void,
    statusOptions: ClientStatus[],
    onEdit: (client: Client) => void,
    onDelete: (client: Client) => void,
}) => {
  const { toast } = useToast();

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.nomor && client.nomor !== '-') {
      const phoneNumber = client.nomor.startsWith('0') ? '62' + client.nomor.substring(1) : client.nomor;
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      toast({ variant: 'destructive', description: 'Nomor HP klien tidak tersedia.' });
    }
  };

  const handleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.alamat)}`, '_blank');
  };
  
  const handleDeleteClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(client);
  }

  const truncatedAddress = client.alamat.length > 80
    ? `${client.alamat.substring(0, 80)}...`
    : client.alamat;

  const truncatedBarang = client.barang && client.barang.length > 40
    ? `${client.barang.substring(0, 40)}...`
    : client.barang;

  const StatusControl = () => {
    return (
      <Select
        value={client.status}
        onValueChange={(newStatus: ClientStatus) => onStatusChange(client, newStatus)}
      >
        <SelectTrigger
          onClick={handleActionClick}
          className="w-auto h-auto p-0 border-none focus:ring-0 focus:ring-offset-0"
          aria-label={`Current status: ${client.status}`}
        >
          <SelectValue asChild>
            <StatusBadge status={client.status} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent onClick={handleActionClick}>
          {statusOptions.map(status => (
            <SelectItem key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Card 
      className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer w-full"
      onClick={() => onCardClick(client)}
    >
      <div className="p-4 flex flex-col space-y-3">
        {/* Nama & Aksi */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
          <p className="font-bold text-base md:text-lg uppercase truncate pr-2">{client.nama}</p>

          <div className="flex items-center justify-between md:justify-end gap-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={(e) => { handleActionClick(e); onEdit(client) }}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={handleWhatsApp}>
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7" onClick={handleMaps}>
                <MapPin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-7 md:w-7 text-destructive" onClick={handleDeleteClient}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <StatusControl />
          </div>
        </div>

        {/* Barang & Alamat */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="truncate">{truncatedBarang || '-'}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{truncatedAddress}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

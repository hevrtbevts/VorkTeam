
'use client';

import React from 'react';
import type { Client, ClientStatus } from '@/lib/types';
import { GlobalModal } from '@/components/ui/global-modal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface StatusUpdateModalsProps {
    modalType: 'ACC' | 'DI PENDING' | 'BATAL' | null;
    onClose: () => void;
    isSubmitting: boolean;
    clientForUpdate: Client | null;
    keterangan: string;
    onKeteranganChange: (keterangan: string) => void;
    onSubmit: (finalStatus: ClientStatus) => void;
}

const getPlaceholderForKeterangan = (status: ClientStatus | null | undefined, modalType: string | null) => {
    if (modalType === 'BATAL' && status === 'SURVEY') {
        return "Contoh: Klien tidak memenuhi syarat, lokasi di luar jangkauan...";
    }
    return "Contoh: Klien meminta untuk dihubungi kembali bulan depan...";
};

export function StatusUpdateModals({
    modalType,
    onClose,
    isSubmitting,
    clientForUpdate,
    keterangan,
    onKeteranganChange,
    onSubmit
}: StatusUpdateModalsProps) {

    if (!modalType) return null;

    if (modalType === 'ACC') {
        return (
            <GlobalModal isOpen={true} onClose={onClose} className="sm:max-w-sm">
                <div className='p-6'>
                    <div className='text-center'>
                        <h2 className="text-xl font-bold">Konfirmasi ACC</h2>
                        <p className="text-muted-foreground mt-2 text-sm">Pilih status akhir untuk klien <span className="font-bold uppercase">{clientForUpdate?.nama}</span>.</p>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <Button className='flex-1' onClick={() => onSubmit('TERKIRIM')} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Terkirim
                        </Button>
                        <Button className='flex-1' variant='secondary' onClick={() => onSubmit('PENDING')} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pending
                        </Button>
                    </div>
                </div>
            </GlobalModal>
        );
    }

    if (modalType === 'DI PENDING' || modalType === 'BATAL') {
        const isBatal = modalType === 'BATAL';
        return (
            <GlobalModal isOpen={true} onClose={onClose} className="sm:max-w-sm">
                <div className='p-6'>
                    <div className='text-center'>
                        <h2 className="text-xl font-bold">{isBatal ? 'Batalkan Klien' : 'Arsipkan Klien'}</h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                        Berikan alasan mengapa klien <span className="font-bold uppercase">{clientForUpdate?.nama}</span> {isBatal ? 'dibatalkan' : 'di-pending'}.
                        </p>
                    </div>
                    <div className="space-y-4 mt-4">
                        <Textarea
                            placeholder={getPlaceholderForKeterangan(clientForUpdate?.status, modalType)}
                            value={keterangan}
                            onChange={(e) => onKeteranganChange(e.target.value)}
                            rows={4}
                        />
                        <Button 
                            className='w-full' 
                            onClick={() => onSubmit(isBatal ? 'BATAL' : 'DI PENDING')} 
                            disabled={isSubmitting || !keterangan}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isBatal ? 'Konfirmasi Batal' : 'Simpan ke Arsip'}
                        </Button>
                    </div>
                </div>
            </GlobalModal>
        );
    }
    
    return null;
}


'use client';

import React from 'react';
import type { Client } from '@/lib/types';
import { GlobalModal } from '@/components/ui/global-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientDetailContent } from '@/components/clients/client-detail-content';

interface ClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
}

export function ClientDetailModal({ isOpen, onClose, client }: ClientDetailModalProps) {
    return (
        <GlobalModal isOpen={isOpen} onClose={onClose} className="sm:max-w-sm">
            <div className="p-6 pt-12">
               <ScrollArea className="max-h-[calc(80vh-6rem)] pr-4 -mr-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{client.nama}</h2>
                    </div>
                    <div className="p-4 text-sm space-y-2 mt-4">
                        <ClientDetailContent client={client} />
                    </div>
              </ScrollArea>
            </div>
        </GlobalModal>
    );
}

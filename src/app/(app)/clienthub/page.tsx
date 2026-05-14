
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Client, ClientStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateClientStatus, deleteClient } from '@/services/client-service';
import { AddNewClientButton, AddNewClientModal } from '@/components/clients/add-new-client';

import { ClientSearchBar } from '@/components/clients/ClientSearchBar';
import { ClientTabs } from '@/components/clients/ClientTabs';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { StatusUpdateModals } from '@/components/clients/StatusUpdateModals';
import { DeleteClientDialog } from '@/components/clients/delete-client-dialog';


export default function ClientHubPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for modals
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientForUpdate, setClientForUpdate] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'ACC' | 'DI PENDING' | 'BATAL' | null>(null);

  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditClick = useCallback((client: Client) => {
    setClientToEdit(client);
    setIsEditModalOpen(true);
  }, []);

  const handleCardClick = useCallback((client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  }, []);

  const handleStatusChange = useCallback((client: Client, newStatus: ClientStatus) => {
    if (!user) return;
    setClientForUpdate(client);
    if (newStatus === 'ACC' || newStatus === 'DI PENDING' || newStatus === 'BATAL') {
        setStatusModalType(newStatus);
    } else {
        updateClientStatus(client.id, newStatus, user, client.status);
        toast({
            title: 'Sukses!',
            description: `Status klien ${client.nama} berhasil diubah.`,
        });
    }
  }, [user, toast]);

  const handleDeleteClick = useCallback((client: Client) => {
    setClientToDelete(client);
    setIsDeleteAlertOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedClient(null);
    setClientForUpdate(null);
    setClientToEdit(null);
    setClientToDelete(null);
    setStatusModalType(null);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteAlertOpen(false);
    setKeterangan('');
  }, []);

  const handleStatusModalSubmit = async (finalStatus: ClientStatus) => {
    if (!clientForUpdate || !user) return;

    if ((finalStatus === 'DI PENDING' || finalStatus === 'BATAL') && !keterangan) {
        toast({ variant: 'destructive', title: 'Error', description: 'Keterangan tidak boleh kosong.' });
        return;
    }

    setIsSubmitting(true);
    try {
        await updateClientStatus(clientForUpdate.id, finalStatus, user, clientForUpdate.status, keterangan || undefined);
        toast({
            title: 'Sukses!',
            description: `Klien ${clientForUpdate.nama} berhasil dipindahkan ke ${finalStatus}.`,
        });
        closeModal();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal!', description: 'Gagal memindahkan klien.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsSubmitting(true);
    try {
        await deleteClient(clientToDelete.id);
        toast({
            title: 'Sukses!',
            description: `Klien ${clientToDelete.nama} berhasil dihapus.`,
        });
        closeModal();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal!', description: 'Gagal menghapus klien.' });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (!user) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ClientSearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

      <ClientTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        user={user}
        onCardClick={handleCardClick}
        onStatusChange={handleStatusChange}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
      
      <div className="fixed bottom-20 right-4 z-40">
        <AddNewClientButton user={user} isFab />
      </div>

      {selectedClient && (
        <ClientDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeModal}
          client={selectedClient}
        />
      )}

      {isEditModalOpen && clientToEdit && (
        <AddNewClientModal
            isOpen={isEditModalOpen}
            onClose={closeModal}
            clientToEdit={clientToEdit}
            user={user}
        />
      )}

      <StatusUpdateModals
        modalType={statusModalType}
        onClose={closeModal}
        isSubmitting={isSubmitting}
        clientForUpdate={clientForUpdate}
        keterangan={keterangan}
        onKeteranganChange={setKeterangan}
        onSubmit={handleStatusModalSubmit}
      />

      {clientToDelete && (
          <DeleteClientDialog 
            isOpen={isDeleteAlertOpen}
            onClose={closeModal}
            onConfirm={handleConfirmDelete}
            clientName={clientToDelete.nama}
            isSubmitting={isSubmitting}
          />
      )}
    </div>
  );
}

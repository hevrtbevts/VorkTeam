
'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  isSubmitting: boolean;
}

export function DeleteClientDialog({ isOpen, onClose, onConfirm, clientName, isSubmitting }: DeleteClientDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Aksi ini tidak dapat dibatalkan. Ini akan menghapus data klien{' '}
            <span className="font-bold uppercase">{clientName}</span> secara permanen dari server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus Klien
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

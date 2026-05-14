
'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ClipboardPaste } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function JsonPasteButton() {
  const [isPasting, setIsPasting] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const { setValue } = useFormContext();
  const { toast } = useToast();

  const handleApplyJson = () => {
    try {
      const data = JSON.parse(jsonText);
      
      // Map JSON to form fields
      if (data.tanggal) setValue('tanggal', new Date(data.tanggal), { shouldValidate: true });
      if (data.Nama) setValue('nama', data.Nama.toUpperCase(), { shouldValidate: true });
      if (data['Nomor Hp']) setValue('nomor', data['Nomor Hp'], { shouldValidate: true });
      if (data.Alamat && data.Alamat.Usaha) {
         // Combining both address fields into one, as the form has one address field
         const fullAddress = `${data.Alamat.Usaha}, ${data.Alamat['Alamat Usaha'] || ''}`.trim().toUpperCase();
         setValue('alamat', fullAddress, { shouldValidate: true });
      }
      if (data.Barang) setValue('barang', data.Barang.toUpperCase(), { shouldValidate: true });
      if (data.Angsuran) setValue('angsuran', Number(data.Angsuran), { shouldValidate: true });
      if (data.Tenor) setValue('tenor', Number(data.Tenor), { shouldValidate: true });
      
      toast({
        title: 'Sukses!',
        description: 'Form berhasil diisi dari data JSON.',
      });
      setIsPasting(false);
      setJsonText('');
    } catch (error) {
      console.error('Invalid JSON:', error);
      toast({
        variant: 'destructive',
        title: 'Error!',
        description: 'Format JSON tidak valid. Silakan periksa kembali.',
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full mb-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsPasting(!isPasting)}
        className="rounded-full"
      >
        <ClipboardPaste className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isPasting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 w-full"
          >
            <div className="space-y-2">
              <Textarea
                placeholder='Paste JSON di sini...'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="min-h-[150px] text-sm"
              />
              {jsonText && (
                <Button type="button" onClick={handleApplyJson} className="w-full">
                  Apply JSON
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

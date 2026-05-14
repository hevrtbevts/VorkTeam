
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CalendarIcon, Loader2, Plus, PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { addClientToPipeline, updateClient } from '@/services/client-service'
import type { User, Client } from '@/lib/types'
import { GlobalModal } from '../ui/global-modal'
import { AlamatInput } from './alamat-input'
import { JsonPasteButton } from './json-paste-button'
import { RupiahInput } from '../ui/rupiah-input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const clientSchema = z.object({
  tanggal: z.date({ required_error: 'Tanggal wajib diisi.' }),
  nama: z.string().min(2, 'Nama minimal 2 karakter.'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter.'),
  nomor: z.preprocess(
    (val) => String(val).replace(/[^0-9]/g, ''),
    z.string().optional().refine(val => {
        if (!val || val.trim() === '') return true;
        return /^08[0-9]{8,}$/.test(val);
    }, {
        message: 'Jika diisi, masukkan nomor HP Indonesia yang valid (e.g., 0812...).'
    })
  ).optional(),
  konsumen: z.enum(['BARU', 'EKS', 'LANGGAN']).optional(),
  barang: z.string().optional(),
  angsuran: z.union([z.string(), z.number()]).transform(v => Number(v) || 0).optional(),
  tenor: z.union([z.string(), z.number()]).transform(v => Number(v) || 0).optional(),
  tenorUnit: z.enum(['hari', 'bulan']).default('hari'),
});


type ClientFormData = z.infer<typeof clientSchema>

interface AddNewClientProps {
  user: User;
  isFab?: boolean;
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export function AddNewClientButton({ user, isFab = false }: { user: User, isFab?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const triggerButton = isFab ? (
    <Button onClick={() => setIsOpen(true)} className="rounded-full w-14 h-14 shadow-lg">
      <Plus className="h-6 w-6" />
    </Button>
  ) : (
    <Button onClick={() => setIsOpen(true)}>
      <PlusCircle className="mr-2" />
      Tambah Klien
    </Button>
  )

  return (
    <>
      {triggerButton}
      <AddNewClientModal 
        user={user} 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}


export function AddNewClientModal({ user, isOpen, onClose, clientToEdit }: AddNewClientProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const isEditMode = !!clientToEdit;

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      tanggal: new Date(),
      nama: '',
      alamat: '',
      nomor: '',
      konsumen: 'BARU',
      barang: '',
      angsuran: '',
      tenor: '',
      tenorUnit: 'hari',
    },
  })
  
  useEffect(() => {
    if (isEditMode && clientToEdit) {
      form.reset({
        tanggal: clientToEdit.tanggal.toDate(),
        nama: clientToEdit.nama,
        alamat: clientToEdit.alamat,
        nomor: clientToEdit.nomor || '',
        konsumen: clientToEdit.konsumen,
        barang: clientToEdit.barang || '',
        angsuran: clientToEdit.angsuran || '',
        tenor: clientToEdit.tenor || '',
        tenorUnit: clientToEdit.tenorUnit || 'hari',
      });
    } else {
      form.reset({
        tanggal: new Date(),
        nama: '',
        alamat: '',
        nomor: '',
        konsumen: 'BARU',
        barang: '',
        angsuran: '',
        tenor: '',
        tenorUnit: 'hari',
      });
    }
  }, [clientToEdit, isEditMode, form, isOpen]);


  const onSubmit = async (values: ClientFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
        nama: values.nama.toUpperCase(),
        alamat: values.alamat.toUpperCase(),
        barang: (values.barang || '').toUpperCase(),
        nomor: values.nomor || '-',
        angsuran: Number(values.angsuran) || 0,
        tenor: Number(values.tenor) || 0,
        konsumen: values.konsumen || 'BARU',
        tenorUnit: values.tenorUnit || 'hari',
      }
      
      if (isEditMode && clientToEdit) {
          await updateClient(clientToEdit.id, payload);
          toast({
            title: 'Sukses!',
            description: 'Data klien berhasil diperbarui.',
          })
      } else {
        await addClientToPipeline(payload, user.id)
        toast({
          title: 'Sukses!',
          description: 'Klien baru berhasil ditambahkan ke pipeline.',
        })
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting client data:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal!',
        description: `Terjadi kesalahan saat ${isEditMode ? 'memperbarui' : 'menambahkan'} klien.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} className="sm:max-w-lg flex flex-col">
      <div className="p-6 pt-12 text-center">
        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Klien' : 'Tambah Klien Baru'}</h2>
      </div>

      <div className="flex-grow overflow-y-auto px-6 pb-6 -mt-4">
        <FormProvider {...form}>
          {!isEditMode && <JsonPasteButton />}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mt-4">
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'cccc, d MMMM yyyy', { locale: id })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                            }
                            setIsCalendarOpen(false)
                          }}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor HP <span className="text-muted-foreground text-xs">(Opsional)</span></FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="alamat"
                render={() => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <AlamatInput />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="konsumen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konsumen</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'BARU'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BARU">BARU</SelectItem>
                          <SelectItem value="EKS">EKS</SelectItem>
                          <SelectItem value="LANGGAN">LANGGAN</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barang</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="angsuran"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Angsuran</FormLabel>
                      <FormControl>
                        <RupiahInput
                          value={field.value || ''}
                          onValueChange={(value) => field.onChange(value)}
                          placeholder="Rp 0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="space-y-2">
                    <FormLabel>Tenor</FormLabel>
                    <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="tenor"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                <FormControl>
                                    <Input type="number" {...field} placeholder="0" value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tenorUnit"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex items-center space-x-2 h-10"
                                    >
                                        <FormItem className="flex items-center space-x-1 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="hari" />
                                            </FormControl>
                                            <FormLabel className="font-normal text-xs">Hari</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-1 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="bulan" />
                                            </FormControl>
                                            <FormLabel className="font-normal text-xs">Bulan</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </div>
    </GlobalModal>
  )
}

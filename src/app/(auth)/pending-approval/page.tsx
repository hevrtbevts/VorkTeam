'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updatePendingUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Nama wajib diisi.'),
  phoneNumber: z.string()
    .min(10, 'Nomor WhatsApp minimal 10 digit.')
    .regex(/^[0-9]+$/, 'Hanya boleh berisi angka.')
});

type FormData = z.infer<typeof formSchema>;

export default function PendingApprovalPage() {
  const { user, firebaseUser, loading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataSubmitted, setDataSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phoneNumber: ''
    }
  });

  const needsToFillForm =
    user && (!user.name || !user.phoneNumber || user.name === 'Pengguna Baru');

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name !== 'Pengguna Baru' ? user.name : '',
        phoneNumber: user.phoneNumber || ''
      });
      if (user.status === 'approved') {
        setIsApproved(true);
      }
    }
  }, [user, form]);

  useEffect(() => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      const userData = snapshot.data() as User;
      console.log('🔁 Snapshot:', userData);
      if (userData?.status === 'approved') {
        setIsApproved(true);
      }
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (isApproved) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isApproved, router]);

  const onSubmit = async (values: FormData) => {
    if (!firebaseUser || !user) return;
    setIsSubmitting(true);
    try {
      await updatePendingUser(firebaseUser.uid, values);
      toast({
        title: 'Berhasil!',
        description: 'Data Anda telah dikirim dan akan segera ditinjau oleh admin.'
      });
      setDataSubmitted(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Gagal!',
        description: 'Gagal mengirim data. Silakan coba lagi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const ApprovalScreen = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
      <div className="w-full max-w-md p-8 flex flex-col items-center text-center text-white">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-white/80">{description}</p>}
        <div className="mt-8 w-full">
            {children}
        </div>
      </div>
  );

  if (isApproved) {
    return (
      <ApprovalScreen title="Pendaftaran Disetujui!">
        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
        <p className="text-white/80 mt-4">
          Anda akan diarahkan ke dashboard secara otomatis...
        </p>
      </ApprovalScreen>
    );
  }

  return (
    <ApprovalScreen 
        title={needsToFillForm ? 'Lengkapi Data Diri' : 'Akun Anda Sedang Ditinjau'}
        description={!needsToFillForm ? `Terima kasih, ${user?.name}. Akun Anda sedang menunggu persetujuan.` : undefined}
    >
        {needsToFillForm && !dataSubmitted ? (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                    <Input {...field} className="bg-white/10 border-white/20 focus:bg-white/20" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                    <Input type="tel" {...field} className="bg-white/10 border-white/20 focus:bg-white/20" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim & Minta Persetujuan
            </Button>
            </form>
        </Form>
        ) : (
        <div className="text-center text-white/80 text-sm p-4 border border-white/20 rounded-lg bg-white/10">
            <Loader2 className="mx-auto h-6 w-6 animate-spin mb-4" />
            Menunggu persetujuan admin... Halaman ini akan diperbarui otomatis.
        </div>
        )}
        <div className="mt-6 flex justify-center">
        <Button variant="link" className="text-white/70 hover:text-white" onClick={logout}>
            Logout
        </Button>
        </div>
    </ApprovalScreen>
  );
}

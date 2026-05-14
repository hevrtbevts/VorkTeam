
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { RupiahInput } from '@/components/ui/rupiah-input';
import { useEffect, useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { updateUserProfile } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^08[0-9]{8,}$/, 'Please enter a valid Indonesian phone number (e.g., 081234567890)'),
  weeklyTarget: z.coerce.number().min(0, 'Target tidak boleh negatif'),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const roleBadgeVariant: Record<User['role'], 'default' | 'secondary' | 'destructive'> = {
  admin: 'destructive',
  sales: 'default',
  penyelam: 'secondary'
};

export default function ProfilePage() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      weeklyTarget: 0,
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        weeklyTarget: user.weeklyTarget || 0,
      });
    }
  }, [user, form]);

  async function onProfileSubmit(values: ProfileFormData) {
    if (!firebaseUser) return;
    setIsSubmittingProfile(true);
    try {
      await updateUserProfile(firebaseUser.uid, values);
      toast({ title: 'Sukses!', description: 'Profil Anda berhasil diperbarui.' });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal memperbarui profil.' });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  const joinInfo = useMemo(() => {
    if (!user?.createdAt) {
      return { joinDate: 'N/A', membershipDuration: 'N/A' };
    }
    const createdAtDate = user.createdAt.toDate();
    const joinDate = format(createdAtDate, 'd MMMM yyyy', { locale: localeId });
    const membershipDuration = formatDistanceToNowStrict(createdAtDate, { addSuffix: false, locale: localeId });
    return { joinDate, membershipDuration };
  }, [user]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Profil Saya</CardTitle>
            <CardDescription>Atur informasi personal dan target penjualan Anda.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)} className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex flex-col items-center text-center gap-4 pt-4">
                <Image
                  src={user?.avatarUrl || 'https://placehold.co/80x80.png'}
                  alt="User Avatar"
                  width={80}
                  height={80}
                  className="rounded-full ring-2 ring-primary/50 ring-offset-4 ring-offset-background"
                  data-ai-hint="user avatar"
                />
                 <div className="mt-2 space-y-1">
                    <h2 className="text-xl font-bold">{user?.name}</h2>
                    {user?.role && (
                        <Badge variant={roleBadgeVariant[user.role]} className="capitalize">
                        {user.role}
                        </Badge>
                    )}
                 </div>
                <div className="text-center text-sm text-muted-foreground mt-4 border-t pt-4 w-full">
                    <div className="flex justify-between"><span>Bergabung:</span> <span className="font-semibold text-foreground">{joinInfo.joinDate}</span></div>
                    <div className="flex justify-between"><span>Lama:</span> <span className="font-semibold text-foreground">{joinInfo.membershipDuration}</span></div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email Anda" {...field} disabled />
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
                      <FormLabel>Nomor HP</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Nomor HP Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="weeklyTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Mingguan (Rp)</FormLabel>
                      <FormControl>
                        <RupiahInput 
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                            placeholder="Rp 25.000.000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmittingProfile}>
                        {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

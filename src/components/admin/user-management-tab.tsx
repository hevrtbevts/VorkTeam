
'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { updateUserManagement } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export function UserManagementTab() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, Partial<Pick<User, 'role' | 'status'>>>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authUser?.role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users for admin: ", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Data',
          description: 'Gagal memuat daftar pengguna.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, toast]);

  const handleFieldChange = (userId: string, field: 'role' | 'status', value: string) => {
    setChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async (userToUpdate: User) => {
    if (authUser?.role !== 'admin') {
        toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda tidak memiliki izin untuk melakukan aksi ini.' });
        return;
    }

    const userChanges = changes[userToUpdate.id];
    if (!userChanges) return;
    
    setSavingStatus(prev => ({ ...prev, [userToUpdate.id]: true }));

    try {
      await updateUserManagement(userToUpdate, userChanges, authUser);
      toast({
        title: 'Sukses!',
        description: `Data pengguna ${userToUpdate.name} berhasil diperbarui.`,
      });
      setChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[userToUpdate.id];
        return newChanges;
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: error.message || 'Gagal memperbarui data pengguna.',
      });
    } finally {
        setSavingStatus(prev => ({ ...prev, [userToUpdate.id]: false }));
    }
  };

  const getUserInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pengguna</CardTitle>
        <CardDescription>Setujui, tolak, dan kelola peran pengguna.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center min-h-[20vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header for Desktop */}
            <div className="hidden md:flex justify-between items-center text-sm font-medium text-muted-foreground px-4 py-2 border-b">
                <div className="w-1/3">Pengguna</div>
                <div className="w-1/4">Peran</div>
                <div className="w-1/4">Status</div>
                <div className="w-[100px] text-right">Aksi</div>
            </div>
            
            {users.length > 0 ? (
                users.map((user) => {
                    const currentUserChanges = changes[user.id] || {};
                    const isSaving = savingStatus[user.id];

                    return (
                        <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 rounded-lg">
                           {/* User Info */}
                           <div className="flex items-center gap-3 w-full md:w-1/3 mb-4 md:mb-0">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{getUserInitial(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-xs">{user.email}</p>
                                </div>
                            </div>
                            
                            {/* Controls for Mobile & Desktop */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex-1 md:w-1/4">
                                    <label className="text-xs font-medium text-muted-foreground md:hidden">Peran</label>
                                    <Select
                                        value={currentUserChanges.role || user.role}
                                        onValueChange={(value) => handleFieldChange(user.id, 'role', value)}
                                        disabled={user.id === authUser?.id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="sales">Sales</SelectItem>
                                            <SelectItem value="penyelam">Penyelam</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 md:w-1/4">
                                     <label className="text-xs font-medium text-muted-foreground md:hidden">Status</label>
                                     <Select
                                        value={currentUserChanges.status || user.status}
                                        onValueChange={(value) => handleFieldChange(user.id, 'status', value)}
                                        disabled={user.id === authUser?.id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="self-end md:w-[100px] md:text-right">
                                    <Button
                                        size="sm"
                                        onClick={() => handleSaveChanges(user)}
                                        disabled={!changes[user.id] || isSaving}
                                        className="w-full md:w-auto"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        <span className="ml-2 hidden sm:inline">Simpan</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    Tidak ada pengguna ditemukan.
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

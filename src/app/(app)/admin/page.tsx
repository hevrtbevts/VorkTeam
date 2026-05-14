
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatisticsTab } from '@/components/admin/statistics-tab';
import { UserManagementTab } from '@/components/admin/user-management-tab';
import { ControlPanelTab } from '@/components/admin/control-panel-tab';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DatabaseTab } from '@/components/admin/database-tab';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('statistics');

  React.useEffect(() => {
    // Redirect non-admin users after component has rendered
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  if (loading || !user || user.role !== 'admin') {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
       <div className="w-full flex justify-between items-center sm:justify-end">
        <Button variant="ghost" onClick={() => router.back()} className="sm:hidden gap-2">
            <ArrowLeft />
            Kembali
        </Button>
        <Header />
       </div>
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mx-auto flex w-fit flex-wrap justify-center h-auto">
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="panel">Panel</TabsTrigger>
        </TabsList>
        <TabsContent value="statistics" className="mt-4">
            <StatisticsTab />
        </TabsContent>
        <TabsContent value="user" className="mt-4">
            <UserManagementTab />
        </TabsContent>
        <TabsContent value="database" className="mt-4">
            <DatabaseTab />
        </TabsContent>
         <TabsContent value="panel" className="mt-4">
            <ControlPanelTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

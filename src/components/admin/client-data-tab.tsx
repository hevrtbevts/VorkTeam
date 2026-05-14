
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export function ClientDataTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Konsumen</CardTitle>
        <CardDescription>Lihat dan kelola semua data klien dari seluruh tim.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center min-h-[40vh] text-center text-muted-foreground">
        <Construction className="h-16 w-16 mb-4" />
        <h3 className="text-lg font-semibold">Under Construction</h3>
        <p className="text-sm">Fitur manajemen data konsumen sedang dalam pengembangan.</p>
      </CardContent>
    </Card>
  );
}

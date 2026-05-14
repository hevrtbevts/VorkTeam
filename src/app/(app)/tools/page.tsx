
'use client';

import React from 'react';
import { ToolCard, type Tool } from '@/components/tools/ToolCard';
import { Calculator, CalendarDays, CalendarClock, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const allTools: Tool[] = [
  {
    title: 'Simulasi Angsuran',
    description: 'Hitung estimasi angsuran',
    icon: Calculator,
    action: 'modal' as const,
    roles: ['sales', 'penyelam', 'admin'],
  },
  {
    title: 'Laporan Mingguan',
    description: 'Laporan performa mingguan',
    icon: CalendarDays,
    href: '/tools/laporan',
    action: 'link' as const,
    roles: ['sales', 'penyelam', 'admin'],
  },
  {
    title: 'Laporan Bulanan',
    description: 'Rekapitulasi performa bulanan',
    icon: CalendarClock,
    href: '/tools/monthlyrecap',
    action: 'link' as const,
    roles: ['sales', 'penyelam', 'admin'],
  },
  {
    title: 'WhatsApp Gateway',
    description: 'Kirim pesan & lihat log',
    icon: Bot,
    href: '/tools/whatsapp',
    action: 'link' as const,
    roles: ['admin'],
  }
];

export default function ToolsPage() {
  const { user } = useAuth();

  const tools = React.useMemo(() => {
    if (!user) return [];
    return allTools.filter(tool => {
      if (!tool.roles) return true;
      return tool.roles.includes(user.role);
    });
  }, [user]);

  // Mengubah grid agar lebih fleksibel
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-8">
      {tools.map((tool, index) => (
        <ToolCard key={index} tool={tool} />
      ))}
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { GlobalModal } from '@/components/ui/global-modal';
import { InstallmentCalculator } from '@/components/tools/InstallmentCalculator';
import type { LucideIcon } from 'lucide-react';
import type { User } from '@/lib/types';
import { Bot } from 'lucide-react';

export interface Tool {
  title: string;
  description: string;
  icon: LucideIcon;
  action: 'modal' | 'link';
  href?: string;
  roles?: User['role'][];
}

export function ToolCard({ tool }: { tool: Tool }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = () => {
    if (tool.action === 'modal') {
      setIsModalOpen(true);
    }
  };

  const cardContent = (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
      <tool.icon className="h-10 w-10 text-primary" />
      <h3 className="text-lg font-semibold">{tool.title}</h3>
      <p className="text-xs text-muted-foreground flex-grow">{tool.description}</p>
    </div>
  );

  if (tool.action === 'link' && tool.href) {
    return (
      <Link href={tool.href}>
        <Card className="w-full cursor-pointer transition-colors hover:bg-muted/30 aspect-square rounded-2xl h-full flex">
            {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <>
      <Card
        className="w-full cursor-pointer transition-colors hover:bg-muted/30 aspect-square rounded-2xl"
        onClick={handleCardClick}
      >
        <div className="w-full h-full flex">
            {cardContent}
        </div>
      </Card>

      {tool.action === 'modal' && (
        <GlobalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="sm:max-w-md"
        >
          {tool.title === 'Simulasi Angsuran' ? (
             <InstallmentCalculator />
          ) : (
            <div>Konten untuk {tool.title}</div>
          )}
        </GlobalModal>
      )}
    </>
  );
}


'use client';

import React from 'react';
import type { User } from '@/lib/types';
import Image from 'next/image';

export function GreetingHeader({ user }: { user: User }) {
  return (
    <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">{user.name}</h1>
        <p className="text-base text-muted-foreground font-normal">
            Here's what's happening
        </p>
    </div>
  );
}

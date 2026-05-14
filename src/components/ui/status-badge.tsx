
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/lib/types';

const statusStyles: Record<string, string> = {
  PROSPEK: 'bg-gray-500 text-white',
  SURVEY: 'bg-blue-500 text-white',
  ACC: 'bg-green-600 text-white',
  TERKIRIM: 'bg-teal-600 text-white',
  PENDING: 'bg-yellow-500 text-black',
  'DI PENDING': 'bg-orange-500 text-white',
  BATAL: 'bg-red-600 text-white',
};

const statusTextColors: Record<string, string> = {
  PROSPEK: 'text-gray-500',
  SURVEY: 'text-blue-500',
  ACC: 'text-green-600',
  TERKIRIM: 'text-teal-600',
  PENDING: 'text-yellow-500',
  'DI PENDING': 'text-orange-500',
  BATAL: 'text-red-600',
}

const defaultStyle = 'bg-gray-200 text-black';
const defaultTextColor = 'text-muted-foreground';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ClientStatus | string;
  variant?: 'default' | 'text';
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, variant = 'default', ...props }, ref) => {
    // Ensure status is uppercase and matches the keys in statusStyles
    const upperCaseStatus = typeof status === 'string' ? status.toUpperCase() as ClientStatus : status;
    const formattedStatus = status.replace(/_/g, ' ');

    if (variant === 'text') {
      const textColor = statusTextColors[upperCaseStatus] || defaultTextColor;
      return (
        <span
          ref={ref}
          className={cn(
            'text-xs font-semibold uppercase',
            textColor,
            className
          )}
          {...props}
          data-status-text="true" // For exporter
          data-status-value={upperCaseStatus}
        >
          {formattedStatus}
        </span>
      )
    }

    const style = statusStyles[upperCaseStatus] || defaultStyle;
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors border-none w-auto h-auto uppercase',
          style,
          className
        )}
        {...props}
      >
        {formattedStatus}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

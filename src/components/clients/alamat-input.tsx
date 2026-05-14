
'use client';

import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AlamatInput() {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const alamatValue = watch('alamat');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue('alamat', e.target.value.toUpperCase(), { shouldValidate: true });
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id="alamat"
          placeholder="Tulis alamat lengkap"
          value={alamatValue || ''}
          onChange={handleInputChange}
          className={cn("w-full", errors.alamat && "border-destructive")}
          autoComplete="off"
        />
      </div>

      {errors.alamat && (
        <p className="text-sm font-medium text-destructive mt-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{errors.alamat?.message as string}</span>
        </p>
      )}
    </div>
  );
}


'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RupiahInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onValueChange?: (value: number | undefined) => void;
  // New prop to control the auto-multiply behavior
  autoMultiply?: boolean;
}

const formatToRupiah = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  const numberValue = Number(String(value).replace(/[^0-9]/g, ''));
  if (isNaN(numberValue)) return '';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(numberValue);
};

const parseRupiah = (value: string): number | undefined => {
  if (!value) return undefined;
  let numberValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (isNaN(numberValue)) return undefined;

  return numberValue;
};


const RupiahInput = React.forwardRef<HTMLInputElement, RupiahInputProps>(
  ({ className, value, onValueChange, autoMultiply = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const internalValueRef = React.useRef(String(value || '').replace(/[^0-9]/g, ''));

    React.useEffect(() => {
        const formattedValue = formatToRupiah(value);
        setDisplayValue(formattedValue);
        internalValueRef.current = String(value || '').replace(/[^0-9]/g, '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, '');
      internalValueRef.current = rawValue;
      setDisplayValue(formatToRupiah(rawValue));

      if (onValueChange) {
        const finalValue = parseRupiah(rawValue);
        onValueChange(finalValue);
      }
    };

    const handleBlur = () => {
      if (autoMultiply) {
        let numberValue = parseRupiah(internalValueRef.current);
        if (numberValue !== undefined && numberValue > 0 && numberValue < 100000) {
            const lastThree = String(numberValue).slice(-3);
            if (lastThree !== '000') {
              numberValue *= 1000;
            }
        }
        
        if (onValueChange) {
            onValueChange(numberValue);
        }
        setDisplayValue(formatToRupiah(numberValue));
      }
    }
    
    return (
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
    );
  }
);
RupiahInput.displayName = 'RupiahInput';

export { RupiahInput };

/**
 * Campo de data com máscara DD/MM/AAAA e digitação direta.
 * Props:
 *   value: string 'YYYY-MM-DD' (formato ISO, como vem do banco)
 *   onChange: (isoDate: string | null) => void
 *   placeholder: string (default 'DD/MM/AAAA')
 *   className: string
 */
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isoDateToBR, brDateToISO } from '@/lib/dateUtils';

export default function DateInput({ value, onChange, placeholder = 'DD/MM/AAAA', className, ...props }) {
  const [display, setDisplay] = useState('');
  const [error, setError] = useState(false);

  // Sincroniza valor externo (ISO) → display (BR)
  useEffect(() => {
    setDisplay(isoDateToBR(value));
    setError(false);
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/\D/g, ''); // só dígitos
    // Aplica máscara DD/MM/AAAA
    if (raw.length > 8) raw = raw.slice(0, 8);
    let masked = raw;
    if (raw.length > 4) masked = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4);
    else if (raw.length > 2) masked = raw.slice(0, 2) + '/' + raw.slice(2);

    setDisplay(masked);

    if (masked.length === 10) {
      const iso = brDateToISO(masked);
      if (iso) {
        setError(false);
        onChange(iso);
      } else {
        setError(true);
      }
    } else if (masked.length === 0) {
      setError(false);
      onChange(null);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={10}
        className={cn(className, error && 'border-destructive focus-visible:ring-destructive')}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-destructive mt-0.5">Data inválida. Use DD/MM/AAAA.</p>
      )}
    </div>
  );
}
'use client';

import type { ChangeEventHandler } from 'react';
import { hslParaHex, hexParaHsl } from '@/shared/utils/color.util';
import { Input } from './input';
import { Label } from './controls';

type CorValue = string;
type CorChangeHandler = (value: CorValue) => void;
export type ColorPickerProps = {
  id: string;
  label: string;
  value: CorValue;
  onValueChange: CorChangeHandler;
  disabled?: boolean;
};

export function ColorPicker({
  id,
  label,
  value,
  onValueChange,
  disabled,
}: ColorPickerProps) {
  const hex = hslParaHex(value);
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const hsl = hexParaHsl(event.currentTarget.value);
    if (hsl) onValueChange(hsl);
  };
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          id={id}
          type="color"
          value={hex}
          onChange={onChange}
          disabled={disabled}
          className="h-11 w-12 shrink-0 cursor-pointer p-1"
        />
        <output htmlFor={id} className="min-w-0 font-mono text-xs uppercase">
          {hex}
        </output>
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ClassNames = ClassValue[];

export function cn(...inputs: ClassNames): string {
  return twMerge(clsx(inputs));
}

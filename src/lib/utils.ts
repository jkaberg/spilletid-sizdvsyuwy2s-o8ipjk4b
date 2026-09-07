import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const formatTime = (ms?: number) => {
  // If ms is not a finite number (undefined, NaN, Infinity), return default
  if (!Number.isFinite(ms as number)) return '00:00';

  const negative = (ms as number) < 0;
  const absMs = Math.abs(ms as number);

  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return negative ? `-${formatted}` : formatted;
};
export const interpolateT = (str: string, vars: Record<string, any>): string => {
  if (!vars) return str;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), str);
};
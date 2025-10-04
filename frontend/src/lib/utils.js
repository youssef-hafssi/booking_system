// Utility function for className handling with TailwindCSS
// Combines multiple classNames and handles conditional classes

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that merges Tailwind CSS classes without conflicts
 * Combines clsx (for conditional classes) with tailwind-merge (for handling conflicts)
 * 
 * @param {...string|Object|Array} inputs - Class names or objects of class names
 * @returns {string} - Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 
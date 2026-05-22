import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':   return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard':   return 'bg-red-100 text-red-800';
    default:       return 'bg-gray-100 text-gray-800';
  }
}

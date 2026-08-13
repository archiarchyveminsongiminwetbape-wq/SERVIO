export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Re-export locale formatters for backward compatibility
export { formatDate, formatRelativeTime, getLocaleFromLanguage } from './locale-formatters';

export function starRating(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return '★'.repeat(full) + (hasHalf ? '☆' : '') + '☆'.repeat(5 - full - (hasHalf ? 1 : 0));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '…';
}

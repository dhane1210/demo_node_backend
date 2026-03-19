/**
 * Date utility functions for the logistics platform.
 */

export function toISOString(date?: Date | string | null): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    return isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDate(date: Date | string | null, format: 'short' | 'long' | 'iso' = 'iso'): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    switch (format) {
        case 'short':
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        case 'long':
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        case 'iso':
        default:
            return d.toISOString();
    }
}

export function isDateInRange(date: string | Date, start: string | Date, end: string | Date): boolean {
    const d = new Date(date).getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return d >= s && d <= e;
}

export function daysBetween(date1: string | Date, date2: string | Date): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

export function nowISO(): string {
    return new Date().toISOString();
}

// Turkish date/time formatting utilities for backend
// Timezone: Europe/Istanbul (UTC+3)

export const formatDateTR = (date: Date | string, timezone: string = 'Europe/Istanbul'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone
    }).format(d);
};

export const formatDateTimeTR = (date: Date | string, timezone: string = 'Europe/Istanbul'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone
    }).format(d);
};

export const formatDateLongTR = (date: Date | string, timezone: string = 'Europe/Istanbul'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    }).format(d);
};

export const formatTimeTR = (date: Date | string, timezone: string = 'Europe/Istanbul'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    }).format(d);
};

// Get current date in Turkey timezone
export const nowInTurkey = (): Date => {
    // Returns a Date object, but note that Date objects are always in UTC internally
    // Use the format functions above with timezone parameter for display
    return new Date();
};

// Get timestamp with Turkey timezone offset info
export const getTurkeyTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
};

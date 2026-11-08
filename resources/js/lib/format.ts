const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});


const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});


export function formatRupiah(amount: number | null | undefined): string {
    return rupiahFormatter.format(amount ?? 0);
}


/**
 * Format a "YYYY-MM-DD" date without shifting it through the local timezone.
 */
export function formatDate(date: string | null | undefined): string {
    if (!date) {
        return '-';
    }


    const [year, month, day] = date.slice(0, 10).split('-').map(Number);


    return dateFormatter.format(new Date(year, month - 1, day));
}


export function formatPercentage(part: number, whole: number): string {
    if (whole <= 0) {
        return '0%';
    }


    return `${((part / whole) * 100).toFixed(1).replace(/\.0$/, '')}%`;
}


export function formatDaysRemaining(days: number): string {
    if (days < 0) {
        return `${Math.abs(days)} days ago`;
    }


    if (days === 0) {
        return 'Today';
    }


    return `${days} day${days === 1 ? '' : 's'} left`;
}

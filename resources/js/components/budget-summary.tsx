import { formatPercentage, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Allocated vs. unallocated budget as one bar with three numbers. */
export default function BudgetSummary({ total, allocated }: { total: number; allocated: number }) {
    const remaining = total - allocated;
    const over = remaining < 0;
    const filled = total > 0 ? Math.min(100, (allocated / total) * 100) : 0;

    const stats = [
        { label: 'Total budget', value: formatRupiah(total), note: null },
        { label: 'Allocated', value: formatRupiah(allocated), note: formatPercentage(allocated, total) },
        {
            label: over ? 'Over budget' : 'Unallocated',
            value: formatRupiah(Math.abs(remaining)),
            note: over ? 'Reduce some allocations' : formatPercentage(remaining, total),
        },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div key={stat.label} className="min-w-0">
                        <p className="text-muted-foreground text-xs">{stat.label}</p>
                        <p className={cn('truncate font-semibold tabular-nums', index === 2 && over && 'text-destructive')}>{stat.value}</p>
                        {stat.note && (
                            <p className={cn('text-xs', index === 2 && over ? 'text-destructive' : 'text-muted-foreground')}>{stat.note}</p>
                        )}
                    </div>
                ))}
            </div>
            <div
                className="bg-muted h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Budget allocated"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(filled)}
            >
                <div className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${filled}%` }} />
            </div>
        </div>
    );
}

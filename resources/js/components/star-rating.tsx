import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

/** Read-only average rating, e.g. "4.5 (3)". */
export function RatingSummary({ rating, count }: { rating: number | null; count: number }) {
    if (rating === null || count === 0) {
        return <span className="text-muted-foreground text-xs">No reviews yet</span>;
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs" title={`${rating} out of 5 from ${count} reviews`}>
            <Star className="fill-primary text-primary size-3.5" />
            <span className="font-medium tabular-nums">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({count})</span>
        </span>
    );
}

/** Five stars. Clickable when onChange is given. */
export function Stars({ value, onChange, size = 'size-4' }: { value: number; onChange?: (value: number) => void; size?: string }) {
    return (
        <span className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label={`${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const icon = <Star className={cn(size, star <= value ? 'fill-primary text-primary' : 'text-muted-foreground/50')} />;

                return onChange ? (
                    <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={star === value}
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                        onClick={() => onChange(star)}
                        className="rounded-sm p-0.5"
                    >
                        {icon}
                    </button>
                ) : (
                    <span key={star}>{icon}</span>
                );
            })}
        </span>
    );
}

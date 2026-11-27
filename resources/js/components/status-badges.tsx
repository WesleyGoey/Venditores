import { eventMeta, procurementMeta, quoteMeta, riskMeta, vendorMeta, type MarkKind, type StatusMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel, type VendorStatus } from '@/types';

/** A 14px shape that carries the state, so the label never needs its own color. */
export function StatusMark({ kind, className }: { kind: MarkKind; className?: string }) {
    const base = 'inline-flex size-3.5 shrink-0 items-center justify-center rounded-full';

    switch (kind) {
        case 'dash':
            return (
                <span aria-hidden className={cn(base, className)}>
                    <span className="bg-muted-foreground h-px w-2.5" />
                </span>
            );
        case 'ring':
            return <span aria-hidden className={cn(base, 'border-muted-foreground border-[1.5px]', className)} />;
        case 'live':
            return <span aria-hidden className={cn(base, 'border-primary border-2', className)} />;
        case 'check':
        case 'done':
            return (
                <span
                    aria-hidden
                    className={cn(base, kind === 'done' ? 'bg-foreground text-background' : 'border-foreground border-[1.5px]', className)}
                >
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M2.5 6.2 5 8.5l4.5-5" />
                    </svg>
                </span>
            );
        case 'cross':
            return (
                <span aria-hidden className={cn(base, 'border-muted-foreground text-muted-foreground border-[1.5px]', className)}>
                    <svg viewBox="0 0 12 12" className="size-2" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m3 3 6 6M9 3 3 9" />
                    </svg>
                </span>
            );
        case 'alert':
            return (
                <span aria-hidden className={cn(base, 'bg-foreground text-background', className)}>
                    <span className="text-[9px] leading-none font-bold">!</span>
                </span>
            );
        case 'passed':
            return <span aria-hidden className={cn(base, 'border-muted-foreground border-[1.5px] border-dashed', className)} />;
    }
}

function MarkedLabel({ meta, className }: { meta: StatusMeta; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap', className)} title={meta.description}>
            <StatusMark kind={meta.mark} />
            {meta.label}
        </span>
    );
}

export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
    return <MarkedLabel meta={eventMeta[status]} className={className} />;
}

export function ProcurementStatusBadge({ status, className }: { status: ProcurementStatus; className?: string }) {
    return <MarkedLabel meta={procurementMeta[status]} className={className} />;
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
    return <MarkedLabel meta={quoteMeta[status]} className={className} />;
}

export function VendorStatusBadge({ status, className }: { status: VendorStatus; className?: string }) {
    return <MarkedLabel meta={vendorMeta[status]} className={className} />;
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
    return <MarkedLabel meta={riskMeta[level]} className={className} />;
}

/** A real flag (the event cannot run without this vendor), so it keeps a hairline box, in ink rather than a status hue. */
export function VitalBadge() {
    return (
        <span
            className="border-foreground/40 inline-flex items-center rounded-sm border px-1.5 text-[11px] leading-4 font-semibold"
            title="The event cannot run without this vendor"
        >
            Vital
        </span>
    );
}

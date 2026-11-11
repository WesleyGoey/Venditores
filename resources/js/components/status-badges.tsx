import { eventMeta, procurementMeta, quoteMeta, riskMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel } from '@/types';

const baseClass = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset';

function Dot({ className }: { className: string }) {
    return <span className={cn('size-1.5 rounded-full', className)} aria-hidden />;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
    const meta = eventMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            <Dot className={meta.solid} />
            {meta.label}
        </span>
    );
}

export function ProcurementStatusBadge({ status }: { status: ProcurementStatus }) {
    const meta = procurementMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            <Dot className={meta.solid} />
            {meta.label}
        </span>
    );
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
    const meta = quoteMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            <Dot className={meta.solid} />
            {meta.label}
        </span>
    );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
    return <span className={cn(baseClass, riskMeta[level].badge)}>{riskMeta[level].label}</span>;
}

export function VitalBadge() {
    return (
        <span
            className={cn(baseClass, 'bg-rose-500 text-white ring-rose-600 dark:bg-rose-600 dark:ring-rose-500')}
            title="Must be secured for the event to run"
        >
            Vital
        </span>
    );
}

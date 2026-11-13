import { eventMeta, procurementMeta, quoteMeta, riskMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel } from '@/types';

const baseClass = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function EventStatusBadge({ status }: { status: EventStatus }) {
    const meta = eventMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            {meta.label}
        </span>
    );
}

export function ProcurementStatusBadge({ status }: { status: ProcurementStatus }) {
    const meta = procurementMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            {meta.label}
        </span>
    );
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
    const meta = quoteMeta[status];

    return (
        <span className={cn(baseClass, meta.badge)} title={meta.description}>
            {meta.label}
        </span>
    );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
    return <span className={cn(baseClass, riskMeta[level].badge)}>{riskMeta[level].label}</span>;
}

export function VitalBadge() {
    return (
        <span className={cn(baseClass, 'bg-destructive/10 text-destructive')} title="The event cannot run without this vendor">
            Vital
        </span>
    );
}

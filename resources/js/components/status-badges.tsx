import { cn } from '@/lib/utils';
import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel } from '@/types';


const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap';


const eventStatusStyles: Record<EventStatus, string> = {
    draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    analyzed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};


const procurementStatusStyles: Record<ProcurementStatus, string> = {
    drafting: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    searching: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    quoted: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    deal: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};


const quoteStatusStyles: Record<QuoteStatus, string> = {
    pending: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};


const riskStyles: Record<RiskLevel, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};


function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


export function EventStatusBadge({ status }: { status: EventStatus }) {
    return <span className={cn(baseClass, eventStatusStyles[status])}>{capitalize(status)}</span>;
}


export function ProcurementStatusBadge({ status }: { status: ProcurementStatus }) {
    return <span className={cn(baseClass, procurementStatusStyles[status])}>{capitalize(status)}</span>;
}


export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
    return <span className={cn(baseClass, quoteStatusStyles[status])}>{capitalize(status)}</span>;
}


export function RiskBadge({ level }: { level: RiskLevel }) {
    return <span className={cn(baseClass, riskStyles[level])}>{capitalize(level)} risk</span>;
}


export function VitalBadge() {
    return (
        <span className={cn(baseClass, 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900')}>Vital</span>
    );
}

import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel } from '@/types';

export interface StatusMeta {
    label: string;
    description: string;
    /** Soft pill: background, text and ring. */
    badge: string;
    /** Solid color for dots and progress bars. */
    solid: string;
}

/** Order matters: it is the order of the procurement pipeline. */
export const procurementOrder: ProcurementStatus[] = ['drafting', 'searching', 'quoted', 'deal', 'paid'];

export const procurementMeta: Record<ProcurementStatus, StatusMeta> = {
    drafting: {
        label: 'Not started',
        description: 'The need is defined, but no vendor has been looked for yet.',
        badge: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
        solid: 'bg-slate-400',
    },
    searching: {
        label: 'Finding vendors',
        description: 'You are looking for vendors. No offer has been recorded yet.',
        badge: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
        solid: 'bg-amber-500',
    },
    quoted: {
        label: 'Comparing offers',
        description: 'At least one offer is recorded. Compare them and accept the best one.',
        badge: 'bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-700',
        solid: 'bg-sky-500',
    },
    deal: {
        label: 'Vendor chosen',
        description: 'An offer was accepted. The vendor is secured, payment is still pending.',
        badge: 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-700',
        solid: 'bg-violet-500',
    },
    paid: {
        label: 'Paid',
        description: 'The vendor has been paid. This need is done.',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
        solid: 'bg-emerald-500',
    },
};

export const quoteMeta: Record<QuoteStatus, StatusMeta> = {
    pending: {
        label: 'Under review',
        description: 'Offer received, not decided yet.',
        badge: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
        solid: 'bg-amber-500',
    },
    accepted: {
        label: 'Chosen',
        description: 'You picked this offer. The need moves to "Vendor chosen".',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
        solid: 'bg-emerald-500',
    },
    rejected: {
        label: 'Declined',
        description: 'You turned this offer down. It no longer counts as an active option.',
        badge: 'bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-700',
        solid: 'bg-rose-500',
    },
};

export const eventMeta: Record<EventStatus, StatusMeta> = {
    draft: {
        label: 'Draft',
        description: 'The event is created. The proposal has not been analyzed yet.',
        badge: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
        solid: 'bg-slate-400',
    },
    analyzed: {
        label: 'Analyzed',
        description: 'The AI listed the vendor needs and budget split. Procurement is in progress.',
        badge: 'bg-indigo-100 text-indigo-800 ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-700',
        solid: 'bg-indigo-500',
    },
    completed: {
        label: 'Completed',
        description: 'The event is finished and no longer counts in early warnings.',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
        solid: 'bg-emerald-500',
    },
};

export const riskMeta: Record<RiskLevel, { label: string; badge: string; panel: string; top: string }> = {
    urgent: {
        label: 'Urgent risk',
        badge: 'bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-700',
        panel: 'border-l-rose-500 bg-rose-50/60 dark:bg-rose-950/20',
        top: 'border-t-rose-500',
    },
    warning: {
        label: 'Warning risk',
        badge: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
        panel: 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20',
        top: 'border-t-amber-500',
    },
    low: {
        label: 'Low risk',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
        panel: 'border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20',
        top: 'border-t-emerald-500',
    },
};

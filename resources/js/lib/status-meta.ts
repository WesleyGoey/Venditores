import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel } from '@/types';

export interface StatusMeta {
    label: string;
    description: string;
    /** Badge: tinted background and text. */
    badge: string;
    /** Solid color for dots and progress bars. */
    solid: string;
}

const neutral = 'bg-muted text-muted-foreground';

/** Order matters: it is the order of the procurement pipeline. */
export const procurementOrder: ProcurementStatus[] = ['drafting', 'searching', 'quoted', 'deal', 'paid'];

export const procurementMeta: Record<ProcurementStatus, StatusMeta> = {
    drafting: {
        label: 'Not started',
        description: 'No vendor searched yet.',
        badge: neutral,
        solid: 'bg-muted-foreground/40',
    },
    searching: {
        label: 'Finding vendors',
        description: 'Looking for vendors. No offer yet.',
        badge: 'bg-primary/10 text-primary',
        solid: 'bg-primary/40',
    },
    quoted: {
        label: 'Comparing offers',
        description: 'Offers received. Pick the best one.',
        badge: 'bg-primary/15 text-primary',
        solid: 'bg-primary/70',
    },
    deal: {
        label: 'Vendor chosen',
        description: 'Vendor picked. Payment pending.',
        badge: 'bg-primary text-primary-foreground',
        solid: 'bg-primary',
    },
    paid: {
        label: 'Paid',
        description: 'Vendor paid. Done.',
        badge: 'bg-foreground text-background',
        solid: 'bg-foreground',
    },
};

export const quoteMeta: Record<QuoteStatus, StatusMeta> = {
    pending: {
        label: 'Under review',
        description: 'Not decided yet.',
        badge: neutral,
        solid: 'bg-muted-foreground/40',
    },
    accepted: {
        label: 'Chosen',
        description: 'Picked. The need moves to "Vendor chosen".',
        badge: 'bg-primary text-primary-foreground',
        solid: 'bg-primary',
    },
    rejected: {
        label: 'Declined',
        description: 'Turned down. No longer an option.',
        badge: 'bg-destructive/10 text-destructive',
        solid: 'bg-destructive',
    },
};

export const eventMeta: Record<EventStatus, StatusMeta> = {
    draft: {
        label: 'Draft',
        description: 'Not analyzed yet.',
        badge: neutral,
        solid: 'bg-muted-foreground/40',
    },
    analyzed: {
        label: 'Analyzed',
        description: 'Vendor needs are listed. Procurement is running.',
        badge: 'bg-primary/10 text-primary',
        solid: 'bg-primary',
    },
    completed: {
        label: 'Completed',
        description: 'Event finished.',
        badge: 'bg-foreground text-background',
        solid: 'bg-foreground',
    },
};

/** Risk is the only place with extra colors: red and amber mean "act now". */
export const riskMeta: Record<RiskLevel, { label: string; badge: string }> = {
    urgent: { label: 'Urgent', badge: 'bg-destructive/10 text-destructive' },
    warning: { label: 'Warning', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    low: { label: 'Low risk', badge: neutral },
};

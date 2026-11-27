import { type EventStatus, type ProcurementStatus, type QuoteStatus, type RiskLevel, type VendorStatus } from '@/types';

/**
 * State is a shape plus a word, never a hue per state (DESIGN.md, Mark-Not-Hue).
 * dash: not started. ring: open. live: needs you now (the one blue mark). check: settled. done: settled and closed.
 * cross: turned down. alert: act now. passed: the date is behind you.
 */
export type MarkKind = 'dash' | 'ring' | 'live' | 'check' | 'done' | 'cross' | 'alert' | 'passed';

export interface StatusMeta {
    label: string;
    description: string;
    mark: MarkKind;
}

/** Order matters: it is the order of the procurement pipeline. */
export const procurementOrder: ProcurementStatus[] = ['drafting', 'searching', 'quoted', 'deal', 'paid'];

export const procurementMeta: Record<ProcurementStatus, StatusMeta> = {
    drafting: { label: 'Not started', description: 'No vendor searched yet.', mark: 'dash' },
    searching: { label: 'Finding vendors', description: 'Looking for vendors. No offer yet.', mark: 'ring' },
    quoted: { label: 'Comparing offers', description: 'Offers received. Pick the best one.', mark: 'live' },
    deal: { label: 'Vendor chosen', description: 'Vendor picked. Payment pending.', mark: 'check' },
    paid: { label: 'Paid', description: 'Vendor paid. Done.', mark: 'done' },
};

export const quoteMeta: Record<QuoteStatus, StatusMeta> = {
    pending: { label: 'Under review', description: 'Not decided yet.', mark: 'ring' },
    accepted: { label: 'Chosen', description: 'Picked. The need moves to "Vendor chosen".', mark: 'check' },
    rejected: { label: 'Declined', description: 'Turned down. No longer an option.', mark: 'cross' },
};

/** A vendor a vendor account listed, as the owner sees it. */
export const vendorMeta: Record<VendorStatus, StatusMeta> = {
    pending: { label: 'Waiting for approval', description: 'The admin has not decided yet. Users do not see it.', mark: 'ring' },
    approved: { label: 'Approved', description: 'Users see it as a recommended vendor.', mark: 'check' },
    rejected: { label: 'Not approved', description: 'Read the admin note, change the vendor and save to ask again.', mark: 'cross' },
};

export const eventMeta: Record<EventStatus, StatusMeta> = {
    draft: { label: 'Draft', description: 'Not analyzed yet.', mark: 'dash' },
    analyzed: { label: 'Analyzed', description: 'Vendor needs are listed. Procurement is running.', mark: 'ring' },
    completed: { label: 'Completed', description: 'Event finished.', mark: 'done' },
};

export const riskMeta: Record<RiskLevel, StatusMeta> = {
    passed: { label: 'Date passed', description: 'The event date is behind you. Mark it completed or change the date.', mark: 'passed' },
    urgent: { label: 'Urgent', description: '30 days or less to the event.', mark: 'alert' },
    warning: { label: 'Warning', description: '60 days or less to the event.', mark: 'ring' },
    low: { label: 'On track', description: 'More than 60 days to the event.', mark: 'dash' },
};

import Heading from '@/components/heading';
import ProcurementStepper from '@/components/procurement-stepper';
import QuoteFormDialog from '@/components/quote-form-dialog';
import { StatusMark, VitalBadge } from '@/components/status-badges';
import StatusGuide from '@/components/status-guide';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import VendorPicker from '@/components/vendor-picker';
import VendorSearchDialog from '@/components/vendor-search-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPercentage, formatRupiah } from '@/lib/format';
import { quoteMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import {
    type EventStatus,
    type Option,
    type ProcurementStatus,
    type Quote,
    type QuoteStatus,
    type RecommendedVendor,
    type UsedVendor,
    type VendorNeed,
} from '@/types';
import { Head, router } from '@inertiajs/react';
import { Check, ListOrdered, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ShowVendorNeedProps {
    event: { id: number; name: string; location: string | null; event_date: string; total_budget: number; status: EventStatus };
    vendorNeed: VendorNeed & { quotes: Quote[] };
    procurementStatuses: Option<ProcurementStatus>[];
    quoteStatuses: Option<QuoteStatus>[];
    recommendedVendors: RecommendedVendor[];
    relatedCategories: string[];
    usedVendors: UsedVendor[];
}

/** Scores are ink, and a weak fit fades. Red stays reserved for a price over budget. */
function scoreColor(score: number): string {
    return score >= 60 ? 'text-foreground' : 'text-muted-foreground';
}

export default function ShowVendorNeed({
    event,
    vendorNeed,
    quoteStatuses,
    recommendedVendors,
    relatedCategories,
    usedVendors,
}: ShowVendorNeedProps) {
    const [matching, setMatching] = useState(false);

    const matchQuotes = () => {
        router.post(
            route('events.vendor-needs.match.store', [event.id, vendorNeed.id]),
            {},
            {
                preserveScroll: true,
                onStart: () => setMatching(true),
                onFinish: () => setMatching(false),
            },
        );
    };

    const setStatus = (status: ProcurementStatus) => {
        router.patch(route('events.vendor-needs.update', [event.id, vendorNeed.id]), { procurement_status: status }, { preserveScroll: true });
    };

    const deleteNeed = () => {
        if (confirm(`Delete "${vendorNeed.category}" and its quotes?`)) {
            router.delete(route('events.vendor-needs.destroy', [event.id, vendorNeed.id]));
        }
    };

    const updateQuoteStatus = (quote: Quote, status: string) => {
        router.patch(route('events.vendor-needs.quotes.update', [event.id, vendorNeed.id, quote.id]), { status }, { preserveScroll: true });
    };

    const deleteQuote = (quote: Quote) => {
        if (confirm(`Delete the quote from ${quote.vendor_name}?`)) {
            router.delete(route('events.vendor-needs.quotes.destroy', [event.id, vendorNeed.id, quote.id]), { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title={`${vendorNeed.category} · ${event.name}`} />
            <Heading
                title={vendorNeed.category}
                back={{ href: route('events.show', event.id), label: `${event.name} · ${formatDate(event.event_date)}` }}
                description={vendorNeed.is_vital ? <VitalBadge /> : undefined}
            >
                <VendorNeedFormDialog
                    eventId={event.id}
                    vendorNeed={vendorNeed}
                    trigger={
                        <Button variant="outline">
                            <Pencil />
                            Edit
                        </Button>
                    }
                />
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={deleteNeed}>
                    <Trash2 />
                    Delete
                </Button>
            </Heading>

            <div className="flex flex-col gap-6">
                <section className="sheet rounded-2xl" aria-labelledby="need-status">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
                        <h2 id="need-status" className="font-display text-lg font-semibold">
                            Status
                        </h2>
                        <StatusGuide />
                    </div>
                    <div className="px-3 pt-3 pb-5 sm:px-6">
                        <ProcurementStepper status={vendorNeed.procurement_status} onSelect={setStatus} />
                    </div>
                    <div className="border-foreground/10 grid border-t md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <div className="space-y-2 p-5 sm:p-6">
                            <h3 className="text-muted-foreground text-xs font-medium">Specification</h3>
                            <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line">
                                {vendorNeed.specification || 'No specification yet. Add one with Edit so offers can be scored against it.'}
                            </p>
                        </div>
                        <div className="border-foreground/10 space-y-1 border-t p-5 sm:p-6 md:border-t-0 md:border-l">
                            <h3 className="text-muted-foreground text-xs font-medium">Budget</h3>
                            <p className="font-display text-2xl font-bold tabular-nums">{formatRupiah(vendorNeed.allocated_budget)}</p>
                            <p className="text-muted-foreground text-xs">
                                {formatPercentage(vendorNeed.allocated_budget, event.total_budget)} of the event budget
                            </p>
                        </div>
                    </div>
                </section>

                <VendorPicker
                    eventId={event.id}
                    vendorNeedId={vendorNeed.id}
                    needCategory={vendorNeed.category}
                    relatedCategories={relatedCategories}
                    recommended={recommendedVendors}
                    used={usedVendors}
                />

                <section className="sheet overflow-hidden rounded-2xl" aria-labelledby="quotes">
                    <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6">
                        <div className="space-y-1">
                            <h2 id="quotes" className="font-display text-lg font-semibold">
                                Quotes
                            </h2>
                            <p className="text-muted-foreground max-w-prose text-xs">
                                Score = 60% spec fit (Gemini reads the offer details only, never the vendor name) + 40% price (cheaper scores higher).
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <VendorSearchDialog
                                eventId={event.id}
                                vendorNeedId={vendorNeed.id}
                                category={vendorNeed.category}
                                location={event.location}
                            />
                            <Button variant="outline" size="sm" onClick={matchQuotes} disabled={matching || vendorNeed.quotes.length === 0}>
                                {matching ? <LoaderCircle className="animate-spin" /> : <ListOrdered />}
                                {matching ? 'Scoring…' : 'Score offers'}
                            </Button>
                            <QuoteFormDialog
                                eventId={event.id}
                                vendorNeedId={vendorNeed.id}
                                trigger={
                                    <Button size="sm">
                                        <Plus />
                                        Add quote
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {vendorNeed.quotes.length === 0 ? (
                        <p className="border-foreground/10 text-muted-foreground mt-5 border-t px-5 py-8 text-sm sm:px-6">
                            No quotes yet. Pick a vendor above, use Find vendors online, or type one in with Add quote.
                        </p>
                    ) : (
                        <ul className="divide-foreground/10 border-foreground/10 mt-5 divide-y border-t">
                            {vendorNeed.quotes.map((quote) => {
                                const difference = quote.price - vendorNeed.allocated_budget;

                                return (
                                    <li
                                        key={quote.id}
                                        className={cn(
                                            'flex flex-col gap-3 px-5 py-5 sm:px-6',
                                            quote.status === 'accepted' && 'bg-white/45 dark:bg-white/5',
                                            quote.status === 'rejected' && 'opacity-60',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="flex flex-wrap items-center gap-2 font-semibold">
                                                    {quote.vendor_name}
                                                    {quote.status === 'accepted' && (
                                                        <span className="bg-primary text-primary-foreground rounded-full px-2 text-[11px] leading-5 font-semibold">
                                                            Chosen
                                                        </span>
                                                    )}
                                                </p>
                                                {quote.vendor_contact && (
                                                    <p className="text-muted-foreground text-xs break-all">{quote.vendor_contact}</p>
                                                )}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-display text-lg font-bold tabular-nums">{formatRupiah(quote.price)}</p>
                                                <p
                                                    className={cn(
                                                        'text-xs tabular-nums',
                                                        difference > 0 ? 'text-destructive' : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {difference > 0
                                                        ? `${formatRupiah(difference)} over budget`
                                                        : `${formatRupiah(-difference)} under budget`}
                                                </p>
                                            </div>
                                        </div>

                                        {quote.notes && <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line">{quote.notes}</p>}
                                        {quote.match_reason && (
                                            <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
                                                <span className="text-foreground font-medium">Why this score: </span>
                                                {quote.match_reason}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            {quote.match_score != null ? (
                                                <p className="flex items-baseline gap-2">
                                                    <span
                                                        className={cn('font-display text-2xl font-bold tabular-nums', scoreColor(quote.match_score))}
                                                    >
                                                        {quote.match_score}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                                                        / 100 · spec {quote.spec_score} · price {quote.budget_score}
                                                    </span>
                                                </p>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Not scored yet</span>
                                            )}
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {quote.status !== 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateQuoteStatus(quote, 'accepted')}
                                                        title={quoteMeta.accepted.description}
                                                    >
                                                        <Check />
                                                        Choose
                                                    </Button>
                                                )}
                                                <Select value={quote.status} onValueChange={(status) => updateQuoteStatus(quote, status)}>
                                                    <SelectTrigger
                                                        className="h-9 w-40"
                                                        aria-label="Quote status"
                                                        title={quoteMeta[quote.status].description}
                                                    >
                                                        <SelectValue>
                                                            <span className="flex items-center gap-2">
                                                                <StatusMark kind={quoteMeta[quote.status].mark} />
                                                                {quoteMeta[quote.status].label}
                                                            </span>
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="w-64">
                                                        {quoteStatuses.map((option) => (
                                                            <SelectItem key={option.value} value={option.value} className="items-start py-2">
                                                                <span className="flex items-start gap-2">
                                                                    <StatusMark kind={quoteMeta[option.value].mark} className="mt-0.5" />
                                                                    <span className="flex flex-col">
                                                                        <span className="font-medium">{quoteMeta[option.value].label}</span>
                                                                        <span className="text-muted-foreground text-xs whitespace-normal">
                                                                            {quoteMeta[option.value].description}
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <QuoteFormDialog
                                                    eventId={event.id}
                                                    vendorNeedId={vendorNeed.id}
                                                    quote={quote}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-9"
                                                            aria-label={`Edit the quote from ${quote.vendor_name}`}
                                                        >
                                                            <Pencil />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-9"
                                                    aria-label={`Delete the quote from ${quote.vendor_name}`}
                                                    onClick={() => deleteQuote(quote)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

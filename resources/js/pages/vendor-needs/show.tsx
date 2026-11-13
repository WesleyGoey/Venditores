import ProcurementStatusSelect from '@/components/procurement-status-select';
import ProcurementStepper from '@/components/procurement-stepper';
import QuoteFormDialog from '@/components/quote-form-dialog';
import { QuoteStatusBadge, VitalBadge } from '@/components/status-badges';
import StatusGuide from '@/components/status-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import VendorPicker from '@/components/vendor-picker';
import VendorSearchDialog from '@/components/vendor-search-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPercentage, formatRupiah } from '@/lib/format';
import { quoteMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import {
    type BreadcrumbItem,
    type EventStatus,
    type Option,
    type ProcurementStatus,
    type Quote,
    type QuoteStatus,
    type RecommendedVendor,
    type UsedVendor,
    type VendorNeed,
} from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, LoaderCircle, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
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

function scoreColor(score: number): string {
    if (score >= 80) {
        return 'text-primary';
    }

    if (score >= 60) {
        return 'text-foreground';
    }

    return 'text-destructive';
}

export default function ShowVendorNeed({
    event,
    vendorNeed,
    procurementStatuses,
    quoteStatuses,
    recommendedVendors,
    relatedCategories,
    usedVendors,
}: ShowVendorNeedProps) {
    const [matching, setMatching] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: route('events.index') },
        { title: event.name, href: route('events.show', event.id) },
        { title: vendorNeed.category, href: route('events.vendor-needs.show', [event.id, vendorNeed.id]) },
    ];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${vendorNeed.category} · ${event.name}`} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href={route('events.show', event.id)}
                            className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
                        >
                            <ArrowLeft className="size-3.5" />
                            {event.name} · {formatDate(event.event_date)}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">{vendorNeed.category}</h1>
                            {vendorNeed.is_vital && <VitalBadge />}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ProcurementStatusSelect
                            eventId={event.id}
                            vendorNeedId={vendorNeed.id}
                            value={vendorNeed.procurement_status}
                            options={procurementStatuses}
                        />
                        <VendorNeedFormDialog
                            eventId={event.id}
                            vendorNeed={vendorNeed}
                            trigger={
                                <Button variant="outline">
                                    <Pencil className="size-4" />
                                    Edit
                                </Button>
                            }
                        />
                        <Button variant="destructive" onClick={deleteNeed}>
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                        <CardTitle className="text-lg">Progress</CardTitle>
                        <StatusGuide />
                    </CardHeader>
                    <CardContent>
                        <ProcurementStepper status={vendorNeed.procurement_status} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Specification</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed whitespace-pre-line">{vendorNeed.specification || 'No specification yet.'}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Budget</CardTitle>
                            <CardDescription>{formatPercentage(vendorNeed.allocated_budget, event.total_budget)} of the event budget</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tabular-nums">{formatRupiah(vendorNeed.allocated_budget)}</p>
                        </CardContent>
                    </Card>
                </div>

                <VendorPicker
                    eventId={event.id}
                    vendorNeedId={vendorNeed.id}
                    needCategory={vendorNeed.category}
                    relatedCategories={relatedCategories}
                    recommended={recommendedVendors}
                    used={usedVendors}
                />

                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle className="text-lg">Quotes</CardTitle>
                            <CardDescription>
                                Score = 60% spec fit (AI reads the offer details only) + 40% price (cheaper scores higher).
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <VendorSearchDialog
                                eventId={event.id}
                                vendorNeedId={vendorNeed.id}
                                category={vendorNeed.category}
                                location={event.location}
                            />
                            <Button variant="outline" size="sm" onClick={matchQuotes} disabled={matching || vendorNeed.quotes.length === 0}>
                                {matching ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                {matching ? 'Scoring…' : 'Score with AI'}
                            </Button>
                            <QuoteFormDialog
                                eventId={event.id}
                                vendorNeedId={vendorNeed.id}
                                trigger={
                                    <Button size="sm">
                                        <Plus className="size-4" />
                                        Add quote
                                    </Button>
                                }
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {vendorNeed.quotes.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">
                                No quotes yet. Find vendors online, pick a recommended vendor, or add a quote.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {vendorNeed.quotes.map((quote) => {
                                    const difference = quote.price - vendorNeed.allocated_budget;

                                    return (
                                        <div
                                            key={quote.id}
                                            className={cn(
                                                'flex flex-col gap-4 rounded-xl border border-white/70 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5',
                                                quote.status === 'accepted' && 'border-primary/60 bg-primary/5 dark:bg-primary/10',
                                                quote.status === 'rejected' && 'opacity-60',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold">{quote.vendor_name}</p>
                                                        <QuoteStatusBadge status={quote.status} />
                                                    </div>
                                                    {quote.vendor_contact && <p className="text-muted-foreground text-xs">{quote.vendor_contact}</p>}
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-lg font-semibold tabular-nums">{formatRupiah(quote.price)}</p>
                                                    <p
                                                        className={cn(
                                                            'text-xs tabular-nums',
                                                            difference > 0 ? 'text-destructive' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {difference > 0 ? `${formatRupiah(difference)} over` : `${formatRupiah(-difference)} under`}
                                                    </p>
                                                </div>
                                            </div>

                                            {(quote.notes || quote.match_reason) && (
                                                <div className="space-y-2">
                                                    {quote.notes && <p className="text-sm leading-relaxed whitespace-pre-line">{quote.notes}</p>}
                                                    {quote.match_reason && (
                                                        <p className="text-muted-foreground border-l-2 pl-3 text-xs leading-relaxed italic">
                                                            AI: {quote.match_reason}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/10">
                                                {quote.match_score != null ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={cn('text-xl font-semibold tabular-nums', scoreColor(quote.match_score))}>
                                                            {quote.match_score}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                                                            match · spec {quote.spec_score} · budget {quote.budget_score}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Not scored</span>
                                                )}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {quote.status !== 'accepted' && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() => updateQuoteStatus(quote, 'accepted')}
                                                            title={quoteMeta.accepted.description}
                                                        >
                                                            <Check className="size-4" />
                                                            Choose
                                                        </Button>
                                                    )}
                                                    <Select value={quote.status} onValueChange={(status) => updateQuoteStatus(quote, status)}>
                                                        <SelectTrigger
                                                            className="h-8 w-36"
                                                            aria-label="Quote status"
                                                            title={quoteMeta[quote.status].description}
                                                        >
                                                            <SelectValue>
                                                                <span className="flex items-center gap-2">
                                                                    <span
                                                                        className={cn('size-2 rounded-full', quoteMeta[quote.status].solid)}
                                                                        aria-hidden
                                                                    />
                                                                    {quoteMeta[quote.status].label}
                                                                </span>
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent className="w-64">
                                                            {quoteStatuses.map((option) => (
                                                                <SelectItem key={option.value} value={option.value} className="items-start py-2">
                                                                    <span className="flex items-start gap-2">
                                                                        <span
                                                                            className={cn(
                                                                                'mt-1.5 size-2 shrink-0 rounded-full',
                                                                                quoteMeta[option.value].solid,
                                                                            )}
                                                                            aria-hidden
                                                                        />
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
                                                            <Button variant="ghost" size="icon" className="size-8" aria-label="Edit quote">
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        aria-label="Delete quote"
                                                        onClick={() => deleteQuote(quote)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

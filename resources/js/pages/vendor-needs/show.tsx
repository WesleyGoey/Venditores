import ProcurementStatusSelect from '@/components/procurement-status-select';
import QuoteFormDialog from '@/components/quote-form-dialog';
import { QuoteStatusBadge, VitalBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPercentage, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type EventStatus, type Option, type ProcurementStatus, type Quote, type QuoteStatus, type VendorNeed } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ShowVendorNeedProps {
    event: { id: number; name: string; event_date: string; total_budget: number; status: EventStatus };
    vendorNeed: VendorNeed & { quotes: Quote[] };
    procurementStatuses: Option<ProcurementStatus>[];
    quoteStatuses: Option<QuoteStatus>[];
}

function scoreColor(score: number): string {
    if (score >= 80) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (score >= 60) {
        return 'text-amber-600 dark:text-amber-400';
    }

    return 'text-red-600 dark:text-red-400';
}

export default function ShowVendorNeed({ event, vendorNeed, procurementStatuses, quoteStatuses }: ShowVendorNeedProps) {
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
        if (confirm(`Delete "${vendorNeed.category}" and all of its quotes?`)) {
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
                            <CardTitle className="text-lg">Allocated budget</CardTitle>
                            <CardDescription>{formatPercentage(vendorNeed.allocated_budget, event.total_budget)} of the event budget</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tabular-nums">{formatRupiah(vendorNeed.allocated_budget)}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle className="text-lg">Vendor quotes</CardTitle>
                            <CardDescription>Match score = 60% specification fit (AI) + 40% budget fit.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={matchQuotes} disabled={matching || vendorNeed.quotes.length === 0}>
                                {matching ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                {matching ? 'Scoring quotes…' : 'Match quotes with AI'}
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
                            <p className="text-muted-foreground py-6 text-center text-sm">No quotes yet. Add the offers you receive from vendors.</p>
                        ) : (
                            <div className="space-y-3">
                                {vendorNeed.quotes.map((quote) => {
                                    const difference = quote.price - vendorNeed.allocated_budget;

                                    return (
                                        <div key={quote.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-medium">{quote.vendor_name}</p>
                                                    <QuoteStatusBadge status={quote.status} />
                                                </div>
                                                {quote.vendor_contact && <p className="text-muted-foreground text-xs">{quote.vendor_contact}</p>}
                                                {quote.notes && <p className="text-sm whitespace-pre-line">{quote.notes}</p>}
                                                {quote.match_reason && (
                                                    <p className="text-muted-foreground border-l-2 pl-2 text-xs italic">AI: {quote.match_reason}</p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 flex-wrap items-start gap-6 md:justify-end">
                                                <div className="text-right">
                                                    <p className="font-semibold tabular-nums">{formatRupiah(quote.price)}</p>
                                                    <p
                                                        className={cn(
                                                            'text-xs tabular-nums',
                                                            difference > 0
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-emerald-600 dark:text-emerald-400',
                                                        )}
                                                    >
                                                        {difference > 0 ? `${formatRupiah(difference)} over` : `${formatRupiah(-difference)} under`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {quote.match_score != null ? (
                                                        <>
                                                            <p className={cn('text-lg font-semibold tabular-nums', scoreColor(quote.match_score))}>
                                                                {quote.match_score}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs whitespace-nowrap">
                                                                spec {quote.spec_score} · budget {quote.budget_score}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-muted-foreground text-xs">Not scored</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Select value={quote.status} onValueChange={(status) => updateQuoteStatus(quote, status)}>
                                                        <SelectTrigger className="h-8 w-28" aria-label="Quote status">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {quoteStatuses.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
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
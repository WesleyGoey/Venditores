import BudgetSummary from '@/components/budget-summary';
import ProcurementStatusSelect from '@/components/procurement-status-select';
import { EventStatusBadge, RiskBadge, VitalBadge } from '@/components/status-badges';
import StatusGuide from '@/components/status-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDaysRemaining, formatPercentage, formatRupiah } from '@/lib/format';
import { type BreadcrumbItem, type Option, type ProcurementStatus, type RiskAssessment, type VenditoresEvent } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, FileText, LoaderCircle, MapPin, Pencil, Plus, RotateCcw, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ShowEventProps {
    event: VenditoresEvent;
    risk: RiskAssessment;
    procurementStatuses: Option<ProcurementStatus>[];
}

export default function ShowEvent({ event, risk, procurementStatuses }: ShowEventProps) {
    const [analyzing, setAnalyzing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: route('events.index') },
        { title: event.name, href: route('events.show', event.id) },
    ];

    const allocatedBudget = event.vendor_needs.reduce((total, need) => total + need.allocated_budget, 0);
    const isCompleted = event.status === 'completed';

    const analyze = () => {
        if (event.vendor_needs.length > 0 && !confirm('Analyzing again replaces all vendor needs and their quotes. Continue?')) {
            return;
        }

        router.post(
            route('events.analysis.store', event.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setAnalyzing(true),
                onFinish: () => setAnalyzing(false),
            },
        );
    };

    const deleteEvent = () => {
        if (confirm(`Delete "${event.name}" and all its vendor needs and quotes?`)) {
            router.delete(route('events.destroy', event.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.name} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
                            <EventStatusBadge status={event.status} />
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span>{formatDate(event.event_date)}</span>
                            {event.location && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="size-3.5" />
                                    {event.location}
                                </span>
                            )}
                            <span className="text-foreground font-medium tabular-nums">{formatRupiah(event.total_budget)}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {event.has_proposal && (
                            <Button variant="outline" asChild>
                                <a href={route('events.proposal', event.id)} target="_blank" rel="noreferrer">
                                    <FileText className="size-4" />
                                    Proposal
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={route('events.edit', event.id)}>
                                <Pencil className="size-4" />
                                Edit
                            </Link>
                        </Button>
                        {isCompleted ? (
                            <Button
                                variant="outline"
                                onClick={() => router.delete(route('events.completion.destroy', event.id), { preserveScroll: true })}
                            >
                                <RotateCcw className="size-4" />
                                Reopen
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => router.post(route('events.completion.store', event.id), {}, { preserveScroll: true })}
                            >
                                <CheckCircle2 className="size-4" />
                                Mark completed
                            </Button>
                        )}
                        <Button variant="destructive" onClick={deleteEvent}>
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="text-primary size-4" />
                                AI analysis
                            </CardTitle>
                            <CardDescription>
                                {event.analyzed_at
                                    ? `Last run ${new Date(event.analyzed_at).toLocaleString('en-GB')}`
                                    : 'Reads the proposal, lists the vendors you need and splits the budget.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {event.summary ? (
                                <>
                                    <p className="text-sm leading-relaxed">{event.summary}</p>
                                    <div className="flex flex-wrap gap-6 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Scale</p>
                                            <p className="font-medium capitalize">{event.scale ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Attendees (est.)</p>
                                            <p className="font-medium">{event.estimated_attendees?.toLocaleString('id-ID') ?? '-'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                event.description && <p className="text-muted-foreground text-sm">{event.description}</p>
                            )}

                            {event.has_proposal ? (
                                <Button onClick={analyze} disabled={analyzing}>
                                    {analyzing ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                    {analyzing ? 'Analyzing… up to a minute' : event.analyzed_at ? 'Analyze again' : 'Analyze proposal'}
                                </Button>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    <Link href={route('events.edit', event.id)} className="text-foreground underline underline-offset-4">
                                        Upload a proposal
                                    </Link>{' '}
                                    to use AI, or add vendor needs below.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShieldAlert className="size-4" />
                                Risk
                            </CardTitle>
                            <CardDescription>{formatDaysRemaining(risk.days_remaining)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <RiskBadge level={risk.level} />
                                <span className="text-muted-foreground text-sm">{risk.unsecured_needs} needs without a vendor</span>
                            </div>
                            {risk.unsecured_vital_needs.length > 0 && (
                                <p className="text-sm">
                                    <span className="text-destructive font-medium">Vital, no vendor yet:</span>{' '}
                                    {risk.unsecured_vital_needs.join(', ')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle className="text-lg">Vendor needs</CardTitle>
                            <CardDescription>How the budget is split.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusGuide />
                            <VendorNeedFormDialog
                                eventId={event.id}
                                trigger={
                                    <Button size="sm">
                                        <Plus className="size-4" />
                                        Add need
                                    </Button>
                                }
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <BudgetSummary total={event.total_budget} allocated={allocatedBudget} />
                        {event.vendor_needs.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">No vendor needs yet. Analyze the proposal or add one.</p>
                        ) : (
                            <ul className="grid gap-3 lg:grid-cols-2">
                                {event.vendor_needs.map((need) => {
                                    const share = event.total_budget > 0 ? Math.min(100, (need.allocated_budget / event.total_budget) * 100) : 0;

                                    return (
                                        <li
                                            key={need.id}
                                            className="flex flex-col gap-4 rounded-xl border border-white/70 bg-white/40 p-4 transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Link
                                                            href={route('events.vendor-needs.show', [event.id, need.id])}
                                                            className="font-semibold underline-offset-4 hover:underline"
                                                        >
                                                            {need.category}
                                                        </Link>
                                                        {need.is_vital && <VitalBadge />}
                                                    </div>
                                                    {need.specification && (
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                                                            {need.specification}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="font-semibold tabular-nums">{formatRupiah(need.allocated_budget)}</p>
                                                    <p className="text-muted-foreground text-xs tabular-nums">
                                                        {formatPercentage(need.allocated_budget, event.total_budget)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10" aria-hidden>
                                                <div className="bg-primary h-full rounded-full" style={{ width: `${share}%` }} />
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <ProcurementStatusSelect
                                                    eventId={event.id}
                                                    vendorNeedId={need.id}
                                                    value={need.procurement_status}
                                                    options={procurementStatuses}
                                                />
                                                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                                                    <span>
                                                        <span className="text-foreground font-medium tabular-nums">{need.quotes_count ?? 0}</span>{' '}
                                                        quotes
                                                    </span>
                                                    <span>
                                                        Best{' '}
                                                        <span className="text-foreground font-medium tabular-nums">
                                                            {need.quotes_max_match_score != null ? `${need.quotes_max_match_score}/100` : '-'}
                                                        </span>
                                                    </span>
                                                    <Link
                                                        href={route('events.vendor-needs.show', [event.id, need.id])}
                                                        className="hover:text-foreground"
                                                        aria-label={`Open ${need.category}`}
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

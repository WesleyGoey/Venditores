import BudgetSummary from '@/components/budget-summary';
import Heading from '@/components/heading';
import ProcurementStatusSelect from '@/components/procurement-status-select';
import { EventStatusBadge, RiskBadge, VitalBadge } from '@/components/status-badges';
import StatusGuide from '@/components/status-guide';
import { Button } from '@/components/ui/button';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime, formatDaysRemaining, formatPercentage, formatRupiah } from '@/lib/format';
import { type Option, type ProcurementStatus, type RiskAssessment, type VenditoresEvent } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, FileText, LoaderCircle, Pencil, Plus, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import { useState } from 'react';


interface ShowEventProps {
    event: VenditoresEvent;
    risk: RiskAssessment;
    procurementStatuses: Option<ProcurementStatus>[];
}


/** Need, budget share, status and offers share one grid so the column header lines up with every row. */
const needGrid = 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_12rem_8rem]';


export default function ShowEvent({ event, risk, procurementStatuses }: ShowEventProps) {
    const [analyzing, setAnalyzing] = useState(false);


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


    const complete = () => router.post(route('events.completion.store', event.id), {}, { preserveScroll: true });


    return (
        <AppLayout>
            <Head title={event.name} />
            <Heading
                title={event.name}
                back={{ href: route('events.index'), label: 'Events' }}
                description={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{formatDate(event.event_date)}</span>
                        {event.location && <span>{event.location}</span>}
                        <span className="text-foreground font-semibold tabular-nums">{formatRupiah(event.total_budget)}</span>
                        <EventStatusBadge status={event.status} className="text-foreground" />
                    </span>
                }
            >
                {event.has_proposal && (
                    <Button variant="outline" asChild>
                        <a href={route('events.proposal', event.id)} target="_blank" rel="noreferrer">
                            <FileText />
                            Proposal
                        </a>
                    </Button>
                )}
                <Button variant="outline" asChild>
                    <Link href={route('events.edit', event.id)}>
                        <Pencil />
                        Edit
                    </Link>
                </Button>
                {isCompleted ? (
                    <Button variant="outline" onClick={() => router.delete(route('events.completion.destroy', event.id), { preserveScroll: true })}>
                        <RotateCcw />
                        Reopen
                    </Button>
                ) : (
                    <Button variant="outline" onClick={complete}>
                        <CheckCircle2 />
                        Mark completed
                    </Button>
                )}
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={deleteEvent}>
                    <Trash2 />
                    Delete
                </Button>
            </Heading>


            <section className="sheet grid rounded-2xl md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-4 p-5 sm:p-6">
                    <div>
                        <h2 className="font-display text-lg font-semibold">From the proposal</h2>
                        <p className="text-muted-foreground text-xs">
                            {event.analyzed_at
                                ? `Read by Gemini on ${formatDateTime(event.analyzed_at)}`
                                : 'Gemini reads the proposal, lists the vendors you need and splits the budget.'}
                        </p>
                    </div>
                    {event.summary ? (
                        <>
                            <p className="max-w-prose text-sm leading-relaxed">{event.summary}</p>
                            <dl className="flex flex-wrap gap-8 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">Scale</dt>
                                    <dd className="font-medium capitalize">{event.scale ?? '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">Attendees (estimate)</dt>
                                    <dd className="font-medium tabular-nums">{event.estimated_attendees?.toLocaleString('id-ID') ?? '-'}</dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        event.description && <p className="text-muted-foreground max-w-prose text-sm">{event.description}</p>
                    )}


                    {event.has_proposal ? (
                        <Button variant={event.analyzed_at ? 'outline' : 'default'} onClick={analyze} disabled={analyzing}>
                            {analyzing ? <LoaderCircle className="animate-spin" /> : <ScanText />}
                            {analyzing ? 'Reading the proposal, up to a minute' : event.analyzed_at ? 'Analyze again' : 'Analyze proposal'}
                        </Button>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            <Link href={route('events.edit', event.id)} className="text-foreground font-medium underline underline-offset-4">
                                Upload a proposal
                            </Link>{' '}
                            to let Gemini list the vendors, or add vendor needs below.
                        </p>
                    )}
                </div>


                <div className="border-foreground/10 space-y-3 border-t p-5 sm:p-6 md:border-t-0 md:border-l">
                    <h2 className="font-display text-lg font-semibold">Deadline</h2>
                    {isCompleted ? (
                        <p className="text-muted-foreground text-sm">The event is completed, so there is no deadline to watch.</p>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <RiskBadge level={risk.level} className="text-sm" />
                                <span className="text-muted-foreground text-sm">{formatDaysRemaining(risk.days_remaining)}</span>
                            </div>
                            {risk.level === 'passed' ? (
                                <div className="space-y-3 text-sm">
                                    <p>The date is behind you. Close the event, or change the date if it moved.</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" onClick={complete}>
                                            Mark completed
                                        </Button>
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={route('events.edit', event.id)}>Change the date</Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm">
                                    {risk.unsecured_needs} need{risk.unsecured_needs === 1 ? '' : 's'} without a vendor
                                    {risk.unsecured_vital_needs.length > 0 && (
                                        <>
                                            , vital: <span className="font-medium">{risk.unsecured_vital_needs.join(', ')}</span>
                                        </>
                                    )}
                                    .
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>


            <section className="sheet mt-6 overflow-hidden rounded-2xl" aria-labelledby="vendor-needs">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                    <h2 id="vendor-needs" className="font-display text-lg font-semibold">
                        Vendor needs
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusGuide />
                        <VendorNeedFormDialog
                            eventId={event.id}
                            trigger={
                                <Button size="sm">
                                    <Plus />
                                    Add need
                                </Button>
                            }
                        />
                    </div>
                </div>
                <div className="px-5 py-5 sm:px-6">
                    <BudgetSummary total={event.total_budget} allocated={allocatedBudget} />
                </div>


                {event.vendor_needs.length === 0 ? (
                    <p className="border-foreground/10 text-muted-foreground border-t px-5 py-8 text-sm sm:px-6">
                        No vendor needs yet. {event.has_proposal ? 'Analyze the proposal above' : 'Upload a proposal'} or add one with Add need.
                    </p>
                ) : (
                    <>
                        <div
                            className={`text-muted-foreground border-foreground/10 hidden gap-6 border-t px-6 py-3 text-xs font-medium lg:grid ${needGrid}`}
                        >
                            <span>Need</span>
                            <span>Budget and share</span>
                            <span>Status</span>
                            <span className="text-right">Offers</span>
                        </div>
                        <ul className="divide-foreground/10 border-foreground/10 divide-y border-t">
                            {event.vendor_needs.map((need) => {
                                const share = event.total_budget > 0 ? Math.min(100, (need.allocated_budget / event.total_budget) * 100) : 0;
                                const needUrl = route('events.vendor-needs.show', [event.id, need.id]);


                                return (
                                    <li key={need.id} className={`grid gap-x-6 gap-y-3 px-5 py-4 sm:px-6 lg:items-center ${needGrid}`}>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link href={needUrl} className="font-semibold underline-offset-4 hover:underline">
                                                    {need.category}
                                                </Link>
                                                {need.is_vital && <VitalBadge />}
                                            </div>
                                            {need.specification && (
                                                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{need.specification}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span className="font-semibold tabular-nums">{formatRupiah(need.allocated_budget)}</span>
                                                <span className="text-muted-foreground text-xs tabular-nums">
                                                    {formatPercentage(need.allocated_budget, event.total_budget)}
                                                </span>
                                            </div>
                                            <div className="bg-foreground/10 h-1.5 overflow-hidden rounded-full" aria-hidden>
                                                <div className="bg-primary h-full rounded-full" style={{ width: `${share}%` }} />
                                            </div>
                                        </div>
                                        <ProcurementStatusSelect
                                            eventId={event.id}
                                            vendorNeedId={need.id}
                                            value={need.procurement_status}
                                            options={procurementStatuses}
                                        />
                                        <Link
                                            href={needUrl}
                                            className="text-muted-foreground hover:text-foreground flex min-h-11 items-center justify-between gap-2 text-xs lg:justify-end"
                                            aria-label={`Open ${need.category}: ${need.quotes_count ?? 0} offers`}
                                        >
                                            <span>
                                                <span className="text-foreground font-semibold tabular-nums">{need.quotes_count ?? 0}</span> offers
                                                {need.quotes_max_match_score != null && (
                                                    <>
                                                        {' '}
                                                        · best{' '}
                                                        <span className="text-foreground font-semibold tabular-nums">
                                                            {need.quotes_max_match_score}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                            <ChevronRight className="size-4" aria-hidden />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </section>
        </AppLayout>
    );
}

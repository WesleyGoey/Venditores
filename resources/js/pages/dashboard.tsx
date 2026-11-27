import Heading from '@/components/heading';
import { ProcurementStatusBadge, StatusMark, VitalBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatRupiah } from '@/lib/format';
import { procurementMeta, riskMeta } from '@/lib/status-meta';
import { type EventStatus, type ProcurementStatus, type RiskAssessment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';


interface StatusCount<T extends string> {
    value: T;
    label: string;
    count: number;
}


interface EventSummary {
    id: number;
    name: string;
    event_date: string;
}


interface WarningEvent extends EventSummary {
    status: EventStatus;
}


interface CriticalNeed {
    id: number;
    category: string;
    is_vital: boolean;
    allocated_budget: number;
    procurement_status: ProcurementStatus;
    event: EventSummary;
}


interface DashboardProps {
    stats: {
        events: number;
        vendor_needs: number;
        quotes: number;
        total_budget: number;
        needs_without_offers: number;
        vital_needs_without_offers: number;
    };
    eventStatusCounts: StatusCount<EventStatus>[];
    procurementStatusCounts: StatusCount<ProcurementStatus>[];
    criticalNeeds: CriticalNeed[];
    warnings: (RiskAssessment & { event: WarningEvent })[];
}


function plural(count: number, word: string): string {
    return `${count.toLocaleString('id-ID')} ${word}${count === 1 ? '' : 's'}`;
}


/** The screen answers two questions, in this order: which date is closest, and which vendor need should be secured next? */
export default function Dashboard({ stats, eventStatusCounts, procurementStatusCounts, criticalNeeds, warnings }: DashboardProps) {
    const open = stats.needs_without_offers;
    const nearest = warnings[0];
    const needsTitle =
        stats.events === 0
            ? 'Start with a proposal'
            : stats.vendor_needs === 0
              ? 'No vendor needs yet'
              : open === 0
                ? 'Every need has an offer'
                : `${plural(open, 'need')} still without an offer`;
    const title = nearest
        ? nearest.days_remaining < 0
            ? 'An event date has passed'
            : nearest.days_remaining === 0
              ? 'An event is today'
              : `Next deadline in ${plural(nearest.days_remaining, 'day')}`
        : needsTitle;
    const description = nearest
        ? nearest.event.name
        : stats.events === 0
          ? 'Create an event, pick its proposal PDF, and the vendor list with its budget split appears here.'
          : stats.vendor_needs === 0
            ? 'Open an event, then analyze its proposal or add a need yourself.'
            : open === 0
              ? 'Compare the offers on each event and choose a vendor.'
              : stats.vital_needs_without_offers > 0
                ? `${stats.vital_needs_without_offers} of them ${stats.vital_needs_without_offers === 1 ? 'is' : 'are'} vital: the event cannot run without ${stats.vital_needs_without_offers === 1 ? 'it' : 'them'}.`
                : 'None of them is vital, so start with the biggest budget.';


    const eventCounts = eventStatusCounts
        .filter((status) => status.count > 0)
        .map((status) => `${status.count} ${status.label.toLowerCase()}`)
        .join(', ');


    return (
        <AppLayout>
            <Head title="Dashboard" />
            <Heading title={title} description={description}>
                <Button asChild>
                    <Link href={route('events.create')}>
                        <CalendarPlus />
                        New event
                    </Link>
                </Button>
            </Heading>


            <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <section className="bg-foreground text-background overflow-hidden rounded-2xl" aria-labelledby="deadlines">
                    <h2 id="deadlines" className="font-display px-5 pt-5 pb-3 text-xl font-bold sm:px-6">
                        Deadlines
                    </h2>
                    {warnings.length === 0 ? (
                        <p className="border-background/20 text-background/70 border-t px-5 py-8 text-sm sm:px-6">
                            No open event is within 60 days, and none has a date that already passed.
                        </p>
                    ) : (
                        <ul className="divide-background/20 border-background/20 divide-y border-t">
                            {warnings.map((warning) => (
                                <li
                                    key={warning.event.id}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-5 py-5 sm:px-6"
                                >
                                    <div className="min-w-0 space-y-1.5">
                                        <Link
                                            href={route('events.show', warning.event.id)}
                                            className="block text-lg leading-snug font-semibold underline-offset-4 hover:underline"
                                        >
                                            {warning.event.name}
                                        </Link>
                                        <p className="text-background/70 text-xs">{formatDate(warning.event.event_date)}</p>
                                        {warning.level === 'passed' ? (
                                            <p className="text-sm">
                                                Still open with {plural(warning.unsecured_needs, 'need')} unsecured.{' '}
                                                <Link
                                                    href={route('events.show', warning.event.id)}
                                                    className="font-medium underline underline-offset-4"
                                                >
                                                    Mark it completed or change the date
                                                </Link>
                                                .
                                            </p>
                                        ) : warning.event.status === 'draft' ? (
                                            <p className="text-sm">
                                                Not analyzed yet, so there is no vendor list.{' '}
                                                <Link
                                                    href={route('events.show', warning.event.id)}
                                                    className="font-medium underline underline-offset-4"
                                                >
                                                    Analyze the proposal
                                                </Link>
                                                .
                                            </p>
                                        ) : (
                                            <p className="text-sm">
                                                {plural(warning.unsecured_needs, 'need')} without a vendor
                                                {warning.unsecured_vital_needs.length > 0 && (
                                                    <>
                                                        , vital: <span className="font-medium">{warning.unsecured_vital_needs.join(', ')}</span>
                                                    </>
                                                )}
                                                .
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="font-display text-4xl leading-none font-bold tabular-nums">
                                            {warning.days_remaining < 0 ? 'Passed' : warning.days_remaining === 0 ? 'Today' : warning.days_remaining}
                                        </p>
                                        <p className="text-background/70 text-xs">
                                            {warning.days_remaining < 0
                                                ? `${Math.abs(warning.days_remaining)} days ago`
                                                : warning.days_remaining === 0
                                                  ? 'the event is today'
                                                  : warning.days_remaining === 1
                                                    ? 'day left'
                                                    : 'days left'}
                                        </p>
                                        <span className="bg-background text-foreground inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                            {riskMeta[warning.level].label}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>


                <section aria-labelledby="next-to-secure" className="space-y-3">
                    <div className="flex items-baseline justify-between gap-4">
                        <h2 id="next-to-secure" className="font-display text-lg font-semibold">
                            Next to secure
                        </h2>
                        {open > criticalNeeds.length && (
                            <span className="text-muted-foreground text-xs">
                                {criticalNeeds.length} of {open}, vital first
                            </span>
                        )}
                    </div>


                    {stats.events === 0 ? (
                        <p className="text-sm">
                            Nothing to secure yet.{' '}
                            <Link href={route('events.create')} className="font-medium underline underline-offset-4">
                                Create your first event
                            </Link>
                            .
                        </p>
                    ) : criticalNeeds.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            {stats.vendor_needs === 0 ? (
                                'No vendor needs yet. Analyze a proposal, or add a need on an event.'
                            ) : (
                                <>
                                    Every vendor need has at least one offer.{' '}
                                    <Link href={route('events.index')} className="text-foreground font-medium underline underline-offset-4">
                                        Open your events
                                    </Link>{' '}
                                    to compare them.
                                </>
                            )}
                        </p>
                    ) : (
                        <ol className="divide-foreground/10 border-foreground/10 divide-y border-y">
                            {criticalNeeds.map((need) => (
                                <li key={need.id}>
                                    <Link
                                        href={route('events.vendor-needs.show', [need.event.id, need.id])}
                                        className="block space-y-1 py-3 transition-colors hover:bg-white/50"
                                    >
                                        <span className="flex items-baseline justify-between gap-3">
                                            <span className="flex flex-wrap items-center gap-2 font-semibold">
                                                {need.category}
                                                {need.is_vital && <VitalBadge />}
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums">{formatRupiah(need.allocated_budget)}</span>
                                        </span>
                                        <span className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                                            <span className="truncate">{need.event.name}</span>
                                            <ProcurementStatusBadge status={need.procurement_status} />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>


            <section aria-labelledby="pipeline" className="mt-10">
                <h2 id="pipeline" className="font-display text-lg font-semibold">
                    Where every vendor need stands
                </h2>
                <ol className="border-foreground/10 mt-3 grid grid-cols-2 border-t sm:grid-cols-5">
                    {procurementStatusCounts.map((status) => (
                        <li
                            key={status.value}
                            className="border-foreground/10 border-b py-4 pr-4 sm:border-b-0"
                            title={procurementMeta[status.value].description}
                        >
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                                <StatusMark kind={procurementMeta[status.value].mark} />
                                {status.label}
                            </span>
                            <span className="font-display mt-1 block text-3xl font-bold tabular-nums">{status.count}</span>
                        </li>
                    ))}
                </ol>
                <p className="text-muted-foreground border-foreground/10 border-t pt-3 text-xs">
                    {plural(stats.events, 'event')}
                    {eventCounts && ` (${eventCounts})`} · {plural(stats.vendor_needs, 'vendor need')} · {plural(stats.quotes, 'quote')} ·{' '}
                    {formatRupiah(stats.total_budget)} planned in total
                </p>
            </section>
        </AppLayout>
    );
}

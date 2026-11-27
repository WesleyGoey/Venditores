import Heading from '@/components/heading';
import SortSelect from '@/components/sort-select';
import { EventStatusBadge, RiskBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPercentage, formatRupiah } from '@/lib/format';
import { type EventStatus, type RiskLevel } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarPlus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';


interface EventListItem {
    id: number;
    name: string;
    event_date: string;
    location: string | null;
    total_budget: number;
    allocated_budget: number;
    status: EventStatus;
    vendor_needs_count: number;
    risk_level: RiskLevel;
}


type Sort = 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' | 'budget_desc' | 'budget_asc';


const sortOptions: { value: Sort; label: string }[] = [
    { value: 'date_asc', label: 'Date: soonest first' },
    { value: 'date_desc', label: 'Date: latest first' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'budget_desc', label: 'Budget: high to low' },
    { value: 'budget_asc', label: 'Budget: low to high' },
];


const statusOptions: { value: EventStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'completed', label: 'Completed' },
];


const compare: Record<Sort, (a: EventListItem, b: EventListItem) => number> = {
    date_asc: (a, b) => a.event_date.localeCompare(b.event_date),
    date_desc: (a, b) => b.event_date.localeCompare(a.event_date),
    name_asc: (a, b) => a.name.localeCompare(b.name),
    name_desc: (a, b) => b.name.localeCompare(a.name),
    budget_desc: (a, b) => b.total_budget - a.total_budget,
    budget_asc: (a, b) => a.total_budget - b.total_budget,
};


/** One ruled row per event, in the same column grid as the landing page's budget sheet. */
const rowGrid = 'md:grid-cols-[minmax(0,1.6fr)_8rem_minmax(0,1.2fr)_10rem]';


export default function EventsIndex({ events }: { events: EventListItem[] }) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<EventStatus | 'all'>('all');
    const [sort, setSort] = useState<Sort>('date_asc');


    const shown = useMemo(() => {
        const needle = query.trim().toLowerCase();


        return events
            .filter(
                (event) =>
                    (status === 'all' || event.status === status) &&
                    (needle === '' || event.name.toLowerCase().includes(needle) || event.location?.toLowerCase().includes(needle)),
            )
            .sort(compare[sort]);
    }, [events, query, status, sort]);


    return (
        <AppLayout>
            <Head title="Events" />
            <Heading title="Events" description={events.length > 0 ? `${events.length} event${events.length === 1 ? '' : 's'}` : undefined}>
                <Button asChild>
                    <Link href={route('events.create')}>
                        <CalendarPlus />
                        New event
                    </Link>
                </Button>
            </Heading>


            {events.length > 0 && (
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name or location"
                            aria-label="Search events"
                            className="pl-8"
                        />
                    </div>
                    <Select value={status} onValueChange={(value) => setStatus(value as EventStatus | 'all')}>
                        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <SortSelect value={sort} onChange={setSort} options={sortOptions} />
                </div>
            )}


            {events.length === 0 ? (
                <div className="sheet rounded-2xl px-6 py-10">
                    <p className="font-display text-xl font-semibold">No events yet</p>
                    <p className="text-muted-foreground mt-1 max-w-md text-sm">
                        Create one and pick its proposal PDF. The vendor list and the budget split are built from it.
                    </p>
                    <Button asChild className="mt-5">
                        <Link href={route('events.create')}>Create your first event</Link>
                    </Button>
                </div>
            ) : shown.length === 0 ? (
                <p className="sheet text-muted-foreground rounded-2xl px-6 py-10 text-sm">
                    No event matches these filters.{' '}
                    <button
                        type="button"
                        className="text-foreground cursor-pointer font-medium underline underline-offset-4"
                        onClick={() => {
                            setQuery('');
                            setStatus('all');
                        }}
                    >
                        Clear the filters
                    </button>
                </p>
            ) : (
                <div className="sheet overflow-hidden rounded-2xl">
                    <div className={`text-muted-foreground hidden gap-6 px-5 py-3 text-xs font-medium md:grid ${rowGrid}`}>
                        <span>Event</span>
                        <span>Date</span>
                        <span>Budget allocated</span>
                        <span>Status</span>
                    </div>
                    <ul className="divide-foreground/10 border-foreground/10 divide-y border-t">
                        {shown.map((event) => {
                            const share = event.total_budget > 0 ? Math.min(100, (event.allocated_budget / event.total_budget) * 100) : 0;


                            return (
                                <li key={event.id}>
                                    <Link
                                        href={route('events.show', event.id)}
                                        className={`grid gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-white/50 md:items-center ${rowGrid}`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block leading-snug font-semibold">{event.name}</span>
                                            {event.location && <span className="text-muted-foreground block truncate text-xs">{event.location}</span>}
                                        </span>
                                        <span className="text-sm tabular-nums">{formatDate(event.event_date)}</span>
                                        <span className="min-w-0 space-y-1.5">
                                            <span className="flex items-baseline justify-between gap-2 text-sm">
                                                <span className="font-semibold tabular-nums">{formatRupiah(event.total_budget)}</span>
                                                <span className="text-muted-foreground text-xs tabular-nums">
                                                    {event.vendor_needs_count} needs · {formatPercentage(event.allocated_budget, event.total_budget)}
                                                </span>
                                            </span>
                                            <span className="bg-foreground/10 block h-1.5 overflow-hidden rounded-full" aria-hidden>
                                                <span className="bg-primary block h-full rounded-full" style={{ width: `${share}%` }} />
                                            </span>
                                        </span>
                                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <EventStatusBadge status={event.status} />
                                            {event.status !== 'completed' && event.risk_level !== 'low' && <RiskBadge level={event.risk_level} />}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </AppLayout>
    );
}

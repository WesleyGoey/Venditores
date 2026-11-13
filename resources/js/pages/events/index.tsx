import Heading from '@/components/heading';
import SortSelect from '@/components/sort-select';
import { EventStatusBadge, RiskBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatRupiah } from '@/lib/format';
import { type BreadcrumbItem, type EventStatus, type RiskLevel } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarPlus, MapPin, Search } from 'lucide-react';
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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Events', href: '/events' }];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading title="Events" description="All your events." />
                    <Button asChild>
                        <Link href={route('events.create')}>
                            <CalendarPlus className="size-4" />
                            New event
                        </Link>
                    </Button>
                </div>

                {events.length > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or location" className="pl-8" />
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
                    <div className="rounded-lg border border-dashed p-10 text-center">
                        <p className="font-medium">No events yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">Create one and upload its proposal.</p>
                    </div>
                ) : shown.length === 0 ? (
                    <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Nothing matches your filters.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {shown.map((event) => (
                            <Link
                                key={event.id}
                                href={route('events.show', event.id)}
                                className="glass hover:border-primary flex flex-col gap-3 rounded-2xl p-4 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="leading-tight font-semibold">{event.name}</h3>
                                    <EventStatusBadge status={event.status} />
                                </div>
                                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                    <span>{formatDate(event.event_date)}</span>
                                    {event.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="size-3.5" />
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-auto flex items-end justify-between gap-2">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Budget</p>
                                        <p className="font-semibold tabular-nums">{formatRupiah(event.total_budget)}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {event.vendor_needs_count} needs · {formatRupiah(event.allocated_budget)} allocated
                                        </p>
                                    </div>
                                    {event.status !== 'completed' && <RiskBadge level={event.risk_level} />}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

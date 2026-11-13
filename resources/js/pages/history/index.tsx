import Heading from '@/components/heading';
import { EventStatusBadge, ProcurementStatusBadge } from '@/components/status-badges';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type EventStatus, type ProcurementStatus } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface UsedVendor {
    need_id: number;
    category: string;
    name: string;
    contact: string | null;
    price: number;
    procurement_status: ProcurementStatus;
}

interface HistoryEvent {
    id: number;
    name: string;
    event_date: string;
    location: string | null;
    status: EventStatus;
    vendors: UsedVendor[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'History', href: '/history' }];

export default function HistoryIndex({ events }: { events: HistoryEvent[] }) {
    const [tab, setTab] = useState<'events' | 'vendors'>('events');
    const [query, setQuery] = useState('');
    const needle = query.trim().toLowerCase();

    const shownEvents = useMemo(
        () =>
            events.filter(
                (event) =>
                    needle === '' ||
                    event.name.toLowerCase().includes(needle) ||
                    event.vendors.some((vendor) => vendor.name.toLowerCase().includes(needle) || vendor.category.toLowerCase().includes(needle)),
            ),
        [events, needle],
    );

    // The same vendor can be used in several events: group by name.
    const vendors = useMemo(() => {
        const byName = new Map<string, { name: string; uses: { event: HistoryEvent; vendor: UsedVendor }[] }>();

        events.forEach((event) =>
            event.vendors.forEach((vendor) => {
                const key = vendor.name.trim().toLowerCase();
                const entry = byName.get(key) ?? { name: vendor.name, uses: [] };
                entry.uses.push({ event, vendor });
                byName.set(key, entry);
            }),
        );

        return Array.from(byName.values())
            .filter(
                (entry) =>
                    needle === '' ||
                    entry.name.toLowerCase().includes(needle) ||
                    entry.uses.some((use) => use.vendor.category.toLowerCase().includes(needle)),
            )
            .sort((a, b) => b.uses.length - a.uses.length || a.name.localeCompare(b.name));
    }, [events, needle]);

    const totalVendors = events.reduce((sum, event) => sum + event.vendors.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History" />
            <div className="flex flex-col gap-4 p-4">
                <Heading title="History" description={`${events.length} events, ${totalVendors} vendors chosen.`} />

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-muted inline-flex rounded-lg p-1 text-sm" role="tablist">
                        {(
                            [
                                ['events', 'By event'],
                                ['vendors', 'By vendor'],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={tab === value}
                                onClick={() => setTab(value)}
                                className={cn('rounded-md px-3 py-1.5 font-medium', tab === value ? 'bg-card shadow-xs' : 'text-muted-foreground')}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search event, vendor or category"
                            className="pl-8"
                        />
                    </div>
                </div>

                {tab === 'events' ? (
                    shownEvents.length === 0 ? (
                        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                            {events.length === 0 ? 'No events yet.' : 'Nothing matches your search.'}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {shownEvents.map((event) => (
                                <section key={event.id} className="bg-card rounded-lg border">
                                    <div className="flex flex-wrap items-start justify-between gap-2 border-b p-4">
                                        <div className="space-y-1">
                                            <Link href={route('events.show', event.id)} className="font-semibold hover:underline">
                                                {event.name}
                                            </Link>
                                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-sm">
                                                <span>{formatDate(event.event_date)}</span>
                                                {event.location && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="size-3.5" />
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <EventStatusBadge status={event.status} />
                                    </div>
                                    {event.vendors.length === 0 ? (
                                        <p className="text-muted-foreground p-4 text-sm">No vendor chosen yet.</p>
                                    ) : (
                                        <ul className="divide-y">
                                            {event.vendors.map((vendor) => (
                                                <li key={vendor.need_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                                    <div className="min-w-0">
                                                        <p className="font-medium">{vendor.name}</p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {vendor.category}
                                                            {vendor.contact ? ` · ${vendor.contact}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm tabular-nums">{formatRupiah(vendor.price)}</span>
                                                        <ProcurementStatusBadge status={vendor.procurement_status} />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}
                        </div>
                    )
                ) : vendors.length === 0 ? (
                    <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                        {totalVendors === 0 ? 'No vendors chosen yet.' : 'Nothing matches your search.'}
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {vendors.map((entry) => (
                            <div key={entry.name} className="bg-card space-y-3 rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="leading-tight font-semibold">{entry.name}</p>
                                    <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-2 py-0.5 text-xs">
                                        {entry.uses.length}x used
                                    </span>
                                </div>
                                <ul className="space-y-1.5 text-sm">
                                    {entry.uses.map((use) => (
                                        <li key={use.vendor.need_id} className="flex justify-between gap-2">
                                            <span className="min-w-0">
                                                <Link href={route('events.show', use.event.id)} className="hover:underline">
                                                    {use.event.name}
                                                </Link>
                                                <span className="text-muted-foreground text-xs"> · {use.vendor.category}</span>
                                            </span>
                                            <span className="tabular-nums">{formatRupiah(use.vendor.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

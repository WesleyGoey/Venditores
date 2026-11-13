import Heading from '@/components/heading';
import SortSelect from '@/components/sort-select';
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

type EventSort = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'spend_desc';
type VendorSort = 'uses_desc' | 'name_asc' | 'name_desc';

const eventSortOptions: { value: EventSort; label: string }[] = [
    { value: 'date_desc', label: 'Newest first' },
    { value: 'date_asc', label: 'Oldest first' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'spend_desc', label: 'Highest spend' },
];

const vendorSortOptions: { value: VendorSort; label: string }[] = [
    { value: 'uses_desc', label: 'Most used' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
];

const spend = (event: HistoryEvent) => event.vendors.reduce((sum, vendor) => sum + vendor.price, 0);

export default function HistoryIndex({ events }: { events: HistoryEvent[] }) {
    const [tab, setTab] = useState<'events' | 'vendors'>('events');
    const [query, setQuery] = useState('');
    const [eventSort, setEventSort] = useState<EventSort>('date_desc');
    const [vendorSort, setVendorSort] = useState<VendorSort>('uses_desc');
    const needle = query.trim().toLowerCase();

    const shownEvents = useMemo(() => {
        const compare: Record<EventSort, (a: HistoryEvent, b: HistoryEvent) => number> = {
            date_desc: (a, b) => b.event_date.localeCompare(a.event_date),
            date_asc: (a, b) => a.event_date.localeCompare(b.event_date),
            name_asc: (a, b) => a.name.localeCompare(b.name),
            name_desc: (a, b) => b.name.localeCompare(a.name),
            spend_desc: (a, b) => spend(b) - spend(a),
        };

        return events
            .filter(
                (event) =>
                    needle === '' ||
                    event.name.toLowerCase().includes(needle) ||
                    event.vendors.some((vendor) => vendor.name.toLowerCase().includes(needle) || vendor.category.toLowerCase().includes(needle)),
            )
            .sort(compare[eventSort]);
    }, [events, needle, eventSort]);

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
            .sort((a, b) => {
                if (vendorSort === 'name_asc') {
                    return a.name.localeCompare(b.name);
                }

                if (vendorSort === 'name_desc') {
                    return b.name.localeCompare(a.name);
                }

                return b.uses.length - a.uses.length || a.name.localeCompare(b.name);
            });
    }, [events, needle, vendorSort]);

    const totalVendors = events.reduce((sum, event) => sum + event.vendors.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History" />
            <div className="flex flex-col gap-4 p-4">
                <Heading title="History" description={`${events.length} events, ${totalVendors} vendors chosen.`} />

                <div className="flex flex-wrap items-center gap-3">
                    <div
                        className="inline-flex rounded-xl border border-white/70 bg-white/40 p-1 text-sm dark:border-white/10 dark:bg-white/5"
                        role="tablist"
                    >
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
                                className={cn(
                                    'rounded-md px-3 py-1.5 font-medium',
                                    tab === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground',
                                )}
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
                    {tab === 'events' ? (
                        <SortSelect value={eventSort} onChange={setEventSort} options={eventSortOptions} />
                    ) : (
                        <SortSelect value={vendorSort} onChange={setVendorSort} options={vendorSortOptions} />
                    )}
                </div>

                {tab === 'events' ? (
                    shownEvents.length === 0 ? (
                        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                            {events.length === 0 ? 'No events yet.' : 'Nothing matches your search.'}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {shownEvents.map((event) => (
                                <section key={event.id} className="glass rounded-2xl">
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
                            <div key={entry.name} className="glass space-y-3 rounded-2xl p-4">
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

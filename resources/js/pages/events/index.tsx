import Heading from '@/components/heading';
import { EventStatusBadge, RiskBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatRupiah } from '@/lib/format';
import { type BreadcrumbItem, type EventStatus, type RiskLevel } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarPlus, MapPin } from 'lucide-react';

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

export default function EventsIndex({ events }: { events: EventListItem[] }) {
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

                {events.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center">
                        <p className="font-medium">No events yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">Create one and upload its proposal.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {events.map((event) => (
                            <Link
                                key={event.id}
                                href={route('events.show', event.id)}
                                className="bg-card hover:border-primary flex flex-col gap-3 rounded-lg border p-4 transition-colors"
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

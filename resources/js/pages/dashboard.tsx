import { ProcurementStatusBadge, RiskBadge, VitalBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDaysRemaining, formatRupiah } from '@/lib/format';
import { eventMeta, procurementMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type EventStatus, type ProcurementStatus, type RiskAssessment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, CalendarPlus, ClipboardList, FileText, Wallet } from 'lucide-react';

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

interface CriticalNeed {
    id: number;
    category: string;
    is_vital: boolean;
    allocated_budget: number;
    procurement_status: ProcurementStatus;
    event: EventSummary;
}

interface DashboardProps {
    stats: { events: number; vendor_needs: number; quotes: number; total_budget: number };
    eventStatusCounts: StatusCount<EventStatus>[];
    procurementStatusCounts: StatusCount<ProcurementStatus>[];
    criticalNeeds: CriticalNeed[];
    warnings: (RiskAssessment & { event: EventSummary })[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

function StatusBreakdown<T extends string>({ items, solid }: { items: StatusCount<T>[]; solid: (value: T) => string }) {
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.value} className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <span className={cn('size-2 rounded-full', solid(item.value))} aria-hidden />
                            {item.label}
                        </span>
                        <span className="font-medium tabular-nums">{item.count}</span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                            className={cn('h-full rounded-full', solid(item.value))}
                            style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function Dashboard({ stats, eventStatusCounts, procurementStatusCounts, criticalNeeds, warnings }: DashboardProps) {
    const statCards = [
        {
            label: 'Events',
            value: stats.events.toLocaleString('id-ID'),
            icon: CalendarDays,
            tone: 'from-indigo-500 to-violet-500',
            card: 'border-t-indigo-500',
        },
        {
            label: 'Vendor needs',
            value: stats.vendor_needs.toLocaleString('id-ID'),
            icon: ClipboardList,
            tone: 'from-sky-500 to-cyan-500',
            card: 'border-t-sky-500',
        },
        {
            label: 'Quotes received',
            value: stats.quotes.toLocaleString('id-ID'),
            icon: FileText,
            tone: 'from-amber-500 to-orange-500',
            card: 'border-t-amber-500',
        },
        {
            label: 'Total budget',
            value: formatRupiah(stats.total_budget),
            icon: Wallet,
            tone: 'from-emerald-500 to-teal-500',
            card: 'border-t-emerald-500',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Procurement overview</h1>
                        <p className="text-muted-foreground text-sm">Status and risk across all of your events.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('events.create')}>
                            <CalendarPlus className="size-4" />
                            New event
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat) => (
                        <Card key={stat.label} className={cn('border-t-4', stat.card)}>
                            <CardContent className="space-y-1 p-5">
                                <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                                    <span>{stat.label}</span>
                                    <span
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                                            stat.tone,
                                        )}
                                    >
                                        <stat.icon className="size-4" />
                                    </span>
                                </div>
                                <p className={cn('font-semibold tabular-nums', stat.value.length > 12 ? 'text-xl' : 'text-2xl')}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-t-4 border-t-amber-500 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <AlertTriangle className="size-4 text-amber-500" />
                                Early warnings
                            </CardTitle>
                            <CardDescription>Analyzed events within 60 days of their date.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {warnings.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No deadline risks right now.</p>
                            ) : (
                                <ul className="divide-y">
                                    {warnings.map((warning) => (
                                        <li
                                            key={warning.event.id}
                                            className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="min-w-0 space-y-1">
                                                <Link href={route('events.show', warning.event.id)} className="font-medium hover:underline">
                                                    {warning.event.name}
                                                </Link>
                                                <p className="text-muted-foreground text-xs">
                                                    {formatDate(warning.event.event_date)} · {formatDaysRemaining(warning.days_remaining)} ·{' '}
                                                    {warning.unsecured_needs} needs without a deal
                                                </p>
                                                {warning.unsecured_vital_needs.length > 0 && (
                                                    <p className="text-xs text-red-600 dark:text-red-400">
                                                        Vital still open: {warning.unsecured_vital_needs.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                            <RiskBadge level={warning.level} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-indigo-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Events by status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusBreakdown items={eventStatusCounts} solid={(value) => eventMeta[value].solid} />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-t-4 border-t-rose-500 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Critical vendor needs</CardTitle>
                            <CardDescription>Needs with no quotes yet, or whose quotes were all rejected.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {criticalNeeds.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Every open vendor need has at least one active quote.</p>
                            ) : (
                                <ul className="divide-y">
                                    {criticalNeeds.map((need) => (
                                        <li key={need.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route('events.vendor-needs.show', [need.event.id, need.id])}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {need.category}
                                                    </Link>
                                                    {need.is_vital && <VitalBadge />}
                                                </div>
                                                <p className="text-muted-foreground text-xs">
                                                    {need.event.name} · {formatDate(need.event.event_date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm tabular-nums">{formatRupiah(need.allocated_budget)}</span>
                                                <ProcurementStatusBadge status={need.procurement_status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-violet-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Procurement pipeline</CardTitle>
                            <CardDescription>How far each vendor need has come.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatusBreakdown items={procurementStatusCounts} solid={(value) => procurementMeta[value].solid} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

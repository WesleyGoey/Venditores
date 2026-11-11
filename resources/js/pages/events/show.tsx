import ProcurementStatusSelect from '@/components/procurement-status-select';
import { EventStatusBadge, RiskBadge, VitalBadge } from '@/components/status-badges';
import StatusGuide from '@/components/status-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VendorNeedFormDialog from '@/components/vendor-need-form-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDaysRemaining, formatPercentage, formatRupiah } from '@/lib/format';
import { riskMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Option, type ProcurementStatus, type RiskAssessment, type VenditoresEvent } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, FileText, LoaderCircle, MapPin, Pencil, Plus, RotateCcw, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
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
    const remainingBudget = event.total_budget - allocatedBudget;
    const isCompleted = event.status === 'completed';

    const analyze = () => {
        if (event.vendor_needs.length > 0 && !confirm('Re-analyzing replaces all current vendor needs and their quotes. Continue?')) {
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
        if (confirm(`Delete "${event.name}" with all of its vendor needs and quotes?`)) {
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
                    <Card className="border-t-4 border-t-violet-500 bg-gradient-to-br from-violet-50/70 to-transparent lg:col-span-2 dark:from-violet-950/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
                                AI proposal analysis
                            </CardTitle>
                            <CardDescription>
                                {event.analyzed_at
                                    ? `Last analyzed ${new Date(event.analyzed_at).toLocaleString('en-GB')}`
                                    : 'Gemini reads the proposal PDF, lists the vendor categories you need and splits the budget across them.'}
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
                                            <p className="text-muted-foreground text-xs">Estimated attendees</p>
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
                                    {analyzing
                                        ? 'Analyzing proposal… this can take a minute'
                                        : event.analyzed_at
                                          ? 'Re-analyze proposal'
                                          : 'Analyze proposal with AI'}
                                </Button>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    <Link href={route('events.edit', event.id)} className="text-foreground underline underline-offset-4">
                                        Upload a proposal PDF
                                    </Link>{' '}
                                    to enable the AI analysis, or add vendor needs manually below.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={cn('border-l-4', riskMeta[risk.level].panel)}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShieldAlert className="size-4" />
                                Risk monitor
                            </CardTitle>
                            <CardDescription>{formatDaysRemaining(risk.days_remaining)} until the event</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <RiskBadge level={risk.level} />
                                <span className="text-muted-foreground text-sm">{risk.unsecured_needs} needs without a deal</span>
                            </div>
                            {risk.unsecured_vital_needs.length > 0 && (
                                <p className="text-sm">
                                    <span className="font-medium text-red-600 dark:text-red-400">Vital needs not secured:</span>{' '}
                                    {risk.unsecured_vital_needs.join(', ')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-t-4 border-t-indigo-500">
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1.5">
                            <CardTitle className="text-lg">Vendor needs &amp; budget allocation</CardTitle>
                            <CardDescription>
                                {formatRupiah(allocatedBudget)} allocated ({formatPercentage(allocatedBudget, event.total_budget)}) ·{' '}
                                <span className={remainingBudget < 0 ? 'font-medium text-red-600 dark:text-red-400' : ''}>
                                    {remainingBudget < 0
                                        ? `${formatRupiah(-remainingBudget)} over budget`
                                        : `${formatRupiah(remainingBudget)} unallocated`}
                                </span>
                            </CardDescription>
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
                    <CardContent>
                        {event.vendor_needs.length === 0 ? (
                            <p className="text-muted-foreground py-6 text-center text-sm">
                                No vendor needs yet. Run the AI analysis or add one manually.
                            </p>
                        ) : (
                            <div className="-mx-6 overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead>
                                        <tr className="border-b bg-indigo-50/60 text-left text-xs text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
                                            <th className="px-6 py-2 font-medium">Category</th>
                                            <th className="px-2 py-2 text-right font-medium">Allocation</th>
                                            <th className="px-2 py-2 font-medium">Status</th>
                                            <th className="px-2 py-2 text-right font-medium">Quotes</th>
                                            <th className="px-6 py-2 text-right font-medium">Best match</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {event.vendor_needs.map((need) => (
                                            <tr key={need.id} className="border-b last:border-0">
                                                <td className="max-w-md px-6 py-3 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('events.vendor-needs.show', [event.id, need.id])}
                                                            className="font-medium underline-offset-4 hover:underline"
                                                        >
                                                            {need.category}
                                                        </Link>
                                                        {need.is_vital && <VitalBadge />}
                                                    </div>
                                                    {need.specification && (
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{need.specification}</p>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 text-right align-top whitespace-nowrap tabular-nums">
                                                    <div>{formatRupiah(need.allocated_budget)}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {formatPercentage(need.allocated_budget, event.total_budget)}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 align-top">
                                                    <ProcurementStatusSelect
                                                        eventId={event.id}
                                                        vendorNeedId={need.id}
                                                        value={need.procurement_status}
                                                        options={procurementStatuses}
                                                    />
                                                </td>
                                                <td className="px-2 py-3 text-right align-top tabular-nums">{need.quotes_count ?? 0}</td>
                                                <td className="px-6 py-3 text-right align-top tabular-nums">
                                                    {need.quotes_max_match_score != null ? `${need.quotes_max_match_score}/100` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

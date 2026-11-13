import QuoteFormDialog from '@/components/quote-form-dialog';
import { RatingSummary } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type RecommendedVendor, type UsedVendor } from '@/types';
import { Link } from '@inertiajs/react';
import { ExternalLink, Plus } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

interface VendorPickerProps {
    eventId: number;
    vendorNeedId: number;
    needCategory: string;
    /** Listed categories that go with the need's category (same category excluded). */
    relatedCategories: string[];
    recommended: RecommendedVendor[];
    used: UsedVendor[];
}

type Tab = 'recommended' | 'history';

/** Filter keys: the need's own category, every category, or one category name. */
const SAME = '__same__';
const ALL = '__all__';

function fits(a: string, b: string): boolean {
    const x = a.trim().toLowerCase();
    const y = b.trim().toLowerCase();

    return x !== '' && y !== '' && (x.includes(y) || y.includes(x));
}

/** 0 = same category as the need, 1 = related category, 2 = anything else. */
function rank(category: string, needCategory: string, related: string[]): 0 | 1 | 2 {
    if (fits(category, needCategory)) {
        return 0;
    }

    return related.some((name) => fits(category, name)) ? 1 : 2;
}

/** Pick a vendor the admin recommends, or one you used before, and add it as a quote. */
export default function VendorPicker({ eventId, vendorNeedId, needCategory, relatedCategories, recommended, used }: VendorPickerProps) {
    const [tab, setTab] = useState<Tab>('recommended');
    const [filter, setFilter] = useState<string>(SAME);

    // Chips: the same category first, then related ones, then the rest, then everything.
    const chips = useMemo(() => {
        const names = Array.from(new Set((tab === 'recommended' ? recommended : used).map((item) => item.category)));
        const others = names.filter((name) => rank(name, needCategory, relatedCategories) > 0);
        const sorted = others.sort(
            (a, b) => rank(a, needCategory, relatedCategories) - rank(b, needCategory, relatedCategories) || a.localeCompare(b),
        );

        return [
            { key: SAME, label: needCategory, group: 'Same' },
            ...sorted.map((name) => ({
                key: name,
                label: name,
                group: rank(name, needCategory, relatedCategories) === 1 ? 'Related' : 'Other',
            })),
            { key: ALL, label: 'All', group: '' },
        ];
    }, [tab, recommended, used, needCategory, relatedCategories]);

    const keep = (category: string) =>
        filter === ALL || (filter === SAME ? rank(category, needCategory, relatedCategories) === 0 : category === filter);

    const changeTab = (next: Tab) => {
        setTab(next);
        setFilter(SAME);
    };

    const quoteTrigger = (
        <Button size="sm" variant="outline" className="shrink-0">
            <Plus className="size-4" />
            Add as quote
        </Button>
    );

    const shownRecommended = recommended.filter((vendor) => keep(vendor.category));
    const shownUsed = used.filter((vendor) => keep(vendor.category));
    const empty = tab === 'recommended' ? shownRecommended.length === 0 : shownUsed.length === 0;

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="text-lg">Pick a vendor</CardTitle>
                    <CardDescription>Choose one and add it straight to your quotes.</CardDescription>
                </div>
                <div className="bg-muted inline-flex rounded-lg p-1 text-sm" role="tablist">
                    {(
                        [
                            ['recommended', `Recommended (${recommended.length})`],
                            ['history', `History (${used.length})`],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={tab === value}
                            onClick={() => changeTab(value)}
                            className={cn('rounded-md px-3 py-1 font-medium', tab === value ? 'bg-card shadow-xs' : 'text-muted-foreground')}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by category">
                    {chips.map((chip, index) => (
                        <Fragment key={chip.key}>
                            {chip.group && chip.group !== chips[index - 1]?.group && (
                                <span className="text-muted-foreground ml-2 text-xs first:ml-0">{chip.group}:</span>
                            )}
                            <button
                                type="button"
                                onClick={() => setFilter(chip.key)}
                                aria-pressed={filter === chip.key}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium',
                                    filter === chip.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                                )}
                            >
                                {chip.label}
                            </button>
                        </Fragment>
                    ))}
                </div>

                {empty ? (
                    <p className="text-muted-foreground text-sm">
                        {tab === 'recommended'
                            ? 'No recommended vendors in this category yet. Check the related categories.'
                            : 'No vendors used before. Vendors you choose in an event show up here.'}
                    </p>
                ) : tab === 'recommended' ? (
                    <ul className="divide-y">
                        {shownRecommended.map((vendor) => (
                            <li key={vendor.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="font-medium">{vendor.name}</p>
                                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">{vendor.category}</span>
                                        <RatingSummary rating={vendor.rating} count={vendor.reviews_count} />
                                    </div>
                                    {vendor.description && <p className="text-sm">{vendor.description}</p>}
                                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                        {vendor.price_estimate !== null && <span>~ {formatRupiah(vendor.price_estimate)}</span>}
                                        {vendor.contact && <span>{vendor.contact}</span>}
                                        {vendor.website && (
                                            <a
                                                href={vendor.website}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-primary inline-flex items-center gap-1 hover:underline"
                                            >
                                                <ExternalLink className="size-3" />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <QuoteFormDialog
                                    eventId={eventId}
                                    vendorNeedId={vendorNeedId}
                                    defaults={{
                                        vendor_name: vendor.name,
                                        vendor_contact: [vendor.contact, vendor.website].filter(Boolean).join(' · '),
                                        price: vendor.price_estimate !== null ? String(vendor.price_estimate) : '',
                                        notes: vendor.description ?? '',
                                    }}
                                    trigger={quoteTrigger}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="divide-y">
                        {shownUsed.map((vendor) => (
                            <li
                                key={`${vendor.name}-${vendor.category}`}
                                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="font-medium">{vendor.name}</p>
                                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">{vendor.category}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Used for {vendor.event} ({formatDate(vendor.event_date)}) at {formatRupiah(vendor.price)}
                                        {vendor.contact ? ` · ${vendor.contact}` : ''}
                                    </p>
                                </div>
                                <QuoteFormDialog
                                    eventId={eventId}
                                    vendorNeedId={vendorNeedId}
                                    defaults={{
                                        vendor_name: vendor.name,
                                        vendor_contact: vendor.contact ?? '',
                                        price: String(vendor.price),
                                        notes: vendor.notes ?? '',
                                    }}
                                    trigger={quoteTrigger}
                                />
                            </li>
                        ))}
                    </ul>
                )}

                <p className="text-muted-foreground text-xs">
                    <Link href={route('vendors.index')} className="hover:underline">
                        See all vendors and reviews
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}

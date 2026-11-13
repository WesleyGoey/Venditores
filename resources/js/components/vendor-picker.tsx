import QuoteFormDialog from '@/components/quote-form-dialog';
import { RatingSummary } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type RecommendedVendor, type UsedVendor } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ExternalLink, Plus, SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';

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

/** Only two filters: the need's own and related categories, or everything else. */
type Filter = 'same' | 'other';

/** Vendors per page, two rows of the two-column grid. */
const PAGE_SIZE = 4;

function fits(a: string, b: string): boolean {
    const x = a.trim().toLowerCase();
    const y = b.trim().toLowerCase();

    return x !== '' && y !== '' && (x.includes(y) || y.includes(x));
}

/** True when the category is the need's own or one that goes with it (e.g. Catering and Consumption). */
function isSame(category: string, needCategory: string, related: string[]): boolean {
    return fits(category, needCategory) || related.some((name) => fits(category, name));
}

interface VendorCardProps {
    eventId: number;
    vendorNeedId: number;
    name: string;
    category: string;
    rating?: ReactNode;
    text?: string | null;
    priceLabel: string;
    price: number | null;
    links: ReactNode;
    defaults: { vendor_name: string; vendor_contact: string; price: string; notes: string };
}

/** One vendor as a card: who, what they offer, price, and one clear action. */
function VendorCard({ eventId, vendorNeedId, name, category, rating, text, priceLabel, price, links, defaults }: VendorCardProps) {
    return (
        <li className="flex flex-col gap-3 rounded-xl border border-white/70 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold">{name}</p>
                    <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium">{category}</span>
                </div>
                {rating}
            </div>

            {text && <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{text}</p>}

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/10">
                <div>
                    <p className="text-muted-foreground text-xs">{priceLabel}</p>
                    <p className="font-semibold tabular-nums">{price !== null ? formatRupiah(price) : 'No price yet'}</p>
                </div>
                <QuoteFormDialog
                    eventId={eventId}
                    vendorNeedId={vendorNeedId}
                    defaults={defaults}
                    trigger={
                        <Button size="sm" className="shrink-0">
                            <Plus className="size-4" />
                            Add as quote
                        </Button>
                    }
                />
            </div>

            {links}
        </li>
    );
}

/** Pick a vendor the admin recommends, or one you used before, and add it as a quote. */
export default function VendorPicker({ eventId, vendorNeedId, needCategory, relatedCategories, recommended, used }: VendorPickerProps) {
    const [tab, setTab] = useState<Tab>('recommended');
    const [filter, setFilter] = useState<Filter>('same');
    const [page, setPage] = useState(1);

    const keep = (category: string) => isSame(category, needCategory, relatedCategories) === (filter === 'same');

    const shownRecommended = recommended.filter((vendor) => keep(vendor.category));
    const shownUsed = used.filter((vendor) => keep(vendor.category));
    const total = tab === 'recommended' ? shownRecommended.length : shownUsed.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = <T,>(items: T[]) => items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const count = (items: { category: string }[], want: Filter) =>
        items.filter((item) => isSame(item.category, needCategory, relatedCategories) === (want === 'same')).length;
    const tabItems = tab === 'recommended' ? recommended : used;

    const change = (next: () => void) => {
        next();
        setPage(1);
    };

    const sameLabel = [needCategory, ...relatedCategories].join(', ');

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="text-lg">Pick a vendor</CardTitle>
                    <CardDescription>Choose one and add it straight to your quotes.</CardDescription>
                </div>
                <div
                    className="inline-flex self-start rounded-xl border border-white/70 bg-white/40 p-1 text-sm dark:border-white/10 dark:bg-white/5"
                    role="tablist"
                >
                    {(
                        [
                            ['recommended', 'Recommended', recommended.length],
                            ['history', 'History', used.length],
                        ] as const
                    ).map(([value, label, n]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={tab === value}
                            onClick={() => change(() => setTab(value))}
                            className={cn(
                                'rounded-lg px-3 py-1.5 font-medium transition-colors',
                                tab === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {label} <span className="opacity-70">{n}</span>
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-2" aria-label="Filter by category">
                    {(
                        [
                            ['same', 'Same category'],
                            ['other', 'Other'],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => change(() => setFilter(value))}
                            aria-pressed={filter === value}
                            className={cn(
                                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                                filter === value
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-white/70 bg-white/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                            )}
                        >
                            {label} <span className="opacity-70">{count(tabItems, value)}</span>
                        </button>
                    ))}
                    {filter === 'same' && <span className="text-muted-foreground text-xs">{sameLabel}</span>}
                </div>

                {total === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/10 px-4 py-10 text-center text-sm dark:border-white/15">
                        <SearchX className="size-6 opacity-60" />
                        <p className="max-w-sm">
                            {tab === 'recommended'
                                ? 'No recommended vendors here yet. Try the Other filter.'
                                : 'No vendors used before. Vendors you choose in an event show up here.'}
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-3 md:grid-cols-2">
                        {tab === 'recommended'
                            ? slice(shownRecommended).map((vendor) => (
                                  <VendorCard
                                      key={vendor.id}
                                      eventId={eventId}
                                      vendorNeedId={vendorNeedId}
                                      name={vendor.name}
                                      category={vendor.category}
                                      rating={<RatingSummary rating={vendor.rating} count={vendor.reviews_count} />}
                                      text={vendor.description}
                                      priceLabel="Estimate"
                                      price={vendor.price_estimate}
                                      links={
                                          (vendor.contact || vendor.website) && (
                                              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
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
                                          )
                                      }
                                      defaults={{
                                          vendor_name: vendor.name,
                                          vendor_contact: [vendor.contact, vendor.website].filter(Boolean).join(' · '),
                                          price: vendor.price_estimate !== null ? String(vendor.price_estimate) : '',
                                          notes: vendor.description ?? '',
                                      }}
                                  />
                              ))
                            : slice(shownUsed).map((vendor) => (
                                  <VendorCard
                                      key={`${vendor.name}-${vendor.category}`}
                                      eventId={eventId}
                                      vendorNeedId={vendorNeedId}
                                      name={vendor.name}
                                      category={vendor.category}
                                      text={`Used for ${vendor.event} (${formatDate(vendor.event_date)})`}
                                      priceLabel="Paid before"
                                      price={vendor.price}
                                      links={vendor.contact && <p className="text-muted-foreground text-xs">{vendor.contact}</p>}
                                      defaults={{
                                          vendor_name: vendor.name,
                                          vendor_contact: vendor.contact ?? '',
                                          price: String(vendor.price),
                                          notes: vendor.notes ?? '',
                                      }}
                                  />
                              ))}
                    </ul>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route('vendors.index')} className="text-muted-foreground hover:text-foreground text-xs hover:underline">
                        See all vendors and reviews
                    </Link>
                    {pages > 1 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground text-xs tabular-nums">
                                {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, total)} of {total}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                aria-label="Previous page"
                                disabled={current === 1}
                                onClick={() => setPage(current - 1)}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                aria-label="Next page"
                                disabled={current === pages}
                                onClick={() => setPage(current + 1)}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

import Heading from '@/components/heading';
import SortSelect from '@/components/sort-select';
import { RatingSummary } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VendorFormDialog from '@/components/vendor-form-dialog';
import VendorOwnerDialog from '@/components/vendor-owner-dialog';
import VendorRejectDialog from '@/components/vendor-reject-dialog';
import VendorReviewsDialog from '@/components/vendor-reviews-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/format';
import { linkLabel } from '@/lib/social';
import { cn } from '@/lib/utils';
import { sortVendors, vendorSortOptions, type VendorSort } from '@/lib/vendor-sort';
import { type QuoteStatus, type RecommendedVendor, type SharedData, type VendorReview } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type DirectoryVendor = RecommendedVendor & {
    /** Only sent to the admin: the vendor account that manages it, or null when the admin added it. */
    owner: string | null;
    reviews: VendorReview[];
    my_review: { rating: number; comment: string | null } | null;
};

interface UserVendor {
    id: number;
    name: string;
    contact: string | null;
    notes: string | null;
    price: number;
    category: string;
    event: string;
    user: string;
    status: QuoteStatus;
    rating: number | null;
    reviews_count: number;
}

/** A vendor a vendor account listed, waiting for the admin. */
interface PendingVendor {
    id: number;
    name: string;
    category: string;
    description: string | null;
    contact: string | null;
    website: string | null;
    price_estimate: number | null;
    owner: string | null;
    owner_email: string | null;
    listed_at: string;
    /** A recommended vendor already has this name. */
    already_listed: boolean;
}

interface VendorsIndexProps {
    vendors: DirectoryVendor[];
    /** Only sent to the admin. */
    userVendors: UserVendor[] | null;
    /** Only sent to the admin. */
    pendingVendors: PendingVendor[] | null;
}

/** What the user did with the vendor, in words that help the admin judge it. */
const outcome: Record<QuoteStatus, string> = {
    accepted: 'Chosen for the event',
    pending: 'Still comparing',
    rejected: 'Declined',
};

type UserSort = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category';

const userSortOptions: { value: UserSort; label: string }[] = [
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'category', label: 'Category' },
];

function sortUserVendors(items: UserVendor[], sort: UserSort): UserVendor[] {
    const compare: Record<UserSort, (a: UserVendor, b: UserVendor) => number> = {
        name_asc: (a, b) => a.name.localeCompare(b.name),
        name_desc: (a, b) => b.name.localeCompare(a.name),
        price_asc: (a, b) => a.price - b.price,
        price_desc: (a, b) => b.price - a.price,
        category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    };

    return [...items].sort(compare[sort]);
}

function matches(query: string, ...fields: (string | null)[]): boolean {
    const needle = query.trim().toLowerCase();

    return needle === '' || fields.some((field) => field?.toLowerCase().includes(needle));
}

export default function VendorsIndex({ vendors, userVendors, pendingVendors }: VendorsIndexProps) {
    const { auth, vendorCategories } = usePage<SharedData>().props;
    const isAdmin = auth.user.is_admin;
    // Something waiting for the admin is the first thing to see.
    const [tab, setTab] = useState<'recommended' | 'users' | 'pending'>(pendingVendors && pendingVendors.length > 0 ? 'pending' : 'recommended');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState<VendorSort>('name_asc');
    const [userSort, setUserSort] = useState<UserSort>('name_asc');
    const categories = useMemo(() => {
        const used = new Set(vendors.map((vendor) => vendor.category));

        return ['All', ...vendorCategories.filter((name) => used.has(name))];
    }, [vendors, vendorCategories]);

    const shownVendors = useMemo(
        () =>
            sortVendors(
                vendors.filter((v) => (category === 'All' || v.category === category) && matches(query, v.name, v.category, v.description)),
                sort,
            ),
        [vendors, query, category, sort],
    );
    const shownUserVendors = useMemo(
        () =>
            sortUserVendors(
                (userVendors ?? []).filter((v) => matches(query, v.name, v.category, v.event, v.user)),
                userSort,
            ),
        [userVendors, query, userSort],
    );

    const shownPending = useMemo(() => (pendingVendors ?? []).filter((v) => matches(query, v.name, v.category, v.owner)), [pendingVendors, query]);

    const approve = (vendor: PendingVendor) => {
        router.patch(route('vendors.status.update', vendor.id), { status: 'approved' }, { preserveScroll: true });
    };

    const recommendedNames = useMemo(() => new Set(vendors.map((vendor) => vendor.name.trim().toLowerCase())), [vendors]);

    const deleteVendor = (vendor: RecommendedVendor) => {
        if (confirm(`Delete "${vendor.name}" and its reviews?`)) {
            router.delete(route('vendors.destroy', vendor.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title="Vendors" />
            <Heading
                title={isAdmin ? 'Recommended vendors' : 'Vendors'}
                description={
                    isAdmin
                        ? 'Users see these on every vendor need with the same category. Vendors users typed in themselves are under Added by users.'
                        : 'Recommended by the admin, with ratings from other committees. Rate the ones you worked with.'
                }
            >
                {isAdmin && (
                    <VendorFormDialog
                        trigger={
                            <Button>
                                <Plus />
                                Add vendor
                            </Button>
                        }
                    />
                )}
            </Heading>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {userVendors !== null && (
                        <div
                            className="inline-flex rounded-xl border border-white/70 bg-white/40 p-1 text-sm dark:border-white/10 dark:bg-white/5"
                            role="tablist"
                        >
                            {(
                                [
                                    ['pending', `Waiting for approval (${pendingVendors?.length ?? 0})`],
                                    ['recommended', `Recommended (${vendors.length})`],
                                    ['users', `Added by users (${userVendors.length})`],
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
                                        tab === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative w-full max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or category" className="pl-8" />
                    </div>
                    {tab === 'recommended' ? (
                        <SortSelect value={sort} onChange={setSort} options={vendorSortOptions} />
                    ) : tab === 'users' ? (
                        <SortSelect value={userSort} onChange={setUserSort} options={userSortOptions} />
                    ) : null}
                </div>

                {tab === 'recommended' && categories.length > 2 && (
                    <div className="flex flex-wrap gap-1.5" aria-label="Filter by category">
                        {categories.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setCategory(name)}
                                aria-pressed={category === name}
                                className={cn(
                                    'min-h-9 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium',
                                    category === name
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-foreground/15 bg-white/40 hover:bg-white/80 dark:border-white/10 dark:bg-white/5',
                                )}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'pending' ? (
                    <div className="sheet overflow-hidden rounded-2xl">
                        {shownPending.length === 0 ? (
                            <p className="text-muted-foreground px-6 py-10 text-sm">
                                {(pendingVendors ?? []).length === 0
                                    ? 'Nothing is waiting. When a vendor account lists a vendor, it appears here for you to approve or reject.'
                                    : 'No waiting vendor matches this search.'}
                            </p>
                        ) : (
                            <ul className="divide-foreground/10 divide-y">
                                {shownPending.map((vendor) => (
                                    <li key={vendor.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-semibold">{vendor.name}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {vendor.category} · listed {vendor.listed_at} by {vendor.owner ?? 'a deleted account'}
                                                {vendor.owner_email ? ` (${vendor.owner_email})` : ''}
                                            </p>
                                            {vendor.already_listed && (
                                                <p className="text-sm font-medium">
                                                    A recommended vendor already has this name. Check it is not a duplicate before approving.
                                                </p>
                                            )}
                                            {vendor.description && <p className="max-w-prose text-sm">{vendor.description}</p>}
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
                                                        {linkLabel(vendor.website)}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => approve(vendor)} aria-label={`Approve ${vendor.name}`}>
                                                Approve
                                            </Button>
                                            <VendorRejectDialog vendorId={vendor.id} vendorName={vendor.name} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : tab === 'recommended' ? (
                    shownVendors.length === 0 ? (
                        vendors.length === 0 ? (
                            <div className="sheet rounded-2xl px-6 py-10">
                                <p className="font-display text-xl font-semibold">No recommended vendors yet</p>
                                {isAdmin ? (
                                    <>
                                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                                            Add the vendors you trust. Each one shows up on users' vendor needs with the same category, ready to add
                                            as a quote.
                                        </p>
                                        <VendorFormDialog
                                            trigger={
                                                <Button className="mt-5">
                                                    <Plus />
                                                    Add the first vendor
                                                </Button>
                                            }
                                        />
                                    </>
                                ) : (
                                    <p className="text-muted-foreground mt-1 max-w-md text-sm">
                                        The admin has not recommended any vendor yet. To find vendors now, open a vendor need in{' '}
                                        <Link href={route('events.index')} className="text-foreground font-medium underline underline-offset-4">
                                            your events
                                        </Link>{' '}
                                        and use Find vendors online.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="sheet text-muted-foreground rounded-2xl px-6 py-10 text-sm">No vendor matches this search or category.</p>
                        )
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {shownVendors.map((vendor) => (
                                <div key={vendor.id} className="sheet flex flex-col gap-3 rounded-2xl p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="leading-tight font-semibold">{vendor.name}</p>
                                            <span className="text-muted-foreground shrink-0 text-xs">{vendor.category}</span>
                                        </div>
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
                                                {linkLabel(vendor.website)}
                                            </a>
                                        )}
                                    </div>
                                    <div className="mt-auto flex items-center gap-1 border-t pt-3">
                                        <VendorReviewsDialog key={`${vendor.id}-${vendor.my_review?.rating ?? 0}`} vendor={vendor} />
                                        {isAdmin && (
                                            <div className="ml-auto flex items-center gap-1">
                                                <VendorOwnerDialog vendorId={vendor.id} vendorName={vendor.name} owner={vendor.owner} />
                                                <VendorFormDialog
                                                    vendor={vendor}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="size-8" aria-label="Edit vendor">
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    aria-label="Delete vendor"
                                                    onClick={() => deleteVendor(vendor)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="sheet overflow-x-auto rounded-2xl">
                        {shownUserVendors.length === 0 ? (
                            <p className="text-muted-foreground px-6 py-10 text-sm">
                                No user has typed in a vendor of their own yet. They appear here once a user adds a quote by hand or from Find vendors
                                online.
                            </p>
                        ) : (
                            <table className="w-full min-w-[820px] text-sm">
                                <thead>
                                    <tr className="text-muted-foreground border-foreground/10 border-b text-left text-xs">
                                        <th className="px-4 py-2 font-medium">Vendor</th>
                                        <th className="px-2 py-2 font-medium">Category</th>
                                        <th className="px-2 py-2 text-right font-medium">Price</th>
                                        <th className="px-2 py-2 font-medium">Outcome</th>
                                        <th className="px-2 py-2 font-medium">Added by</th>
                                        <th className="px-4 py-2 font-medium">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shownUserVendors.map((vendor) => (
                                        <tr key={vendor.id} className="border-foreground/10 border-b last:border-0">
                                            <td className="px-4 py-3 align-top">
                                                <p className="font-medium">{vendor.name}</p>
                                                {vendor.contact && <p className="text-muted-foreground text-xs">{vendor.contact}</p>}
                                                <RatingSummary rating={vendor.rating} count={vendor.reviews_count} />
                                            </td>
                                            <td className="px-2 py-3 align-top">{vendor.category}</td>
                                            <td className="px-2 py-3 text-right align-top whitespace-nowrap tabular-nums">
                                                {formatRupiah(vendor.price)}
                                            </td>
                                            <td className="px-2 py-3 align-top">{outcome[vendor.status]}</td>
                                            <td className="px-2 py-3 align-top">
                                                <p>{vendor.user}</p>
                                                <p className="text-muted-foreground text-xs">{vendor.event}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right align-top">
                                                {recommendedNames.has(vendor.name.trim().toLowerCase()) ? (
                                                    <span className="text-muted-foreground text-xs">Already recommended</span>
                                                ) : (
                                                    <VendorFormDialog
                                                        initial={{
                                                            name: vendor.name,
                                                            category: vendor.category,
                                                            description: vendor.notes ?? '',
                                                            contact: vendor.contact && !/^https?:\/\//i.test(vendor.contact) ? vendor.contact : '',
                                                            website: vendor.contact && /^https?:\/\//i.test(vendor.contact) ? vendor.contact : '',
                                                            price_estimate: String(vendor.price),
                                                        }}
                                                        trigger={
                                                            <Button size="sm" variant="outline">
                                                                Recommend
                                                            </Button>
                                                        }
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

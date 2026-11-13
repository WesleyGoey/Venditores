import Heading from '@/components/heading';
import { RatingSummary } from '@/components/star-rating';
import { QuoteStatusBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VendorFormDialog from '@/components/vendor-form-dialog';
import VendorReviewsDialog from '@/components/vendor-reviews-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type QuoteStatus, type RecommendedVendor, type SharedData, type VendorReview } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type DirectoryVendor = RecommendedVendor & {
    reviews: VendorReview[];
    my_review: { rating: number; comment: string | null } | null;
};

interface UserVendor {
    id: number;
    name: string;
    contact: string | null;
    price: number;
    category: string;
    event: string;
    user: string;
    status: QuoteStatus;
}

interface VendorsIndexProps {
    vendors: DirectoryVendor[];
    /** Only sent to the admin. */
    userVendors: UserVendor[] | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vendors', href: '/vendors' }];

function matches(query: string, ...fields: (string | null)[]): boolean {
    const needle = query.trim().toLowerCase();

    return needle === '' || fields.some((field) => field?.toLowerCase().includes(needle));
}

export default function VendorsIndex({ vendors, userVendors }: VendorsIndexProps) {
    const { auth, vendorCategories } = usePage<SharedData>().props;
    const isAdmin = auth.user.is_admin;
    const [tab, setTab] = useState<'recommended' | 'users'>('recommended');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');
    const categories = useMemo(() => {
        const used = new Set(vendors.map((vendor) => vendor.category));

        return ['All', ...vendorCategories.filter((name) => used.has(name))];
    }, [vendors, vendorCategories]);

    const shownVendors = useMemo(
        () => vendors.filter((v) => (category === 'All' || v.category === category) && matches(query, v.name, v.category, v.description)),
        [vendors, query, category],
    );
    const shownUserVendors = useMemo(
        () => (userVendors ?? []).filter((v) => matches(query, v.name, v.category, v.event, v.user)),
        [userVendors, query],
    );

    const deleteVendor = (vendor: RecommendedVendor) => {
        if (confirm(`Delete "${vendor.name}" and its reviews?`)) {
            router.delete(route('vendors.destroy', vendor.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vendors" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Vendors"
                        description={
                            isAdmin
                                ? 'Manage recommended vendors and see what users added.'
                                : 'Recommended by the admin. Rate the ones you worked with.'
                        }
                    />
                    {isAdmin && (
                        <VendorFormDialog
                            trigger={
                                <Button>
                                    <Plus className="size-4" />
                                    Add vendor
                                </Button>
                            }
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {userVendors !== null && (
                        <div className="bg-muted inline-flex rounded-lg p-1 text-sm" role="tablist">
                            {(
                                [
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
                                        tab === value ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
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
                                    'rounded-full border px-3 py-1 text-xs font-medium',
                                    category === name ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                                )}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'recommended' ? (
                    shownVendors.length === 0 ? (
                        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                            {vendors.length === 0 ? 'No recommended vendors yet.' : 'Nothing matches your search.'}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {shownVendors.map((vendor) => (
                                <div key={vendor.id} className="bg-card flex flex-col gap-3 rounded-lg border p-4">
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="leading-tight font-semibold">{vendor.name}</p>
                                            <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-2 py-0.5 text-xs">
                                                {vendor.category}
                                            </span>
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
                                                Website
                                            </a>
                                        )}
                                    </div>
                                    <div className="mt-auto flex items-center gap-1 border-t pt-3">
                                        <VendorReviewsDialog key={`${vendor.id}-${vendor.my_review?.rating ?? 0}`} vendor={vendor} />
                                        {isAdmin && (
                                            <div className="ml-auto flex gap-1">
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
                    <div className="bg-card overflow-x-auto rounded-lg border">
                        {shownUserVendors.length === 0 ? (
                            <p className="text-muted-foreground p-10 text-center text-sm">No vendors added by users yet.</p>
                        ) : (
                            <table className="w-full min-w-[720px] text-sm">
                                <thead>
                                    <tr className="text-muted-foreground border-b text-left text-xs">
                                        <th className="px-4 py-2 font-medium">Vendor</th>
                                        <th className="px-2 py-2 font-medium">Category</th>
                                        <th className="px-2 py-2 text-right font-medium">Price</th>
                                        <th className="px-2 py-2 font-medium">Status</th>
                                        <th className="px-4 py-2 font-medium">Added by</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shownUserVendors.map((vendor) => (
                                        <tr key={vendor.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 align-top">
                                                <p className="font-medium">{vendor.name}</p>
                                                {vendor.contact && <p className="text-muted-foreground text-xs">{vendor.contact}</p>}
                                            </td>
                                            <td className="px-2 py-3 align-top">{vendor.category}</td>
                                            <td className="px-2 py-3 text-right align-top whitespace-nowrap tabular-nums">
                                                {formatRupiah(vendor.price)}
                                            </td>
                                            <td className="px-2 py-3 align-top">
                                                <QuoteStatusBadge status={vendor.status} />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <p>{vendor.user}</p>
                                                <p className="text-muted-foreground text-xs">{vendor.event}</p>
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

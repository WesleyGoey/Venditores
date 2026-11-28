import Heading from '@/components/heading';
import { RatingSummary } from '@/components/star-rating';
import { VendorStatusBadge } from '@/components/status-badges';
import { Button } from '@/components/ui/button';
import VendorFormDialog from '@/components/vendor-form-dialog';
import VendorReviewsDialog from '@/components/vendor-reviews-dialog';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/format';
import { linkLabel } from '@/lib/social';
import { type RecommendedVendor, type VendorReview, type VendorStatus } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';

type MyVendor = RecommendedVendor & {
    status: VendorStatus;
    admin_note: string | null;
    reviews: VendorReview[];
    my_review: null;
};

/** What a vendor account sees: the vendors it listed, whether the admin approved them, and what committees wrote. */
export default function MyVendors({ vendors }: { vendors: MyVendor[] }) {
    const deleteVendor = (vendor: MyVendor) => {
        if (confirm(`Delete "${vendor.name}" and its reviews?`)) {
            router.delete(route('my-vendors.destroy', vendor.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title="My vendors" />
            <Heading
                title="My vendors"
                description="List the vendors you run. The admin approves each one before committees see it as recommended. Their reviews show up here."
            >
                <VendorFormDialog
                    mine
                    trigger={
                        <Button>
                            <Plus />
                            Add vendor
                        </Button>
                    }
                />
            </Heading>

            {vendors.length === 0 ? (
                <div className="sheet rounded-2xl px-6 py-10">
                    <p className="font-display text-xl font-semibold">You have not listed a vendor yet</p>
                    <p className="text-muted-foreground mt-1 max-w-md text-sm">
                        Add your first vendor with its category, a contact and a typical price. After the admin approves it, event committees find it
                        under recommended vendors.
                    </p>
                    <VendorFormDialog
                        mine
                        trigger={
                            <Button className="mt-5">
                                <Plus />
                                Add your first vendor
                            </Button>
                        }
                    />
                </div>
            ) : (
                <ul className="sheet divide-foreground/10 divide-y overflow-hidden rounded-2xl">
                    {vendors.map((vendor) => (
                        <li key={vendor.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-start">
                            <div className="min-w-0 space-y-1">
                                <p className="text-lg leading-snug font-semibold">{vendor.name}</p>
                                <p className="text-muted-foreground text-xs">{vendor.category}</p>
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

                            <div className="space-y-2">
                                <VendorStatusBadge status={vendor.status} className="text-sm" />
                                {vendor.status === 'rejected' && vendor.admin_note && (
                                    <p className="text-sm">
                                        <span className="font-medium">Admin note: </span>
                                        {vendor.admin_note}
                                    </p>
                                )}
                                {vendor.status === 'approved' ? (
                                    <div className="space-y-1">
                                        <RatingSummary rating={vendor.rating} count={vendor.reviews_count} />
                                        <VendorReviewsDialog key={`${vendor.id}-${vendor.reviews_count}`} vendor={vendor} />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-xs">
                                        {vendor.status === 'pending'
                                            ? 'Committees see it, and can review it, after approval.'
                                            : 'Change it and save to send it to the admin again.'}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-1">
                                <VendorFormDialog
                                    mine
                                    vendor={vendor}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="size-9" aria-label={`Edit ${vendor.name}`}>
                                            <Pencil />
                                        </Button>
                                    }
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9"
                                    aria-label={`Delete ${vendor.name}`}
                                    onClick={() => deleteVendor(vendor)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </AppLayout>
    );
}

import QuoteFormDialog from '@/components/quote-form-dialog';
import { RatingSummary } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/format';
import { type RecommendedVendor } from '@/types';
import { Link } from '@inertiajs/react';
import { BadgeCheck, ExternalLink, Plus } from 'lucide-react';

interface RecommendedVendorListProps {
    eventId: number;
    vendorNeedId: number;
    vendors: RecommendedVendor[];
}

/** Admin-recommended vendors for one vendor need category. */
export default function RecommendedVendorList({ eventId, vendorNeedId, vendors }: RecommendedVendorListProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BadgeCheck className="text-primary size-4" />
                        Recommended vendors
                    </CardTitle>
                    <CardDescription>Picked by the admin for this category.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('vendors.index')}>See all</Link>
                </Button>
            </CardHeader>
            <CardContent>
                {vendors.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None for this category yet.</p>
                ) : (
                    <ul className="divide-y">
                        {vendors.map((vendor) => (
                            <li key={vendor.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="font-medium">{vendor.name}</p>
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
                                    trigger={
                                        <Button size="sm" variant="outline" className="shrink-0">
                                            <Plus className="size-4" />
                                            Add as quote
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

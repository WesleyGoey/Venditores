import QuoteFormDialog from '@/components/quote-form-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/lib/format';
import { router } from '@inertiajs/react';
import { ExternalLink, Globe, LoaderCircle, Plus, Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface FoundVendor {
    name: string;
    summary: string;
    website: string | null;
    contact: string | null;
    estimated_price: number | null;
}

interface Source {
    title: string;
    url: string;
}

interface VendorSearchDialogProps {
    eventId: number;
    vendorNeedId: number;
    category: string;
    location: string | null;
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export default function VendorSearchDialog({ eventId, vendorNeedId, category, location }: VendorSearchDialogProps) {
    const [open, setOpen] = useState(false);
    const [keywords, setKeywords] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vendors, setVendors] = useState<FoundVendor[] | null>(null);
    const [sources, setSources] = useState<Source[]>([]);

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent([category, keywords, location].filter(Boolean).join(' '))}`;

    const search: FormEventHandler = async (e) => {
        e.preventDefault();
        setSearching(true);
        setError(null);

        try {
            const response = await fetch(route('events.vendor-needs.search.store', [eventId, vendorNeedId]), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken(),
                },
                body: JSON.stringify({ keywords }),
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(body.message ?? 'The search failed. Please try again.');

                return;
            }

            setVendors(body.vendors);
            setSources(body.sources ?? []);
            // The need may have moved from "Not started" to "Finding vendors".
            router.reload({ only: ['vendorNeed'] });
        } catch {
            setError('Could not reach the server. Check your connection and try again.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Globe className="size-4" />
                    Find vendors online
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Find vendors online</DialogTitle>
                    <DialogDescription>
                        AI searches Google for <span className="text-foreground font-medium">{category}</span>
                        {location ? ` near ${location}` : ''}. Check prices with the vendor before choosing.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Keywords (optional), e.g. halal, outdoor"
                        maxLength={200}
                        aria-label="Extra keywords"
                    />
                    <Button disabled={searching} className="shrink-0">
                        {searching ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
                        {searching ? 'Searching…' : 'Search'}
                    </Button>
                    <Button type="button" variant="outline" asChild className="shrink-0">
                        <a href={googleUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            Open in Google
                        </a>
                    </Button>
                </form>

                {error && <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">{error}</p>}

                {vendors && (
                    <ul className="space-y-3">
                        {vendors.map((vendor) => (
                            <li
                                key={`${vendor.name}-${vendor.website}`}
                                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start"
                            >
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="font-medium">{vendor.name}</p>
                                    {vendor.summary && <p className="text-sm">{vendor.summary}</p>}
                                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                        {vendor.website && (
                                            <a
                                                href={vendor.website}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
                                            >
                                                <ExternalLink className="size-3" />
                                                Website
                                            </a>
                                        )}
                                        {vendor.contact && <span>{vendor.contact}</span>}
                                        <span>
                                            {vendor.estimated_price !== null ? `~ ${formatRupiah(vendor.estimated_price)}` : 'No published price'}
                                        </span>
                                    </div>
                                </div>
                                <QuoteFormDialog
                                    eventId={eventId}
                                    vendorNeedId={vendorNeedId}
                                    defaults={{
                                        vendor_name: vendor.name,
                                        vendor_contact: [vendor.contact, vendor.website].filter(Boolean).join(' · '),
                                        price: vendor.estimated_price !== null ? String(vendor.estimated_price) : '',
                                        notes: vendor.summary,
                                    }}
                                    trigger={
                                        <Button size="sm" className="shrink-0">
                                            <Plus className="size-4" />
                                            Add as quote
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}

                {sources.length > 0 && (
                    <div className="text-muted-foreground space-y-1 text-xs">
                        <p className="font-medium">Sources</p>
                        <ul className="space-y-0.5">
                            {sources.slice(0, 6).map((source) => (
                                <li key={source.url} className="truncate">
                                    <a href={source.url} target="_blank" rel="noreferrer noopener" className="underline-offset-4 hover:underline">
                                        {source.title || source.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { type Quote } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

type QuoteFormData = {
    vendor_name: string;
    vendor_contact: string;
    price: string;
    notes: string;
};

interface QuoteFormDialogProps {
    eventId: number;
    vendorNeedId: number;
    quote?: Quote;
    trigger: ReactNode;
}

export default function QuoteFormDialog({ eventId, vendorNeedId, quote, trigger }: QuoteFormDialogProps) {
    const [open, setOpen] = useState(false);
    const isEditing = quote !== undefined;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm<QuoteFormData>({
        vendor_name: quote?.vendor_name ?? '',
        vendor_contact: quote?.vendor_contact ?? '',
        price: quote ? String(quote.price) : '',
        notes: quote?.notes ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (!isEditing) {
                    reset();
                }
            },
        };

        if (isEditing) {
            patch(route('events.vendor-needs.quotes.update', [eventId, vendorNeedId, quote.id]), options);
        } else {
            post(route('events.vendor-needs.quotes.store', [eventId, vendorNeedId]), options);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                clearErrors();
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit quote' : 'Add vendor quote'}</DialogTitle>
                    <DialogDescription>
                        Record the offer you received. Describe what is included so the AI can compare it to the specification.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vendor_name">Vendor name</Label>
                            <Input id="vendor_name" value={data.vendor_name} onChange={(e) => setData('vendor_name', e.target.value)} required />
                            <InputError message={errors.vendor_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="vendor_contact">Contact</Label>
                            <Input
                                id="vendor_contact"
                                value={data.vendor_contact}
                                onChange={(e) => setData('vendor_contact', e.target.value)}
                                placeholder="Phone or email"
                            />
                            <InputError message={errors.vendor_contact} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price">Price (Rupiah)</Label>
                        <Input
                            id="price"
                            type="number"
                            min={0}
                            step={1}
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            required
                        />
                        {data.price !== '' && <p className="text-muted-foreground text-xs">{formatRupiah(Number(data.price))}</p>}
                        <InputError message={errors.price} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Offer details</Label>
                        <Textarea
                            id="notes"
                            rows={4}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="What is included, quantities, terms..."
                        />
                        <InputError message={errors.notes} />
                    </div>
                    <DialogFooter>
                        <Button disabled={processing}>{isEditing ? 'Save changes' : 'Add quote'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
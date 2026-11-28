import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Quote } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

type QuoteFormData = {
    vendor_name: string;
    vendor_contact: string;
    price: string;
    notes: string;
};

type PriceMode = 'total' | 'unit';

interface QuoteFormDialogProps {
    eventId: number;
    vendorNeedId: number;
    quote?: Quote;
    /** Pre-filled values for a new quote, e.g. a vendor found online. unit_price and unit open the form in per-unit mode. */
    defaults?: Partial<QuoteFormData> & { unit_price?: string; unit?: string };
    trigger: ReactNode;
}

export default function QuoteFormDialog({ eventId, vendorNeedId, quote, defaults, trigger }: QuoteFormDialogProps) {
    const [open, setOpen] = useState(false);
    const isEditing = quote !== undefined;
    const startMode: PriceMode = !isEditing && defaults?.unit_price ? 'unit' : 'total';

    const [mode, setMode] = useState<PriceMode>(startMode);
    const [unitPrice, setUnitPrice] = useState(defaults?.unit_price ?? '');
    const [unit, setUnit] = useState(defaults?.unit ?? '');
    const [quantity, setQuantity] = useState('');

    const { data, setData, post, patch, processing, errors, reset, clearErrors, transform } = useForm<QuoteFormData>({
        vendor_name: quote?.vendor_name ?? defaults?.vendor_name ?? '',
        vendor_contact: quote?.vendor_contact ?? defaults?.vendor_contact ?? '',
        price: quote ? String(quote.price) : (defaults?.price ?? ''),
        notes: quote?.notes ?? defaults?.notes ?? '',
    });

    const unitTotal = unitPrice !== '' && quantity !== '' ? Number(unitPrice) * Number(quantity) : null;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // The server only ever stores the total, so budget comparison and scoring work the same for both modes.
        transform((form) => ({ ...form, price: mode === 'unit' ? String(unitTotal ?? '') : form.price }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (!isEditing) {
                    reset();
                    setMode(startMode);
                    setUnitPrice(defaults?.unit_price ?? '');
                    setUnit(defaults?.unit ?? '');
                    setQuantity('');
                }
            },
        };

        if (isEditing) {
            patch(route('events.vendor-needs.quotes.update', [eventId, vendorNeedId, quote.id]), options);
        } else {
            post(route('events.vendor-needs.quotes.store', [eventId, vendorNeedId]), options);
        }
    };

    const modeButton = (value: PriceMode, label: string) => (
        <button
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={cn(
                'min-h-9 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                mode === value ? 'border-foreground bg-foreground text-background' : 'border-foreground/15 bg-white/40 hover:bg-white/80',
            )}
        >
            {label}
        </button>
    );

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
                        Enter the offer you received. Describe what is included so the AI can compare it to the specification. Check the price with
                        the vendor before you choose them.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vendor_name" required>
                                Vendor name
                            </Label>
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

                    <fieldset className="grid gap-3">
                        <legend className="mb-2 text-sm font-medium">How does the vendor quote the price?</legend>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Price type">
                            {modeButton('total', 'One total price')}
                            {modeButton('unit', 'Price per unit')}
                        </div>

                        {mode === 'total' ? (
                            <div className="grid gap-2">
                                <Label htmlFor="price">Total price for this whole need (Rupiah)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    required
                                />
                                <p className="text-muted-foreground text-xs">
                                    {data.price !== '' ? `${formatRupiah(Number(data.price))}. ` : ''}
                                    Everything the vendor charges for this need. This is what is compared with the budget.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit_price">Price per unit (Rupiah)</Label>
                                        <Input
                                            id="unit_price"
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantity">How many</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit">Unit</Label>
                                        <Input
                                            id="unit"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            placeholder="box, hour"
                                            maxLength={30}
                                        />
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {unitTotal !== null
                                        ? `${formatRupiah(Number(unitPrice))} × ${Number(quantity).toLocaleString('id-ID')}${unit ? ` ${unit}` : ''} = `
                                        : 'Price per unit × how many = the total. '}
                                    {unitTotal !== null && <span className="text-foreground font-semibold">{formatRupiah(unitTotal)}</span>}
                                    {unitTotal !== null ? '. This total is what is compared with the budget.' : 'It is compared with the budget.'}
                                </p>
                            </div>
                        )}
                        <InputError message={errors.price} />
                    </fieldset>

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

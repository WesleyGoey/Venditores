import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { type SharedData, type VendorNeed } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

type VendorNeedFormData = {
    category: string;
    specification: string;
    allocated_budget: string;
    is_vital: boolean;
};

interface VendorNeedFormDialogProps {
    eventId: number;
    vendorNeed?: VendorNeed;
    trigger: ReactNode;
}

export default function VendorNeedFormDialog({ eventId, vendorNeed, trigger }: VendorNeedFormDialogProps) {
    const { vendorCategories } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const isEditing = vendorNeed !== undefined;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm<VendorNeedFormData>({
        category: vendorNeed?.category ?? '',
        specification: vendorNeed?.specification ?? '',
        allocated_budget: vendorNeed ? String(vendorNeed.allocated_budget) : '',
        is_vital: vendorNeed?.is_vital ?? false,
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
            patch(route('events.vendor-needs.update', [eventId, vendorNeed.id]), options);
        } else {
            post(route('events.vendor-needs.store', eventId), options);
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
                    <DialogTitle>{isEditing ? 'Edit vendor need' : 'Add vendor need'}</DialogTitle>
                    <DialogDescription>Describe the vendor category and the budget reserved for it.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            list="vendor-categories"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            required
                            placeholder="e.g. Catering"
                        />
                        <datalist id="vendor-categories">
                            {vendorCategories.map((category) => (
                                <option key={category} value={category} />
                            ))}
                        </datalist>
                        <InputError message={errors.category} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="specification">Specification</Label>
                        <Textarea
                            id="specification"
                            rows={4}
                            value={data.specification}
                            onChange={(e) => setData('specification', e.target.value)}
                            placeholder="Quantities, duration, quality standard..."
                        />
                        <InputError message={errors.specification} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="allocated_budget">Allocated budget (Rupiah)</Label>
                        <Input
                            id="allocated_budget"
                            type="number"
                            min={0}
                            step={1}
                            value={data.allocated_budget}
                            onChange={(e) => setData('allocated_budget', e.target.value)}
                            required
                        />
                        {data.allocated_budget !== '' && (
                            <p className="text-muted-foreground text-xs">{formatRupiah(Number(data.allocated_budget))}</p>
                        )}
                        <InputError message={errors.allocated_budget} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="is_vital" checked={data.is_vital} onCheckedChange={(checked) => setData('is_vital', checked === true)} />
                        <Label htmlFor="is_vital">Vital: the event cannot run without this vendor</Label>
                    </div>
                    <DialogFooter>
                        <Button disabled={processing}>{isEditing ? 'Save changes' : 'Add need'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

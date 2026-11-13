import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { type RecommendedVendor, type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

type VendorFormData = {
    name: string;
    category: string;
    description: string;
    contact: string;
    website: string;
    price_estimate: string;
};

/** Admin only: add or edit a recommended vendor. */
export default function VendorFormDialog({ vendor, trigger }: { vendor?: RecommendedVendor; trigger: ReactNode }) {
    const { vendorCategories } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const isEditing = vendor !== undefined;

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm<VendorFormData>({
        name: vendor?.name ?? '',
        category: vendor?.category ?? '',
        description: vendor?.description ?? '',
        contact: vendor?.contact ?? '',
        website: vendor?.website ?? '',
        price_estimate: vendor?.price_estimate != null ? String(vendor.price_estimate) : '',
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
            patch(route('vendors.update', vendor.id), options);
        } else {
            post(route('vendors.store'), options);
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
                    <DialogTitle>{isEditing ? 'Edit vendor' : 'Add vendor'}</DialogTitle>
                    <DialogDescription>Users see it on vendor needs with the same category.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vendor-name">Name</Label>
                            <Input id="vendor-name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="vendor-category">Category</Label>
                            <Select value={data.category} onValueChange={(category) => setData('category', category)}>
                                <SelectTrigger id="vendor-category" aria-label="Category">
                                    <SelectValue placeholder="Choose a category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                    {vendorCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="vendor-description">What they offer</Label>
                        <Textarea
                            id="vendor-description"
                            rows={3}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        <InputError message={errors.description} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="vendor-contact">Contact</Label>
                            <Input
                                id="vendor-contact"
                                value={data.contact}
                                onChange={(e) => setData('contact', e.target.value)}
                                placeholder="Phone or email"
                            />
                            <InputError message={errors.contact} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="vendor-website">Website</Label>
                            <Input
                                id="vendor-website"
                                type="url"
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                                placeholder="https://"
                            />
                            <InputError message={errors.website} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="vendor-price">Typical price (Rp)</Label>
                        <Input
                            id="vendor-price"
                            type="number"
                            min={0}
                            step={1}
                            value={data.price_estimate}
                            onChange={(e) => setData('price_estimate', e.target.value)}
                        />
                        {data.price_estimate !== '' && <p className="text-muted-foreground text-xs">{formatRupiah(Number(data.price_estimate))}</p>}
                        <InputError message={errors.price_estimate} />
                    </div>
                    <DialogFooter>
                        <Button disabled={processing}>{isEditing ? 'Save' : 'Add vendor'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

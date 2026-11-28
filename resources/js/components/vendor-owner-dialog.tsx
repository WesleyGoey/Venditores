import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

/**
 * Admin only. Shows who manages a recommended vendor (the admin, or a vendor account) and lets the admin hand it over.
 * The vendor account asks the admin outside the app, so entering its email here is the proof of ownership.
 */
export default function VendorOwnerDialog({ vendorId, vendorName, owner }: { vendorId: number; vendorName: string; owner: string | null }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('vendors.owner.update', vendorId), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                clearErrors();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground" title="Change who manages this vendor">
                    {owner ? `Managed by ${owner}` : 'Added by admin'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Who manages {vendorName}?</DialogTitle>
                    <DialogDescription>
                        {owner
                            ? `Now ${owner}, a vendor account. They can edit it and read its reviews.`
                            : 'Now you. Link it to a vendor account so its owner can edit it and read its reviews.'}{' '}
                        Enter the email the vendor signed up with, or leave it empty to manage the vendor yourself.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`owner-email-${vendorId}`}>Vendor account email</Label>
                        <Input
                            id={`owner-email-${vendorId}`}
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="owner@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>
                    <DialogFooter>
                        <Button disabled={processing}>{data.email === '' && owner ? 'Manage it myself' : 'Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

/** Admin only: turn a vendor down with a reason the vendor account can read and act on. */
export default function VendorRejectDialog({ vendorId, vendorName }: { vendorId: number; vendorName: string }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({ status: 'rejected', admin_note: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('vendors.status.update', vendorId), {
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
                <Button variant="outline" size="sm" aria-label={`Reject ${vendorName}`}>
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject {vendorName}</DialogTitle>
                    <DialogDescription>The vendor account sees your note next to the vendor, and can fix it and send it again.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`reject-note-${vendorId}`} required>
                            Why is it not approved?
                        </Label>
                        <Textarea
                            id={`reject-note-${vendorId}`}
                            rows={3}
                            value={data.admin_note}
                            onChange={(e) => setData('admin_note', e.target.value)}
                            placeholder="For example: add a phone number or a working link."
                            maxLength={500}
                            required
                        />
                        <InputError message={errors.admin_note} />
                    </div>
                    <DialogFooter>
                        <Button variant="destructive" disabled={processing}>
                            Reject vendor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

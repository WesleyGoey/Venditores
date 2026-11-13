import InputError from '@/components/input-error';
import { RatingSummary, Stars } from '@/components/star-rating';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/format';
import { type RecommendedVendor, type SharedData, type VendorReview } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface VendorReviewsDialogProps {
    vendor: RecommendedVendor & { reviews: VendorReview[]; my_review: { rating: number; comment: string | null } | null };
}

export default function VendorReviewsDialog({ vendor }: VendorReviewsDialogProps) {
    // Admins read reviews but never write them.
    const canReview = !usePage<SharedData>().props.auth.user.is_admin;
    const { data, setData, put, processing, errors } = useForm({
        rating: vendor.my_review?.rating ?? 0,
        comment: vendor.my_review?.comment ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('vendors.review.store', vendor.id), { preserveScroll: true });
    };

    const remove = () => {
        router.delete(route('vendors.review.destroy', vendor.id), {
            preserveScroll: true,
            onSuccess: () => setData({ rating: 0, comment: '' }),
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    Reviews ({vendor.reviews_count})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{vendor.name}</DialogTitle>
                    <DialogDescription asChild>
                        <div>
                            <RatingSummary rating={vendor.rating} count={vendor.reviews_count} />
                        </div>
                    </DialogDescription>
                </DialogHeader>

                {canReview && (
                    <form onSubmit={submit} className="bg-muted/50 space-y-3 rounded-lg border p-4">
                        <div className="grid gap-1.5">
                            <Label required>
                                {vendor.my_review ? 'Your review (one per vendor, you can change it)' : 'Write a review (one per vendor)'}
                            </Label>
                            <Stars value={data.rating} onChange={(rating) => setData('rating', rating)} size="size-5" />
                            <InputError message={errors.rating} />
                        </div>
                        <Textarea
                            rows={3}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="How was working with them? (optional)"
                            aria-label="Comment"
                        />
                        <InputError message={errors.comment} />
                        <div className="flex gap-2">
                            <Button size="sm" disabled={processing || data.rating === 0}>
                                Save review
                            </Button>
                            {vendor.my_review && (
                                <Button type="button" size="sm" variant="ghost" onClick={remove}>
                                    Delete
                                </Button>
                            )}
                        </div>
                    </form>
                )}

                {vendor.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No reviews yet.</p>
                ) : (
                    <ul className="divide-y">
                        {vendor.reviews.map((review) => (
                            <li key={review.id} className="space-y-1 py-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">{review.user}</span>
                                    <span className="text-muted-foreground text-xs">{formatDate(review.created_at)}</span>
                                </div>
                                <Stars value={review.rating} size="size-3.5" />
                                {review.comment && <p className="text-sm whitespace-pre-line">{review.comment}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * A rating of a recommended vendor, or of a vendor a user entered themselves (stored by name).
 */
class VendorReview extends Model
{
    protected $fillable = [
        'user_id',
        'vendor_name',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(RecommendedVendor::class, 'recommended_vendor_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Vendors without a recommended entry are known by name only, so names are compared ignoring case.
     */
    public static function keyFor(string $vendorName): string
    {
        return mb_strtolower(trim($vendorName));
    }

    /**
     * Rating, count and reviews for each vendor name, keyed by keyFor(). A name that matches a
     * recommended vendor uses that vendor's reviews.
     *
     * shortcut: loads every review of the given names, move to SQL aggregates if a vendor gets thousands.
     *
     * @param  iterable<string>  $vendorNames
     * @return array<string, array{rating: float|null, reviews_count: int, my_review: array{rating: int, comment: string|null}|null, reviews: list<array<string, mixed>>}>
     */
    public static function summariesFor(iterable $vendorNames, ?User $viewer = null): array
    {
        $keys = collect($vendorNames)->map(fn(string $name): string => self::keyFor($name))->unique()->values();

        if ($keys->isEmpty()) {
            return [];
        }

        $recommended = RecommendedVendor::query()
            ->whereIn(DB::raw('lower(name)'), $keys->all())
            ->get(['id', 'name'])
            ->mapWithKeys(fn(RecommendedVendor $vendor): array => [$vendor->id => self::keyFor($vendor->name)]);

        return self::query()
            ->with('user:id,name')
            ->where(fn($query) => $query
                ->whereIn('vendor_name', $keys->all())
                ->orWhereIn('recommended_vendor_id', $recommended->keys()->all()))
            ->latest()
            ->get()
            ->groupBy(fn(VendorReview $review): string => $review->vendor_name ?? $recommended[$review->recommended_vendor_id])
            ->map(fn($reviews): array => [
                'rating' => round((float) $reviews->avg('rating'), 1),
                'reviews_count' => $reviews->count(),
                'my_review' => $viewer ? $reviews->firstWhere('user_id', $viewer->id)?->only(['rating', 'comment']) : null,
                'reviews' => $reviews->map(fn(VendorReview $review): array => [
                    'id' => $review->id,
                    'user' => $review->user->name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->toDateString(),
                ])->values()->all(),
            ])
            ->all();
    }
}

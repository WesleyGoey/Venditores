<?php

namespace App\Models;

use Database\Factories\RecommendedVendorFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A vendor the admin recommends to every user.
 */
class RecommendedVendor extends Model
{
    /** @use HasFactory<RecommendedVendorFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'contact',
        'website',
        'price_estimate',
    ];

    protected function casts(): array
    {
        return [
            'price_estimate' => 'integer',
        ];
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(VendorReview::class);
    }

    /**
     * Whether this vendor's category fits a vendor need category, ignoring case.
     */
    public function matchesCategory(string $category): bool
    {
        $mine = mb_strtolower(trim($this->category));
        $other = mb_strtolower(trim($category));

        return $mine !== '' && $other !== '' && (str_contains($other, $mine) || str_contains($mine, $other));
    }

    /**
     * Vendors whose category matches a vendor need category, ignoring case.
     * "Catering" matches "Catering & Snacks" and the other way around.
     */
    public function scopeForCategory(Builder $query, string $category): void
    {
        $needle = mb_strtolower(trim($category));

        $query->where(fn (Builder $match) => $match
            ->whereRaw('lower(category) like ?', ['%'.$needle.'%'])
            ->orWhereRaw("? like '%' || lower(category) || '%'", [$needle]));
    }
}

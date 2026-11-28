<?php

namespace App\Models;

use App\Enums\VendorStatus;
use Database\Factories\RecommendedVendorFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A vendor the admin recommends to every user. Vendor accounts list their own vendors here too,
 * and users only see them after the admin approves.
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
            'status' => VendorStatus::class,
        ];
    }

    /**
     * The vendor account that listed it, or null when the admin added it.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * What users may see and review. Pending and rejected vendors stay between the owner and the admin.
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', VendorStatus::Approved->value);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(VendorReview::class);
    }

    /**
     * Vendors whose category matches a vendor need category, ignoring case.
     * "Catering" matches "Catering & Snacks" and the other way around.
     */
    public function scopeForCategory(Builder $query, string $category): void
    {
        $needle = mb_strtolower(trim($category));

        $query->where(fn(Builder $match) => $match
            ->whereRaw('lower(category) like ?', ['%' . $needle . '%'])
            ->orWhereRaw("cast(? as text) like '%' || lower(category) || '%'", [$needle]));
    }
}

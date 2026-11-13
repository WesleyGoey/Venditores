<?php

namespace App\Models;

use App\Enums\QuoteStatus;
use Database\Factories\QuoteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quote extends Model
{
    /** @use HasFactory<QuoteFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'vendor_name',
        'vendor_contact',
        'price',
        'notes',
        'status',
        'spec_score',
        'budget_score',
        'match_score',
        'match_reason',
        'matched_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'status' => QuoteStatus::class,
            'spec_score' => 'integer',
            'budget_score' => 'integer',
            'match_score' => 'integer',
            'matched_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<VendorNeed, $this>
     */
    public function vendorNeed(): BelongsTo
    {
        return $this->belongsTo(VendorNeed::class);
    }
}

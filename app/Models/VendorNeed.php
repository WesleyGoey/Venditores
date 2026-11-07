<?php


namespace App\Models;


use App\Enums\ProcurementStatus;
use App\Enums\QuoteStatus;
use Database\Factories\VendorNeedFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class VendorNeed extends Model
{
    /** @use HasFactory<VendorNeedFactory> */
    use HasFactory;


    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'category',
        'specification',
        'allocated_budget',
        'allocation_basis_points',
        'is_vital',
        'procurement_status',
    ];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allocated_budget' => 'integer',
            'allocation_basis_points' => 'integer',
            'is_vital' => 'boolean',
            'procurement_status' => ProcurementStatus::class,
        ];
    }


    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }


    /**
     * @return HasMany<Quote, $this>
     */
    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }


    /**
     * Needs that have no quotes yet, or whose quotes were all rejected.
     *
     * @param  Builder<VendorNeed>  $query
     */
    public function scopeCritical(Builder $query): void
    {
        $query->whereDoesntHave('quotes', function (Builder $quotes) {
            $quotes->where('status', '!=', QuoteStatus::Rejected->value);
        });
    }
}

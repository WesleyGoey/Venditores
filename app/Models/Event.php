<?php


namespace App\Models;


use App\Enums\EventStatus;
use Database\Factories\EventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;


class Event extends Model
{
    /** @use HasFactory<EventFactory> */
    use HasFactory;


    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'event_date',
        'location',
        'total_budget',
        'description',
        'proposal_path',
        'proposal_original_name',
        'status',
        'summary',
        'scale',
        'estimated_attendees',
        'analyzed_at',
        'risk_advice',
        'risk_advised_at',
    ];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'proposal_path',
    ];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event_date' => 'date:Y-m-d',
            'total_budget' => 'integer',
            'estimated_attendees' => 'integer',
            'status' => EventStatus::class,
            'analyzed_at' => 'datetime',
            'risk_advice' => 'array',
            'risk_advised_at' => 'datetime',
        ];
    }


    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


    /**
     * @return HasMany<VendorNeed, $this>
     */
    public function vendorNeeds(): HasMany
    {
        return $this->hasMany(VendorNeed::class);
    }


    /**
     * @return HasManyThrough<Quote, VendorNeed, $this>
     */
    public function quotes(): HasManyThrough
    {
        return $this->hasManyThrough(Quote::class, VendorNeed::class);
    }


    public function hasProposal(): bool
    {
        return $this->proposal_path !== null;
    }
}

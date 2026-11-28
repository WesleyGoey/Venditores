<?php

namespace App\Models;

use App\Services\SupabaseAuth;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $attributes = [
        'is_admin' => false,
        'is_vendor' => false,
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'supabase_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_vendor' => 'boolean',
        ];
    }

    /**
     * The vendors this account listed, when it is a vendor account.
     *
     * @return HasMany<RecommendedVendor, $this>
     */
    public function ownedVendors(): HasMany
    {
        return $this->hasMany(RecommendedVendor::class);
    }

    /**
     * @return HasMany<Event, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Supabase Auth sends the confirmation email, not Laravel.
     */
    public function sendEmailVerificationNotification(): void
    {
        app(SupabaseAuth::class)->resendConfirmation($this->email);
    }
}

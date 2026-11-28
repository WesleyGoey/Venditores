<?php

namespace Database\Factories;

use App\Enums\VendorStatus;
use App\Models\RecommendedVendor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RecommendedVendor>
 */
class RecommendedVendorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'category' => fake()->randomElement(['Catering', 'Venue', 'Sound System', 'Documentation']),
            'description' => fake()->sentence(),
            'contact' => fake()->phoneNumber(),
            'website' => fake()->url(),
            'price_estimate' => fake()->numberBetween(1, 100) * 1_000_000,
            'status' => VendorStatus::Approved,
        ];
    }

    /**
     * A vendor listed by a vendor account that the admin has not decided on yet.
     */
    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'user_id' => User::factory()->vendor(),
            'status' => VendorStatus::Pending,
        ]);
    }
}

<?php

namespace Database\Factories;

use App\Models\RecommendedVendor;
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
        ];
    }
}

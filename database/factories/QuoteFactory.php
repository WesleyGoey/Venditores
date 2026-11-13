<?php

namespace Database\Factories;

use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Models\VendorNeed;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Quote>
 */
class QuoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vendor_need_id' => VendorNeed::factory(),
            'vendor_name' => fake()->company(),
            'vendor_contact' => fake()->phoneNumber(),
            'price' => fake()->numberBetween(1, 50) * 1_000_000,
            'notes' => fake()->sentence(),
            'status' => QuoteStatus::Pending,
        ];
    }

    /**
     * Indicate that the quote was rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => QuoteStatus::Rejected,
        ]);
    }

    /**
     * Indicate that the quote was accepted.
     */
    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => QuoteStatus::Accepted,
        ]);
    }
}

<?php

namespace Database\Factories;

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\VendorNeed;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VendorNeed>
 */
class VendorNeedFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'category' => fake()->randomElement(['Catering', 'Venue', 'Sound System', 'Lighting', 'Decoration', 'Documentation']),
            'specification' => fake()->sentence(),
            'allocated_budget' => fake()->numberBetween(1, 50) * 1_000_000,
            'is_vital' => false,
            'procurement_status' => ProcurementStatus::Drafting,
        ];
    }

    /**
     * Indicate that the need is vital for the event.
     */
    public function vital(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_vital' => true,
        ]);
    }
}

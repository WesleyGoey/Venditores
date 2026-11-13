<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'event_date' => now()->addDays(fake()->numberBetween(10, 180))->toDateString(),
            'location' => fake()->city(),
            'total_budget' => fake()->numberBetween(10, 500) * 1_000_000,
            'description' => fake()->sentence(),
            'status' => EventStatus::Draft,
        ];
    }

    /**
     * Indicate that the event's proposal has been analyzed.
     */
    public function analyzed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Analyzed,
            'summary' => fake()->paragraph(),
            'scale' => 'medium',
            'estimated_attendees' => fake()->numberBetween(50, 2000),
            'analyzed_at' => now(),
        ]);
    }

    /**
     * Indicate that the event has an uploaded proposal.
     */
    public function withProposal(string $path = 'proposals/proposal.pdf'): static
    {
        return $this->state(fn (array $attributes) => [
            'proposal_path' => $path,
            'proposal_original_name' => 'proposal.pdf',
        ]);
    }

    /**
     * Indicate that the event takes place a given number of days from today.
     */
    public function inDays(int $days): static
    {
        return $this->state(fn (array $attributes) => [
            'event_date' => now()->addDays($days)->toDateString(),
        ]);
    }
}

<?php


namespace Database\Seeders;


use App\Enums\EventStatus;
use App\Enums\ProcurementStatus;
use App\Enums\QuoteStatus;
use App\Models\User;
use App\Services\BudgetAllocator;
use Illuminate\Database\Seeder;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with a demo account and event.
     */
    public function run(BudgetAllocator $allocator): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);


        $event = $user->events()->create([
            'name' => 'Ciputra Tech Fest 2027',
            'event_date' => now()->addDays(25)->toDateString(),
            'location' => 'Surabaya',
            'total_budget' => 150_000_000,
            'description' => 'Two-day technology festival with talks, workshops and a startup expo.',
            'status' => EventStatus::Analyzed,
            'summary' => 'A two-day campus technology festival for students and young professionals with keynote talks, hands-on workshops and a startup exhibition.',
            'scale' => 'medium',
            'estimated_attendees' => 800,
            'analyzed_at' => now(),
        ]);


        $needs = [
            ['category' => 'Venue', 'specification' => 'Main hall for 800 people plus 3 workshop rooms, 2 days, including AC and cleaning.', 'percentage' => 30, 'is_vital' => true, 'status' => ProcurementStatus::Deal],
            ['category' => 'Catering', 'specification' => '800 lunch boxes and 2 coffee breaks per day for 2 days.', 'percentage' => 28, 'is_vital' => true, 'status' => ProcurementStatus::Quoted],
            ['category' => 'Sound System & Lighting', 'specification' => 'Line array for main hall, 4 wireless mics, stage lighting, operator on site.', 'percentage' => 17, 'is_vital' => true, 'status' => ProcurementStatus::Searching],
            ['category' => 'Decoration & Booths', 'specification' => '20 expo booths 3x3 m, stage backdrop and entrance gate.', 'percentage' => 12, 'is_vital' => false, 'status' => ProcurementStatus::Drafting],
            ['category' => 'Documentation', 'specification' => '2 photographers and 1 videographer with a 3 minute aftermovie.', 'percentage' => 8, 'is_vital' => false, 'status' => ProcurementStatus::Drafting],
            ['category' => 'Printing & Merchandise', 'specification' => 'ID cards, banners and 300 tote bags.', 'percentage' => 5, 'is_vital' => false, 'status' => ProcurementStatus::Drafting],
        ];


        $allocations = $allocator->allocate($event->total_budget, array_column($needs, 'percentage'));


        foreach ($needs as $index => $need) {
            $vendorNeed = $event->vendorNeeds()->create([
                'category' => $need['category'],
                'specification' => $need['specification'],
                'is_vital' => $need['is_vital'],
                'allocated_budget' => $allocations[$index]['amount'],
                'allocation_basis_points' => $allocations[$index]['basis_points'],
                'procurement_status' => $need['status'],
            ]);


            if ($need['category'] === 'Venue') {
                $vendorNeed->quotes()->create([
                    'vendor_name' => 'Grand City Convention Hall',
                    'price' => 43_000_000,
                    'notes' => 'Main hall and 3 meeting rooms for 2 days, AC and cleaning included.',
                    'status' => QuoteStatus::Accepted,
                ]);
            }


            if ($need['category'] === 'Catering') {
                $vendorNeed->quotes()->createMany([
                    ['vendor_name' => 'Dapur Nusantara', 'price' => 40_000_000, 'notes' => '800 lunch boxes per day, 2 coffee breaks, halal certified.'],
                    ['vendor_name' => 'Rasa Catering', 'price' => 46_500_000, 'notes' => '800 buffet portions per day, coffee break on day 1 only.'],
                ]);
            }
        }
    }
}

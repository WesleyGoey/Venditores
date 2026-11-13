<?php

namespace App\Support;

/**
 * The vendor categories an event usually needs, and which ones go together.
 *
 * Admin vendors use these names, the AI is asked to use them too, and the
 * vendor picker uses the groups to show related categories after the same one.
 */
class VendorCategories
{
    /**
     * @var list<string>
     */
    private const ALL = [
        'Venue',
        'Catering',
        'Beverages & Coffee',
        'Cake & Dessert',
        'Food Stall',
        'Sound System',
        'Lighting',
        'Stage & Rigging',
        'LED Screen & Multimedia',
        'Live Streaming',
        'Generator & Power',
        'Photography',
        'Videography',
        'Drone',
        'Documentation',
        'Photo Booth',
        'Decoration',
        'Flowers',
        'Booth & Exhibition',
        'Banner & Signage',
        'Printing',
        'Merchandise',
        'Souvenir',
        'Uniform & Crew Shirts',
        'Graphic Design',
        'Social Media & Promotion',
        'MC & Host',
        'Entertainment',
        'DJ',
        'Performer',
        'Security',
        'Medical & First Aid',
        'Cleaning Service',
        'Insurance',
        'Permit & Licensing',
        'Ticketing & Registration',
        'Transportation',
        'Parking Management',
        'Accommodation',
        'Wi-Fi & Internet',
        'Furniture & Equipment Rental',
        'Tent & Canopy',
        'Air Conditioning',
        'Toilet Rental',
    ];

    /**
     * Categories that are usually bought together. A category can be in several groups.
     *
     * @var list<list<string>>
     */
    private const GROUPS = [
        ['Catering', 'Beverages & Coffee', 'Cake & Dessert', 'Food Stall'],
        ['Sound System', 'Lighting', 'Stage & Rigging', 'LED Screen & Multimedia', 'Live Streaming', 'Generator & Power'],
        ['Photography', 'Videography', 'Drone', 'Documentation', 'Photo Booth', 'Live Streaming'],
        ['Venue', 'Furniture & Equipment Rental', 'Tent & Canopy', 'Air Conditioning', 'Toilet Rental', 'Generator & Power', 'Parking Management'],
        ['Decoration', 'Flowers', 'Booth & Exhibition', 'Banner & Signage', 'Stage & Rigging', 'Lighting', 'Photo Booth'],
        ['Printing', 'Merchandise', 'Souvenir', 'Uniform & Crew Shirts', 'Banner & Signage', 'Graphic Design'],
        ['MC & Host', 'Entertainment', 'DJ', 'Performer', 'Sound System'],
        ['Security', 'Medical & First Aid', 'Cleaning Service', 'Insurance', 'Permit & Licensing'],
        ['Ticketing & Registration', 'Transportation', 'Accommodation', 'Parking Management', 'Wi-Fi & Internet'],
        ['Social Media & Promotion', 'Graphic Design', 'Printing', 'Banner & Signage'],
    ];

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return self::ALL;
    }

    /**
     * The listed categories that a free-text category fits, ignoring case.
     * "Catering & Snacks" fits "Catering", and "Sound System & Lighting" fits both parts.
     *
     * @return list<string>
     */
    public static function fitting(string $text): array
    {
        $needle = mb_strtolower(trim($text));

        if (mb_strlen($needle) < 3) {
            return [];
        }

        return array_values(array_filter(self::ALL, function (string $category) use ($needle): bool {
            $name = mb_strtolower($category);

            return str_contains($needle, $name) || str_contains($name, $needle);
        }));
    }

    /**
     * Categories that go with the given one but are not the same category.
     *
     * @return list<string>
     */
    public static function relatedTo(string $text): array
    {
        $same = self::fitting($text);
        $related = [];

        foreach (self::GROUPS as $group) {
            if (array_intersect($group, $same) !== []) {
                $related = [...$related, ...$group];
            }
        }

        return array_values(array_diff(array_unique($related), $same));
    }
}

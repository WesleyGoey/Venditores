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
        'Other',
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
     * Other words for a category, mostly Indonesian, matched as whole words.
     * The AI and committees often write "Katering & Konsumsi" or "Dokumentasi" instead of the listed name.
     *
     * @var array<string, list<string>>
     */
    private const ALIASES = [
        'Venue' => ['tempat', 'gedung', 'aula', 'ballroom', 'hall', 'lokasi acara'],
        'Catering' => ['katering', 'konsumsi', 'makanan', 'makan siang', 'makan malam', 'snack', 'food'],
        'Beverages & Coffee' => ['minuman', 'kopi', 'coffee', 'beverage', 'beverages', 'drink', 'drinks'],
        'Cake & Dessert' => ['kue', 'cake', 'dessert'],
        'Food Stall' => ['bazar', 'bazaar', 'tenant', 'food stall', 'food truck'],
        'Sound System' => ['sound', 'audio', 'tata suara'],
        'Lighting' => ['pencahayaan', 'lampu', 'tata cahaya'],
        'Stage & Rigging' => ['panggung', 'stage', 'rigging'],
        'LED Screen & Multimedia' => ['led', 'multimedia', 'proyektor', 'projector', 'videotron', 'layar'],
        'Live Streaming' => ['streaming', 'siaran langsung'],
        'Generator & Power' => ['genset', 'generator', 'listrik'],
        'Photography' => ['foto', 'fotografi', 'fotografer', 'photo', 'photographer'],
        'Videography' => ['video', 'videografi', 'videografer', 'videographer'],
        'Documentation' => ['dokumentasi'],
        'Photo Booth' => ['photobooth'],
        'Decoration' => ['dekorasi', 'dekor', 'decor'],
        'Flowers' => ['bunga', 'florist', 'flower'],
        'Booth & Exhibition' => ['booth', 'pameran', 'exhibition', 'expo'],
        'Banner & Signage' => ['banner', 'spanduk', 'baliho', 'signage', 'backdrop'],
        'Printing' => ['cetak', 'percetakan', 'print'],
        'Merchandise' => ['merch', 'kaos', 'totebag', 'tote bag'],
        'Souvenir' => ['suvenir', 'cendera mata', 'plakat', 'hadiah'],
        'Uniform & Crew Shirts' => ['seragam', 'uniform', 'kaos panitia'],
        'Graphic Design' => ['desain', 'design', 'grafis'],
        'Social Media & Promotion' => ['promosi', 'publikasi', 'media sosial', 'iklan', 'promotion'],
        'MC & Host' => ['mc', 'host', 'pembawa acara', 'moderator'],
        'Entertainment' => ['hiburan', 'bintang tamu', 'guest star'],
        'Performer' => ['band', 'penampil', 'pengisi acara', 'artis'],
        'Security' => ['keamanan', 'satpam'],
        'Medical & First Aid' => ['medis', 'kesehatan', 'p3k', 'ambulans', 'ambulance', 'medical'],
        'Cleaning Service' => ['kebersihan', 'cleaning'],
        'Insurance' => ['asuransi'],
        'Permit & Licensing' => ['izin', 'perizinan', 'permit'],
        'Ticketing & Registration' => ['tiket', 'ticket', 'ticketing', 'registrasi', 'pendaftaran', 'registration'],
        'Transportation' => ['transportasi', 'transport', 'bus', 'shuttle', 'kendaraan'],
        'Parking Management' => ['parkir', 'parking'],
        'Accommodation' => ['akomodasi', 'hotel', 'penginapan'],
        'Wi-Fi & Internet' => ['wifi', 'internet'],
        'Furniture & Equipment Rental' => ['kursi', 'meja', 'furniture'],
        'Tent & Canopy' => ['tenda', 'tent', 'kanopi', 'canopy'],
        'Air Conditioning' => ['ac', 'pendingin ruangan'],
        'Toilet Rental' => ['toilet'],
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
     * "Catering & Snacks" fits "Catering", "Sound System & Lighting" fits both parts,
     * and "Katering & Konsumsi" fits "Catering" through its Indonesian words.
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

            if (str_contains($needle, $name) || str_contains($name, $needle)) {
                return true;
            }

            foreach (self::ALIASES[$category] ?? [] as $alias) {
                if (preg_match('/(?<![\p{L}\p{N}])' . preg_quote($alias, '/') . '(?![\p{L}\p{N}])/u', $needle) === 1) {
                    return true;
                }
            }

            return false;
        }));
    }

    /**
     * Whether a vendor's category belongs under a need: the same category or one that goes with it.
     * Categories the list does not know fall back to plain text overlap.
     */
    public static function sameOrRelated(string $category, string $needCategory): bool
    {
        $own = self::fitting($category);
        $need = self::fitting($needCategory);

        if ($own === [] || $need === []) {
            $a = mb_strtolower(trim($category));
            $b = mb_strtolower(trim($needCategory));

            return $a !== '' && $b !== '' && (str_contains($a, $b) || str_contains($b, $a));
        }

        return array_intersect($own, [...$need, ...self::relatedTo($needCategory)]) !== [];
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

<?php

use App\Support\VendorCategories;

test('the list has many event categories without duplicates', function () {
    expect(VendorCategories::all())->toContain('Venue', 'Catering', 'Sound System', 'Photography', 'Security')
        ->and(count(VendorCategories::all()))->toBeGreaterThan(30)
        ->and(array_unique(VendorCategories::all()))->toHaveCount(count(VendorCategories::all()));
});

test('every category in a group exists in the list', function () {
    $groups = (new ReflectionClass(VendorCategories::class))->getReflectionConstant('GROUPS')->getValue();

    foreach ($groups as $group) {
        expect(array_diff($group, VendorCategories::all()))->toBe([]);
    }
});

test('a free-text category fits the listed categories it contains', function () {
    expect(VendorCategories::fitting('Catering & Snacks'))->toBe(['Catering'])
        ->and(VendorCategories::fitting('sound system & lighting'))->toBe(['Sound System', 'Lighting'])
        ->and(VendorCategories::fitting('Magician'))->toBe([])
        ->and(VendorCategories::fitting('ab'))->toBe([]);
});

test('indonesian category names fit the listed categories as whole words', function () {
    expect(VendorCategories::fitting('Katering & Konsumsi'))->toBe(['Catering'])
        ->and(VendorCategories::fitting('Dokumentasi Acara'))->toBe(['Documentation'])
        ->and(VendorCategories::fitting('Akomodasi'))->toBe(['Accommodation']);
});

test('a vendor belongs under a need with the same or a related category', function () {
    expect(VendorCategories::sameOrRelated('Katering & Konsumsi', 'Catering & Konsumsi'))->toBeTrue()
        ->and(VendorCategories::sameOrRelated('Beverages & Coffee', 'Konsumsi'))->toBeTrue()
        ->and(VendorCategories::sameOrRelated('Venue', 'Katering'))->toBeFalse()
        ->and(VendorCategories::sameOrRelated('Magician Show', 'Magician'))->toBeTrue()
        ->and(VendorCategories::sameOrRelated('Magician', 'Juggler'))->toBeFalse();
});

test('related categories go with the same one and never repeat it', function () {
    $related = VendorCategories::relatedTo('Catering');

    expect($related)->toContain('Beverages & Coffee', 'Cake & Dessert')
        ->and($related)->not->toContain('Catering')
        ->and($related)->not->toContain('Security');
});

test('nothing is related to an unknown category', function () {
    expect(VendorCategories::relatedTo('Magician'))->toBe([]);
});

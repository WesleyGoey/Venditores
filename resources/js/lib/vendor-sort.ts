export type VendorSort = 'rating_desc' | 'rating_asc' | 'reviews_desc' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

export const vendorSortOptions: { value: VendorSort; label: string }[] = [
    { value: 'rating_desc', label: 'Rating: high to low' },
    { value: 'rating_asc', label: 'Rating: low to high' },
    { value: 'reviews_desc', label: 'Most reviews' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

/** Missing values (no rating, no price) always sort last, whichever the direction. */
function compareNullable(a: number | null | undefined, b: number | null | undefined, direction: 1 | -1): number {
    if (a == null && b == null) {
        return 0;
    }

    if (a == null) {
        return 1;
    }

    if (b == null) {
        return -1;
    }

    return (a - b) * direction;
}

export function sortVendors<T extends { name: string; rating?: number | null; reviews_count?: number; price_estimate?: number | null }>(
    items: T[],
    sort: VendorSort,
): T[] {
    const byName = (a: T, b: T) => a.name.localeCompare(b.name);
    const compare: Record<VendorSort, (a: T, b: T) => number> = {
        rating_desc: (a, b) => compareNullable(a.rating, b.rating, -1) || (b.reviews_count ?? 0) - (a.reviews_count ?? 0),
        rating_asc: (a, b) => compareNullable(a.rating, b.rating, 1),
        reviews_desc: (a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0),
        name_asc: byName,
        name_desc: (a, b) => byName(b, a),
        price_asc: (a, b) => compareNullable(a.price_estimate, b.price_estimate, 1),
        price_desc: (a, b) => compareNullable(a.price_estimate, b.price_estimate, -1),
    };

    return [...items].sort((a, b) => compare[sort](a, b) || byName(a, b));
}

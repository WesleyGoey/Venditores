<?php

namespace App\Enums;

enum ProcurementStatus: string
{
    case Drafting = 'drafting';
    case Searching = 'searching';
    case Quoted = 'quoted';
    case Deal = 'deal';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Drafting => 'Not started',
            self::Searching => 'Finding vendors',
            self::Quoted => 'Comparing offers',
            self::Deal => 'Vendor chosen',
            self::Paid => 'Paid',
        };
    }

    /**
     * What the status means, in one sentence.
     */
    public function description(): string
    {
        return match ($this) {
            self::Drafting => 'No vendor searched yet.',
            self::Searching => 'Looking for vendors. No offer yet.',
            self::Quoted => 'Offers received. Pick the best one.',
            self::Deal => 'Vendor picked. Payment pending.',
            self::Paid => 'Vendor paid. Done.',
        };
    }

    /**
     * Whether a vendor has been secured for the need.
     */
    public function isSecured(): bool
    {
        return in_array($this, [self::Deal, self::Paid], true);
    }
}

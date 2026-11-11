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
            self::Drafting => 'The need is defined, but no vendor has been looked for yet.',
            self::Searching => 'You are looking for vendors. No offer has been recorded yet.',
            self::Quoted => 'At least one offer is recorded. Compare them and accept the best one.',
            self::Deal => 'An offer was accepted. The vendor is secured, payment is still pending.',
            self::Paid => 'The vendor has been paid. This need is done.',
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

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
            self::Drafting => 'Drafting',
            self::Searching => 'Searching',
            self::Quoted => 'Quoted',
            self::Deal => 'Deal',
            self::Paid => 'Paid',
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

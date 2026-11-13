<?php


namespace App\Enums;


enum QuoteStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';


    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Under review',
            self::Accepted => 'Chosen',
            self::Rejected => 'Declined',
        };
    }


    /**
     * What the status means, in one sentence.
     */
    public function description(): string
    {
        return match ($this) {
            self::Pending => 'Not decided yet.',
            self::Accepted => 'Picked. The need moves to "Vendor chosen".',
            self::Rejected => 'Turned down. No longer an option.',
        };
    }
}

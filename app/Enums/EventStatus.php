<?php

namespace App\Enums;

enum EventStatus: string
{
    case Draft = 'draft';
    case Analyzed = 'analyzed';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Analyzed => 'Analyzed',
            self::Completed => 'Completed',
        };
    }
}

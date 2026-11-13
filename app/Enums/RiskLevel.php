<?php

namespace App\Enums;

enum RiskLevel: string
{
    case Urgent = 'urgent';
    case Warning = 'warning';
    case Low = 'low';

    public function label(): string
    {
        return match ($this) {
            self::Urgent => 'Urgent',
            self::Warning => 'Warning',
            self::Low => 'Low',
        };
    }
}

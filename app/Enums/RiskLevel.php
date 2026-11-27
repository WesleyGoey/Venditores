<?php


namespace App\Enums;


enum RiskLevel: string
{
    case Passed = 'passed';
    case Urgent = 'urgent';
    case Warning = 'warning';
    case Low = 'low';


    public function label(): string
    {
        return match ($this) {
            self::Passed => 'Date passed',
            self::Urgent => 'Urgent',
            self::Warning => 'Warning',
            self::Low => 'Low',
        };
    }
}

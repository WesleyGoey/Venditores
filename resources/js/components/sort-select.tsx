import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';

interface SortSelectProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: { value: T; label: string }[];
    className?: string;
}

export default function SortSelect<T extends string>({ value, onChange, options, className }: SortSelectProps<T>) {
    return (
        <Select value={value} onValueChange={(next) => onChange(next as T)}>
            <SelectTrigger className={cn('w-full sm:w-56', className)} aria-label="Sort by">
                <span className="flex items-center gap-2">
                    <ArrowUpDown className="size-4 shrink-0 opacity-60" />
                    <SelectValue />
                </span>
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

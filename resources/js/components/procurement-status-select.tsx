import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { procurementMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type Option, type ProcurementStatus } from '@/types';
import { router } from '@inertiajs/react';

interface ProcurementStatusSelectProps {
    eventId: number;
    vendorNeedId: number;
    value: ProcurementStatus;
    options: Option<ProcurementStatus>[];
}

export default function ProcurementStatusSelect({ eventId, vendorNeedId, value, options }: ProcurementStatusSelectProps) {
    return (
        <Select
            value={value}
            onValueChange={(status) =>
                router.patch(route('events.vendor-needs.update', [eventId, vendorNeedId]), { procurement_status: status }, { preserveScroll: true })
            }
        >
            <SelectTrigger className="h-8 w-44" aria-label="Procurement status" title={procurementMeta[value].description}>
                <SelectValue>
                    <span className="flex items-center gap-2">
                        <span className={cn('size-2 rounded-full', procurementMeta[value].solid)} aria-hidden />
                        {procurementMeta[value].label}
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-72">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="items-start py-2">
                        <span className="flex items-start gap-2">
                            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', procurementMeta[option.value].solid)} aria-hidden />
                            <span className="flex flex-col">
                                <span className="font-medium">{procurementMeta[option.value].label}</span>
                                <span className="text-muted-foreground text-xs whitespace-normal">{procurementMeta[option.value].description}</span>
                            </span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

import { StatusMark } from '@/components/status-badges';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { procurementMeta } from '@/lib/status-meta';
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
            <SelectTrigger className="h-11 w-full lg:h-9" aria-label="Procurement status" title={procurementMeta[value].description}>
                <SelectValue>
                    <span className="flex items-center gap-2">
                        <StatusMark kind={procurementMeta[value].mark} />
                        {procurementMeta[value].label}
                    </span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-72">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="items-start py-2">
                        <span className="flex items-start gap-2">
                            <StatusMark kind={procurementMeta[option.value].mark} className="mt-0.5" />
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

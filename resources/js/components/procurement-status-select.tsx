import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            <SelectTrigger className="h-8 w-32" aria-label="Procurement status">
                <SelectValue />
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

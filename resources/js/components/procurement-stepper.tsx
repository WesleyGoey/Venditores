import { procurementMeta, procurementOrder } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type ProcurementStatus } from '@/types';
import { Check } from 'lucide-react';

/** Where a vendor need is in the pipeline. */
export default function ProcurementStepper({ status }: { status: ProcurementStatus }) {
    const currentIndex = procurementOrder.indexOf(status);

    return (
        <div className="space-y-2">
            <ol className="flex items-start">
                {procurementOrder.map((step, index) => {
                    const done = index < currentIndex;
                    const active = index === currentIndex;

                    return (
                        <li key={step} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                            <div className="flex w-full items-center">
                                <div
                                    className={cn('h-px flex-1', index === 0 ? 'bg-transparent' : index <= currentIndex ? 'bg-primary' : 'bg-border')}
                                />
                                <div
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                                        done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                                        active && 'ring-primary/25 ring-4',
                                    )}
                                >
                                    {done ? <Check className="size-3.5" /> : index + 1}
                                </div>
                                <div
                                    className={cn(
                                        'h-px flex-1',
                                        index === procurementOrder.length - 1 ? 'bg-transparent' : index < currentIndex ? 'bg-primary' : 'bg-border',
                                    )}
                                />
                            </div>
                            <span className={cn('text-xs leading-tight', active ? 'font-medium' : 'text-muted-foreground')}>
                                {procurementMeta[step].label}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <p className="text-muted-foreground text-center text-sm">{procurementMeta[status].description}</p>
        </div>
    );
}

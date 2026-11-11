import { procurementMeta, procurementOrder } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type ProcurementStatus } from '@/types';
import { Check } from 'lucide-react';

/** Shows where a vendor need is in the pipeline and what the current step means. */
export default function ProcurementStepper({ status }: { status: ProcurementStatus }) {
    const currentIndex = procurementOrder.indexOf(status);
    const current = procurementMeta[status];

    return (
        <div className="space-y-3">
            <ol className="flex items-start">
                {procurementOrder.map((step, index) => {
                    const meta = procurementMeta[step];
                    const done = index < currentIndex;
                    const active = index === currentIndex;

                    return (
                        <li key={step} className="flex flex-1 flex-col items-center gap-1.5 text-center last:flex-none sm:last:flex-1">
                            <div className="flex w-full items-center">
                                <div
                                    className={cn('h-0.5 flex-1', index === 0 ? 'bg-transparent' : index <= currentIndex ? meta.solid : 'bg-border')}
                                />
                                <div
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                        done || active ? cn(meta.solid, 'text-white') : 'bg-muted text-muted-foreground',
                                        active && 'ring-4 ring-offset-0',
                                        active && 'ring-primary/20',
                                    )}
                                >
                                    {done ? <Check className="size-4" /> : index + 1}
                                </div>
                                <div
                                    className={cn(
                                        'h-0.5 flex-1',
                                        index === procurementOrder.length - 1
                                            ? 'bg-transparent'
                                            : index < currentIndex
                                              ? 'bg-primary/40'
                                              : 'bg-border',
                                    )}
                                />
                            </div>
                            <span className={cn('text-xs leading-tight', active ? 'font-semibold' : 'text-muted-foreground')}>{meta.label}</span>
                        </li>
                    );
                })}
            </ol>
            <p className="text-muted-foreground text-center text-sm">
                <span className="text-foreground font-medium">{current.label}:</span> {current.description}
            </p>
        </div>
    );
}

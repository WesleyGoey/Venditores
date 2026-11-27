import { procurementMeta, procurementOrder } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type ProcurementStatus } from '@/types';
import { Check } from 'lucide-react';

interface ProcurementStepperProps {
    status: ProcurementStatus;
    /** When given, each step is a button that sets the status, so the page needs no second status control. */
    onSelect?: (status: ProcurementStatus) => void;
}

/** Where a vendor need is in the pipeline. */
export default function ProcurementStepper({ status, onSelect }: ProcurementStepperProps) {
    const currentIndex = procurementOrder.indexOf(status);

    return (
        <div className="space-y-3">
            <ol className="grid grid-cols-5" aria-label="Procurement status">
                {procurementOrder.map((step, index) => {
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    const content = (
                        <>
                            <span className="flex w-full items-center" aria-hidden>
                                <span
                                    className={cn(
                                        'h-px flex-1',
                                        index === 0 ? 'bg-transparent' : index <= currentIndex ? 'bg-primary' : 'bg-foreground/15',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                        done && 'bg-primary text-primary-foreground',
                                        active && 'border-primary text-primary border-2',
                                        !done && !active && 'border-foreground/20 text-muted-foreground border',
                                    )}
                                >
                                    {done ? <Check className="size-3.5" /> : index + 1}
                                </span>
                                <span
                                    className={cn(
                                        'h-px flex-1',
                                        index === procurementOrder.length - 1
                                            ? 'bg-transparent'
                                            : index < currentIndex
                                              ? 'bg-primary'
                                              : 'bg-foreground/15',
                                    )}
                                />
                            </span>
                            <span className={cn('px-1 text-xs leading-tight', active ? 'font-semibold' : 'text-muted-foreground')}>
                                {procurementMeta[step].label}
                            </span>
                        </>
                    );

                    return (
                        <li key={step} className="flex">
                            {onSelect ? (
                                <button
                                    type="button"
                                    onClick={() => !active && onSelect(step)}
                                    aria-current={active ? 'step' : undefined}
                                    title={active ? procurementMeta[step].description : `Set to ${procurementMeta[step].label}`}
                                    className="focus-visible:ring-ring flex min-h-11 w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg py-1 text-center transition-colors hover:bg-white/50 focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    {content}
                                </button>
                            ) : (
                                <span aria-current={active ? 'step' : undefined} className="flex w-full flex-col items-center gap-1.5 text-center">
                                    {content}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
            <p className="text-muted-foreground text-center text-sm">{procurementMeta[status].description}</p>
        </div>
    );
}

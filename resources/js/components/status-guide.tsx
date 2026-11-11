import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { procurementMeta, procurementOrder, quoteMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type QuoteStatus } from '@/types';
import { CircleHelp } from 'lucide-react';

const quoteOrder: QuoteStatus[] = ['pending', 'accepted', 'rejected'];

function Row({ label, description, badge }: { label: string; description: string; badge: string }) {
    return (
        <li className="flex items-start gap-3">
            <span
                className={cn(
                    'mt-0.5 inline-flex w-36 shrink-0 justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    badge,
                )}
            >
                {label}
            </span>
            <span className="text-sm">{description}</span>
        </li>
    );
}

export default function StatusGuide() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <CircleHelp className="size-4" />
                    What do the statuses mean?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Status guide</DialogTitle>
                    <DialogDescription>
                        Each vendor need moves through these steps. Most steps update on their own when you work with quotes.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Vendor need status</h3>
                        <ol className="space-y-2">
                            {procurementOrder.map((status) => (
                                <Row key={status} {...procurementMeta[status]} />
                            ))}
                        </ol>
                        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                            <li>Searching for vendors online moves "Not started" to "Finding vendors".</li>
                            <li>Adding a quote moves the need to "Comparing offers".</li>
                            <li>Choosing a quote moves it to "Vendor chosen". Un-choosing or declining the last offer steps it back.</li>
                            <li>"Paid" is the only step you set yourself.</li>
                        </ul>
                    </section>
                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Quote status</h3>
                        <ul className="space-y-2">
                            {quoteOrder.map((status) => (
                                <Row key={status} {...quoteMeta[status]} />
                            ))}
                        </ul>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

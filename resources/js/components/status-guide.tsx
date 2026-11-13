import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { procurementMeta, procurementOrder, quoteMeta } from '@/lib/status-meta';
import { cn } from '@/lib/utils';
import { type QuoteStatus } from '@/types';
import { CircleHelp } from 'lucide-react';

const quoteOrder: QuoteStatus[] = ['pending', 'accepted', 'rejected'];

function Row({ label, description, badge }: { label: string; description: string; badge: string }) {
    return (
        <li className="flex items-center gap-3">
            <span className={cn('inline-flex w-32 shrink-0 justify-center rounded-md px-2 py-0.5 text-xs font-medium', badge)}>{label}</span>
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
                    Status help
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Status help</DialogTitle>
                    <DialogDescription>Most statuses change by themselves as you work with quotes.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                    <section className="space-y-2">
                        <h3 className="text-sm font-medium">Vendor need</h3>
                        <ul className="space-y-2">
                            {procurementOrder.map((status) => (
                                <Row key={status} {...procurementMeta[status]} />
                            ))}
                        </ul>
                        <p className="text-muted-foreground text-xs">Only "Paid" is set by you.</p>
                    </section>
                    <section className="space-y-2">
                        <h3 className="text-sm font-medium">Quote</h3>
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

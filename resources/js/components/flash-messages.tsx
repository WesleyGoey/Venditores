import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const [visible, setVisible] = useState({ success: true, error: true });

    useEffect(() => {
        setVisible({ success: true, error: true });
    }, [flash.success, flash.error]);

    return (
        <div className="space-y-2 px-4 pt-4 empty:hidden" aria-live="polite">
            {flash.success && visible.success && (
                <div className="border-primary/30 bg-primary/10 text-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                    <CircleCheck className="text-primary mt-0.5 size-4 shrink-0" />
                    <p className="flex-1">{flash.success}</p>
                    <button type="button" onClick={() => setVisible((current) => ({ ...current, success: false }))} aria-label="Dismiss">
                        <X className="size-4" />
                    </button>
                </div>
            )}
            {flash.error && visible.error && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <p className="flex-1">{flash.error}</p>
                    <button type="button" onClick={() => setVisible((current) => ({ ...current, error: false }))} aria-label="Dismiss">
                        <X className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

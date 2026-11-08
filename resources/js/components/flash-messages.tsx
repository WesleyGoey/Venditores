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
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    <CircleCheck className="mt-0.5 size-4 shrink-0" />
                    <p className="flex-1">{flash.success}</p>
                    <button type="button" onClick={() => setVisible((current) => ({ ...current, success: false }))} aria-label="Dismiss">
                        <X className="size-4" />
                    </button>
                </div>
            )}
            {flash.error && visible.error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
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

import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/** Changes that arrive together (one save can touch several rows) cause a single reload. */
const RELOAD_DELAY_MS = 400;

/**
 * Keeps the open page in step with the database. Laravel pings a Supabase Realtime Broadcast
 * channel after data changes, and the page reloads its props when the ping arrives.
 * The ping carries no data, so what a user sees is still decided by Laravel.
 */
export function useRealtimeRefresh(): void {
    const { realtime } = usePage<SharedData>().props;
    const connectionKey = realtime ? `${realtime.url}|${realtime.key}|${realtime.topics.join(',')}` : null;

    useEffect(() => {
        if (!realtime) {
            return;
        }

        let timer: number | undefined;
        let cleanup = () => {};
        let cancelled = false;

        const reload = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => router.reload({ async: true }), RELOAD_DELAY_MS);
        };

        import('@supabase/supabase-js')
            .then(({ createClient }) => {
                if (cancelled) {
                    return;
                }

                const supabase = createClient(realtime.url, realtime.key, { auth: { persistSession: false, autoRefreshToken: false } });

                realtime.topics.forEach((topic) => supabase.channel(topic).on('broadcast', { event: 'changed' }, reload).subscribe());

                cleanup = () => void supabase.removeAllChannels();
            })
            .catch((error) => console.error('Realtime could not start:', error));

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            cleanup();
        };
        // Reconnect only when the connection itself changes, not on every page visit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionKey]);
}

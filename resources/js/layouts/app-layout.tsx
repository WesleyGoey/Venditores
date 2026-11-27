import { AppTopbar } from '@/components/app-topbar';
import { FlashMessages } from '@/components/flash-messages';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    useRealtimeRefresh();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <AppTopbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 sm:px-6">
                <FlashMessages />
                {children}
            </main>
        </div>
    );
}

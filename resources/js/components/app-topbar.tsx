import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { shortName } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Menu } from 'lucide-react';

interface Destination {
    title: string;
    href: string;
}

/** The committee's four places. The admin only runs the vendor directory, so it gets no nav at all. */
const committeeNav: Destination[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Events', href: '/events' },
    { title: 'Vendors', href: '/vendors' },
    { title: 'History', href: '/history' },
];

function isCurrent(url: string, href: string): boolean {
    const path = url.split('?')[0];

    return path === href || path.startsWith(`${href}/`);
}

/**
 * The app's one frosted surface: a sticky pill like the landing page's, so signed-in screens
 * share the sheet language instead of a starter-kit sidebar.
 */
export function AppTopbar() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const getInitials = useInitials();
    const hasNav = !auth.user.is_admin && !auth.user.is_vendor;
    const nav = hasNav ? committeeNav : [];
    const home = hasNav ? '/dashboard' : '/vendors';

    return (
        <header className="glass sticky top-3 z-30 mx-auto mt-3 grid w-[calc(100%-1.5rem)] max-w-6xl grid-cols-[1fr_auto] items-center gap-2 rounded-full px-3 py-2 sm:w-[calc(100%-3rem)] sm:px-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-1">
                {nav.length > 0 && (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Open menu">
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72">
                            <SheetTitle className="font-display">Venditores</SheetTitle>
                            <SheetDescription className="sr-only">Go to another part of the app.</SheetDescription>
                            <nav className="mt-6 flex flex-col" aria-label="Main">
                                {nav.map((item) => {
                                    const current = isCurrent(url, item.href);

                                    return (
                                        <SheetClose asChild key={item.href}>
                                            <Link
                                                href={item.href}
                                                aria-current={current ? 'page' : undefined}
                                                className={cn(
                                                    'border-foreground/10 flex min-h-12 items-center border-b text-base',
                                                    current ? 'font-semibold' : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                {current && <span aria-hidden className="bg-foreground mr-3 h-5 w-0.5 rounded-full" />}
                                                {item.title}
                                            </Link>
                                        </SheetClose>
                                    );
                                })}
                            </nav>
                        </SheetContent>
                    </Sheet>
                )}

                <Link href={home} prefetch className="font-display flex min-h-11 items-center gap-2 rounded-full px-2 font-semibold">
                    <AppLogoIcon className="fill-primary size-5" />
                    Venditores
                </Link>
            </div>

            {nav.length > 0 && (
                <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
                    {nav.map((item) => {
                        const current = isCurrent(url, item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                aria-current={current ? 'page' : undefined}
                                className={cn(
                                    'relative rounded-lg px-3 py-2 transition-colors',
                                    current ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-white/60',
                                )}
                            >
                                {item.title}
                                {current && <span aria-hidden className="bg-foreground absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full" />}
                            </Link>
                        );
                    })}
                </nav>
            )}

            <div className="flex justify-end md:col-start-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-11 gap-2 px-2" aria-label={`Account menu for ${auth.user.name}`}>
                            <span className="bg-foreground text-background flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                                {getInitials(auth.user.name)}
                            </span>
                            <span className="hidden max-w-40 truncate text-sm sm:inline">{shortName(auth.user.name)}</span>
                            <ChevronDown className="text-muted-foreground size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60" align="end">
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

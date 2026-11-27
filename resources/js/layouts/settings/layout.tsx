import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

const sections = [
    { title: 'Profile', href: '/settings/profile' },
    { title: 'Password', href: '/settings/password' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();

    return (
        <>
            <Heading title="Settings" />
            <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
                <nav className="border-foreground/10 flex gap-1 border-b lg:flex-col lg:border-b-0" aria-label="Settings">
                    {sections.map((section) => {
                        const current = url.startsWith(section.href);

                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                prefetch
                                aria-current={current ? 'page' : undefined}
                                className={cn(
                                    'relative flex min-h-11 items-center rounded-lg px-3 text-sm',
                                    current ? 'font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-white/50',
                                )}
                            >
                                {current && (
                                    <span
                                        aria-hidden
                                        className="bg-foreground absolute inset-x-3 -bottom-px h-0.5 rounded-full lg:inset-x-auto lg:inset-y-2.5 lg:left-0 lg:h-auto lg:w-0.5"
                                    />
                                )}
                                {section.title}
                            </Link>
                        );
                    })}
                </nav>
                <section className="max-w-xl space-y-12">{children}</section>
            </div>
        </>
    );
}

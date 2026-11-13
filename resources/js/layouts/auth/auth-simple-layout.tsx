import AppLogoIcon from '@/components/app-logo-icon';
import GlassBackdrop from '@/components/glass-backdrop';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

const points = ['Upload a proposal and get the vendor list', 'Pick vendors with reviews or search the web', 'Compare offers scored on fit and price'];

function Logo({ className }: { className?: string }) {
    return (
        <Link href={route('home')} className={`font-display flex items-center gap-2 font-semibold ${className ?? ''}`}>
            <AppLogoIcon className="fill-primary size-5" />
            Venditores
        </Link>
    );
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-8">
            <GlassBackdrop />

            <div className="grid w-full max-w-4xl items-stretch gap-4 lg:grid-cols-[1.1fr_1fr]">
                <aside className="glass hidden flex-col justify-between gap-12 rounded-3xl p-8 lg:flex">
                    <Logo />

                    <div className="space-y-5">
                        <h2 className="text-3xl leading-[1.1] font-bold tracking-tight">
                            From proposal
                            <br />
                            to vendor plan.
                        </h2>
                        <ul className="space-y-2.5">
                            {points.map((point) => (
                                <li key={point} className="text-muted-foreground flex items-center gap-2.5 text-sm">
                                    <Check className="text-primary size-4 shrink-0" strokeWidth={3} />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                <main className="glass flex flex-col justify-center rounded-3xl p-6 sm:p-8">
                    <Logo className="mb-6 lg:hidden" />
                    <div className="mb-6 space-y-1.5">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm text-balance">{description}</p>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
}

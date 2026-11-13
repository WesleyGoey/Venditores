import AppLogoIcon from '@/components/app-logo-icon';
import GlassBackdrop from '@/components/glass-backdrop';
import { Link } from '@inertiajs/react';
import { FileText, Scale, Store } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

const points = [
    { icon: FileText, text: 'Upload a proposal and get the vendor list' },
    { icon: Store, text: 'Pick vendors with reviews or search the web' },
    { icon: Scale, text: 'Compare offers scored on fit and price' },
];

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-8">
            <GlassBackdrop />

            <div className="grid w-full max-w-5xl items-stretch gap-4 lg:grid-cols-[1.1fr_1fr]">
                <aside className="glass hidden flex-col justify-between gap-12 rounded-3xl p-10 lg:flex">
                    <Link href={route('home')} className="flex items-center gap-2 font-semibold">
                        <AppLogoIcon className="fill-primary size-6" />
                        Venditores
                    </Link>

                    <div className="space-y-6">
                        <h2 className="text-4xl leading-[1.1] font-bold tracking-tight">
                            From proposal
                            <br />
                            to vendor plan.
                        </h2>
                        <ul className="space-y-3">
                            {points.map((point) => (
                                <li key={point.text} className="flex items-center gap-3 text-sm">
                                    <span className="bg-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-white">
                                        <point.icon className="size-4" />
                                    </span>
                                    <span className="text-muted-foreground">{point.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex h-2 overflow-hidden rounded-full" aria-hidden>
                        {['#244CFF', '#17191D', '#6F86FF', '#5B616A', '#AEBBFF', '#9AA1AA'].map((color, i) => (
                            <div key={color} className="h-full" style={{ width: `${[30, 28, 17, 12, 8, 5][i]}%`, backgroundColor: color }} />
                        ))}
                    </div>
                </aside>

                <main className="glass flex flex-col justify-center rounded-3xl p-6 sm:p-10">
                    <Link href={route('home')} className="mb-6 flex items-center gap-2 font-semibold lg:hidden">
                        <AppLogoIcon className="fill-primary size-6" />
                        Venditores
                    </Link>
                    <div className="mb-8 space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm text-balance">{description}</p>
                    </div>
                    {children}
                </main>
            </div>
        </div>
    );
}

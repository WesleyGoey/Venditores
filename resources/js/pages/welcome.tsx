import AppLogoIcon from '@/components/app-logo-icon';
import { formatRupiah } from '@/lib/format';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, FileText, Scale, Store } from 'lucide-react';

const exampleBudget = 150_000_000;

const exampleAllocation = [
    { category: 'Venue', percentage: 30, color: '#244CFF' },
    { category: 'Catering', percentage: 28, color: '#17191D' },
    { category: 'Sound & lighting', percentage: 17, color: '#6F86FF' },
    { category: 'Decoration', percentage: 12, color: '#5B616A' },
    { category: 'Documentation', percentage: 8, color: '#AEBBFF' },
    { category: 'Printing', percentage: 5, color: '#9AA1AA' },
];

const features = [
    { icon: FileText, title: 'Upload a proposal', text: 'AI fills in your event details, lists the vendors you need and splits the budget.' },
    { icon: Store, title: 'Find vendors', text: 'Pick from admin recommendations with reviews, or search the web.' },
    { icon: Scale, title: 'Compare offers', text: 'Every offer is scored on fit and price. Cheaper scores higher.' },
];

const displayFont = { fontFamily: "'Bricolage Grotesque', 'Instrument Sans', sans-serif" };

/** Frosted glass surface used across this page. */
const glass = 'border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(23,25,29,0.08)] backdrop-blur-xl';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Venditores">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:500,700|instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="relative min-h-screen overflow-hidden bg-[#E8EBED] text-[#17191D]">
                {/* Color behind the glass. Without it the blur has nothing to blur. */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-[#244CFF]/40 blur-3xl" />
                    <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-[#17191D]/20 blur-3xl" />
                    <div className="absolute -bottom-40 left-1/4 size-[28rem] rounded-full bg-[#244CFF]/25 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-5xl px-6">
                    <header className={`mt-6 flex items-center justify-between rounded-full px-5 py-3 ${glass}`}>
                        <Link href={route('home')} className="flex items-center gap-2 font-semibold" style={displayFont}>
                            <AppLogoIcon className="size-5 fill-[#244CFF]" />
                            Venditores
                        </Link>
                        <nav className="flex items-center gap-1 text-sm font-medium">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-full bg-[#244CFF] px-4 py-1.5 text-white hover:bg-[#1B3BE0]">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-full px-4 py-1.5 hover:bg-white/60">
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className="rounded-full bg-[#244CFF] px-4 py-1.5 text-white hover:bg-[#1B3BE0]">
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main>
                        <section className="pt-20 pb-14 text-center sm:pt-28">
                            <h1 className="mx-auto max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl" style={displayFont}>
                                From proposal to vendor plan.
                            </h1>
                            <p className="mx-auto mt-5 max-w-xl text-lg text-[#5B616A]">
                                Upload your event proposal. Venditores lists the vendors you need, splits the budget and helps you pick the best
                                offer.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <Link
                                    href={auth.user ? route('dashboard') : route('register')}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#244CFF] px-6 py-3 font-medium text-white shadow-[0_8px_24px_rgba(36,76,255,0.35)] hover:bg-[#1B3BE0]"
                                >
                                    {auth.user ? 'Open dashboard' : 'Get started'}
                                    <ArrowRight className="size-4" />
                                </Link>
                                {!auth.user && (
                                    <Link href={route('login')} className={`rounded-full px-6 py-3 font-medium hover:bg-white/60 ${glass}`}>
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </section>

                        <section aria-label="Example budget split" className={`rounded-3xl p-6 sm:p-8 ${glass}`}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-sm text-[#5B616A]">Example: two-day tech festival, 800 people</p>
                                <p className="text-2xl font-bold tabular-nums" style={displayFont}>
                                    {formatRupiah(exampleBudget)}
                                </p>
                            </div>

                            <div className="budget-split mt-5 flex h-4 overflow-hidden rounded-full" aria-hidden="true">
                                {exampleAllocation.map((item) => (
                                    <div key={item.category} style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                                ))}
                            </div>

                            <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                                {exampleAllocation.map((item) => (
                                    <li key={item.category} className="flex items-center gap-3">
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="flex-1 text-sm">{item.category}</span>
                                        <span className="text-sm text-[#5B616A] tabular-nums">
                                            {formatRupiah((exampleBudget * item.percentage) / 100)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="grid gap-4 py-6 sm:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.title} className={`rounded-2xl p-6 ${glass}`}>
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#244CFF] text-white">
                                        <feature.icon className="size-5" />
                                    </span>
                                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#5B616A]">{feature.text}</p>
                                </div>
                            ))}
                        </section>
                    </main>

                    <footer className="py-10 text-center text-sm text-[#5B616A]">Cloud Computing final project, Universitas Ciputra</footer>
                </div>
            </div>
        </>
    );
}

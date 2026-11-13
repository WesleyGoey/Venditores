import AppLogoIcon from '@/components/app-logo-icon';
import GlassBackdrop from '@/components/glass-backdrop';
import { formatRupiah } from '@/lib/format';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, FileText, Scale, Sparkles, Store, Wallet } from 'lucide-react';

const exampleBudget = 150_000_000;

const exampleAllocation = [
    { category: 'Venue', percentage: 30, color: '#244CFF' },
    { category: 'Catering', percentage: 28, color: '#17191D' },
    { category: 'Sound & lighting', percentage: 17, color: '#6F86FF' },
    { category: 'Decoration', percentage: 12, color: '#5B616A' },
    { category: 'Documentation', percentage: 8, color: '#AEBBFF' },
    { category: 'Printing', percentage: 5, color: '#9AA1AA' },
];

const exampleOffers = [
    { vendor: 'Rasa Nusantara Catering', price: 41_000_000, score: 92, best: true },
    { vendor: 'Dapur Kita', price: 39_500_000, score: 81, best: false },
    { vendor: 'Boga Prima', price: 48_000_000, score: 64, best: false },
];

const steps = [
    { icon: FileText, title: 'Upload a proposal', text: 'AI fills in your event details, lists the vendors you need and splits the budget.' },
    { icon: Store, title: 'Find vendors', text: 'Pick from admin recommendations with reviews, or search the web.' },
    { icon: Scale, title: 'Compare offers', text: 'Every offer is scored on fit and price. Cheaper scores higher.' },
];

const navLinks = [
    { href: '#preview', label: 'Preview' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#start', label: 'Get started' },
];

const displayFont = { fontFamily: "'Bricolage Grotesque', 'Instrument Sans', sans-serif" };

const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-full bg-[#244CFF] font-medium text-white transition-colors hover:bg-[#1B3BE0]';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const cta = auth.user ? route('dashboard') : route('register');

    return (
        <>
            <Head title="Venditores">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:500,700|instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="relative min-h-screen overflow-x-clip scroll-smooth text-[#17191D]">
                <GlassBackdrop />

                <div className="mx-auto max-w-6xl px-6">
                    <header className="glass sticky top-4 z-20 mt-4 grid grid-cols-[1fr_auto] items-center rounded-full px-5 py-2.5 md:grid-cols-[1fr_auto_1fr]">
                        <Link href={route('home')} className="flex items-center gap-2 font-semibold" style={displayFont}>
                            <AppLogoIcon className="size-5 fill-[#244CFF]" />
                            Venditores
                        </Link>
                        <nav className="hidden items-center gap-1 text-sm font-medium text-[#5B616A] md:flex">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-full px-4 py-1.5 transition-colors hover:bg-white/70 hover:text-[#17191D]"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                        <div className="flex items-center justify-end gap-1 text-sm font-medium">
                            {auth.user ? (
                                <Link href={route('dashboard')} className={`${primaryButton} px-4 py-1.5`}>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-full px-4 py-1.5 hover:bg-white/70">
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className={`${primaryButton} px-4 py-1.5`}>
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                    <main>
                        <section className="pt-20 pb-16 text-center sm:pt-28">
                            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                                <Sparkles className="size-4 text-[#244CFF]" />
                                AI vendor planning for event committees
                            </span>
                            <h1 className="mx-auto mt-6 max-w-4xl text-5xl leading-[1.04] font-bold tracking-tight sm:text-7xl" style={displayFont}>
                                From proposal to{' '}
                                <span className="bg-gradient-to-r from-[#244CFF] to-[#7A8FFF] bg-clip-text text-transparent">vendor plan.</span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-xl text-lg text-[#5B616A]">
                                Upload your event proposal. Venditores lists the vendors you need, splits the budget and helps you pick the best
                                offer.
                            </p>
                            <div className="mt-9 flex flex-wrap justify-center gap-3">
                                <Link href={cta} className={`${primaryButton} px-7 py-3.5 shadow-[0_8px_24px_rgba(36,76,255,0.35)]`}>
                                    {auth.user ? 'Open dashboard' : 'Get started'}
                                    <ArrowRight className="size-4" />
                                </Link>
                                {!auth.user && (
                                    <Link href={route('login')} className="glass rounded-full px-7 py-3.5 font-medium hover:bg-white/70">
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </section>

                        <section id="preview" aria-label="Product preview" className="grid scroll-mt-24 gap-4 lg:grid-cols-5">
                            <div className="glass rounded-3xl p-6 sm:p-8 lg:col-span-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-medium">
                                            <Wallet className="size-4 text-[#244CFF]" />
                                            Budget split
                                        </p>
                                        <p className="mt-1 text-sm text-[#5B616A]">Example: two-day tech festival, 800 people</p>
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums sm:text-3xl" style={displayFont}>
                                        {formatRupiah(exampleBudget)}
                                    </p>
                                </div>

                                <div className="budget-split mt-6 flex h-4 overflow-hidden rounded-full" aria-hidden="true">
                                    {exampleAllocation.map((item) => (
                                        <div key={item.category} style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                                    ))}
                                </div>

                                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
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
                            </div>

                            <div className="glass flex flex-col rounded-3xl p-6 sm:p-8 lg:col-span-2">
                                <p className="flex items-center gap-2 text-sm font-medium">
                                    <Scale className="size-4 text-[#244CFF]" />
                                    Offer comparison
                                </p>
                                <p className="mt-1 text-sm text-[#5B616A]">Example: catering, budget {formatRupiah(42_000_000)}</p>

                                <ul className="mt-6 flex flex-1 flex-col gap-3">
                                    {exampleOffers.map((offer) => (
                                        <li
                                            key={offer.vendor}
                                            className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                                                offer.best ? 'border-[#244CFF]/50 bg-[#244CFF]/10' : 'border-white/70 bg-white/40'
                                            }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{offer.vendor}</p>
                                                <p className="text-xs text-[#5B616A] tabular-nums">{formatRupiah(offer.price)}</p>
                                            </div>
                                            {offer.best && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#244CFF] px-2 py-0.5 text-xs font-medium text-white">
                                                    <Check className="size-3" />
                                                    Best
                                                </span>
                                            )}
                                            <span className="w-9 text-right text-xl font-bold tabular-nums" style={displayFont}>
                                                {offer.score}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="how-it-works" className="scroll-mt-24 pt-24">
                            <div className="mx-auto max-w-xl text-center">
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={displayFont}>
                                    Three steps, one plan.
                                </h2>
                                <p className="mt-3 text-[#5B616A]">No spreadsheets. No chasing offers across chats.</p>
                            </div>
                            <ol className="mt-10 grid gap-4 md:grid-cols-3">
                                {steps.map((step, index) => (
                                    <li key={step.title} className="glass relative rounded-3xl p-7">
                                        <span className="absolute top-6 right-7 text-5xl font-bold text-[#17191D]/10" style={displayFont}>
                                            {index + 1}
                                        </span>
                                        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#244CFF] text-white shadow-[0_8px_20px_rgba(36,76,255,0.3)]">
                                            <step.icon className="size-5" />
                                        </span>
                                        <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#5B616A]">{step.text}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section id="start" className="scroll-mt-24 py-24">
                            <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0"
                                    style={{ backgroundImage: 'radial-gradient(40rem 20rem at 50% 120%, rgba(36,76,255,.25), transparent 70%)' }}
                                />
                                <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl" style={displayFont}>
                                    Ready to plan your next event?
                                </h2>
                                <p className="relative mx-auto mt-3 max-w-md text-[#5B616A]">
                                    Upload a proposal and see your vendor list in minutes.
                                </p>
                                <Link href={cta} className={`${primaryButton} relative mt-8 px-7 py-3.5 shadow-[0_8px_24px_rgba(36,76,255,0.35)]`}>
                                    {auth.user ? 'Open dashboard' : 'Create your account'}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </section>
                    </main>

                    <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#17191D]/10 py-8 text-sm text-[#5B616A] sm:flex-row">
                        <span className="flex items-center gap-2 font-semibold text-[#17191D]" style={displayFont}>
                            <AppLogoIcon className="size-4 fill-[#244CFF]" />
                            Venditores
                        </span>
                        <p>&copy; 2026 Venditores. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </>
    );
}

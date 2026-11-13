import AppLogoIcon from '@/components/app-logo-icon';
import GlassBackdrop from '@/components/glass-backdrop';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, ChevronDown, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

/* Example data only: an invented event, vendors and offers that show the mechanism. Labelled as an example on the page. */

const BUDGET = 150_000_000;

type Status = 'locked' | 'comparing' | 'open';

interface Offer {
    vendor: string;
    price: number;
    /** How well the offer details fit the specification, 0-100. */
    spec: number;
    /** Cheaper scores higher, 0-100. */
    priceScore: number;
}

interface Need {
    name: string;
    amount: number;
    status: Status;
    vendor?: string;
    offers?: Offer[];
}

const needs: Need[] = [
    { name: 'Venue', amount: 45_000_000, status: 'locked', vendor: 'Grand City Convention Hall' },
    {
        name: 'Catering',
        amount: 42_000_000,
        status: 'comparing',
        offers: [
            { vendor: 'Rasa Nusantara Catering', price: 41_000_000, spec: 95, priceScore: 88 },
            { vendor: 'Dapur Kita', price: 39_500_000, spec: 78, priceScore: 94 },
            { vendor: 'Boga Prima', price: 48_000_000, spec: 70, priceScore: 52 },
        ],
    },
    {
        name: 'Sound & lighting',
        amount: 25_500_000,
        status: 'comparing',
        offers: [
            { vendor: 'Sonic Pro Audio', price: 24_000_000, spec: 91, priceScore: 90 },
            { vendor: 'Lumina Stage Lighting', price: 27_500_000, spec: 84, priceScore: 66 },
        ],
    },
    { name: 'Decoration', amount: 18_000_000, status: 'open' },
    { name: 'Documentation', amount: 12_000_000, status: 'open' },
    { name: 'Printing', amount: 7_500_000, status: 'open' },
];

/** Same formula the app uses: 60% spec fit, 40% price. */
const score = (offer: Offer) => Math.round(offer.spec * 0.6 + offer.priceScore * 0.4);

const ranked = (offers: Offer[]) => [...offers].sort((a, b) => score(b) - score(a));

const steps = [
    { verb: 'Upload', object: 'your proposal', text: 'AI fills in the event details, lists the vendors you need and splits the budget across them.' },
    { verb: 'Choose', object: 'your vendors', text: 'Pick from admin recommendations with reviews, or search the web without leaving the page.' },
    { verb: 'Compare', object: 'the offers', text: 'Every offer is scored on fit and price. Cheaper scores higher.' },
];

const navLinks = [
    { href: '#example', label: 'Example' },
    { href: '#how-it-works', label: 'How it works' },
];

const displayFont = { fontFamily: "'Bricolage Grotesque', 'Onest', sans-serif" };

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244CFF]';

const primaryButton = `inline-flex items-center justify-center gap-2 rounded-full bg-[#244CFF] font-medium text-white transition-colors hover:bg-[#1B3BE0] ${focusRing}`;

const rule = 'border-[#17191D]/10';

/** Row grid shared by the header, every need and the total, so the columns line up. */
const rowGrid = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[1.25fr_1.5fr_1.1fr_1fr_0.95fr] md:gap-x-6';

function reducedMotion(): boolean {
    return typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Rows land one by one and the total follows. Reduced motion shows the finished sheet. */
function useRevealedRows(count: number): number {
    const [revealed, setRevealed] = useState(() => (reducedMotion() ? count : 0));

    useEffect(() => {
        if (reducedMotion()) {
            return;
        }

        const timers = Array.from({ length: count }, (_, i) => window.setTimeout(() => setRevealed(i + 1), 300 + i * 160 + 250));

        return () => timers.forEach(window.clearTimeout);
    }, [count]);

    return revealed;
}

function StatusMark({ status }: { status: Status }) {
    if (status === 'locked') {
        return (
            <span className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#17191D] text-white">
                    <Check className="size-3" strokeWidth={3} />
                </span>
                Locked
            </span>
        );
    }

    if (status === 'comparing') {
        return (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#244CFF]">
                <span className="flex size-5 items-center justify-center rounded-full border-2 border-[#244CFF]">
                    <span className="size-1.5 rounded-full bg-[#244CFF]" />
                </span>
                Comparing
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 text-sm text-[#5B616A]">
            <span className="flex size-5 items-center justify-center">
                <span className="h-px w-3 bg-[#5B616A]" />
            </span>
            Not started
        </span>
    );
}

function Offers({ need }: { need: Need }) {
    const offers = ranked(need.offers ?? []);

    return (
        <div className="px-5 pb-6 md:px-8">
            <div className="rounded-2xl border border-white/70 bg-white/45">
                <p className="px-4 pt-3.5 pb-3 text-sm text-[#5B616A]">
                    Offers for <span className="font-semibold text-[#17191D]">{need.name}</span> against {formatRupiah(need.amount)}. Score = 60% spec
                    fit + 40% price.
                </p>
                <div
                    className={cn(
                        'grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 border-t px-4 py-2 text-xs font-medium text-[#5B616A] md:grid-cols-[1.6fr_1fr_1fr_0.6fr_0.6fr_0.6fr] md:gap-x-6',
                        rule,
                    )}
                >
                    <span>Vendor</span>
                    <span className="text-right">Price</span>
                    <span className="hidden text-right md:block">Against budget</span>
                    <span className="hidden text-right md:block">Spec</span>
                    <span className="hidden text-right md:block">Price</span>
                    <span className="text-right">Score</span>
                </div>
                {offers.map((offer, index) => {
                    const difference = offer.price - need.amount;

                    return (
                        <div
                            key={offer.vendor}
                            className={cn(
                                'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 border-t px-4 py-3 text-sm md:grid-cols-[1.6fr_1fr_1fr_0.6fr_0.6fr_0.6fr] md:gap-x-6',
                                rule,
                            )}
                        >
                            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium md:truncate">{offer.vendor}</span>
                                {index === 0 && (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#244CFF] px-2 py-0.5 text-xs font-medium text-white">
                                        <Check className="size-3" strokeWidth={3} />
                                        Best
                                    </span>
                                )}
                                <span className="basis-full text-xs text-[#5B616A] md:hidden">
                                    Fit {offer.spec}, price {offer.priceScore}, {formatRupiah(Math.abs(difference))}{' '}
                                    {difference > 0 ? 'over' : 'under'}
                                </span>
                            </span>
                            <span className="text-right tabular-nums">{formatRupiah(offer.price)}</span>
                            <span className={cn('hidden text-right tabular-nums md:block', difference > 0 ? 'text-[#B42318]' : 'text-[#5B616A]')}>
                                {formatRupiah(Math.abs(difference))} {difference > 0 ? 'over' : 'under'}
                            </span>
                            <span className="hidden text-right tabular-nums md:block">{offer.spec}</span>
                            <span className="hidden text-right tabular-nums md:block">{offer.priceScore}</span>
                            <span className="text-right text-base font-bold tabular-nums" style={displayFont}>
                                {score(offer)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function NeedRow({ need, index, open, onToggle }: { need: Need; index: number; open: boolean; onToggle: () => void }) {
    const share = (need.amount / BUDGET) * 100;
    const offers = need.offers ? ranked(need.offers) : [];
    const expandable = offers.length > 0;
    const vendor = need.status === 'locked' ? need.vendor : expandable ? `${offers.length} offers, best ${score(offers[0])}` : '-';

    const cells = (
        <>
            <span className="flex min-w-0 items-center gap-3">
                <span className="min-w-0">
                    <span className="block truncate font-semibold">{need.name}</span>
                    <span className="mt-1 flex flex-col gap-0.5 md:hidden">
                        <StatusMark status={need.status} />
                        {need.status !== 'open' && <span className="truncate text-xs text-[#5B616A]">{vendor}</span>}
                    </span>
                </span>
                {expandable && (
                    <ChevronDown className={cn('size-4 shrink-0 text-[#244CFF] transition-transform duration-300 md:hidden', open && 'rotate-180')} />
                )}
            </span>
            <span className={cn('hidden truncate text-sm md:block', need.status === 'open' ? 'text-[#5B616A]' : 'text-[#17191D]')}>{vendor}</span>
            <span className="text-right font-medium tabular-nums md:text-left">{formatRupiah(need.amount)}</span>
            <span className="hidden items-center gap-3 md:flex">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#17191D]/10" aria-hidden>
                    <span
                        className="rab-bar block h-full rounded-full bg-[#17191D]/40"
                        style={{ width: `${share}%`, '--i': index } as React.CSSProperties}
                    />
                </span>
                <span className="w-9 text-right text-sm text-[#5B616A] tabular-nums">{Math.round(share)}%</span>
            </span>
            <span className="hidden items-center justify-between gap-2 md:flex">
                <StatusMark status={need.status} />
                {expandable && <ChevronDown className={cn('size-4 text-[#5B616A] transition-transform duration-300', open && 'rotate-180')} />}
            </span>
        </>
    );

    return (
        <div className={cn('rab-row border-t', rule)} style={{ '--i': index } as React.CSSProperties}>
            {expandable ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    aria-controls={`offers-${index}`}
                    className={cn(rowGrid, 'w-full px-5 py-3 text-left transition-colors hover:bg-white/50 md:px-8', focusRing)}
                >
                    {cells}
                </button>
            ) : (
                <div className={cn(rowGrid, 'px-5 py-3 md:px-8')}>{cells}</div>
            )}
            {expandable && (
                <div
                    id={`offers-${index}`}
                    className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
                >
                    <div className="overflow-hidden" inert={!open}>
                        <Offers need={need} />
                    </div>
                </div>
            )}
        </div>
    );
}

function Sheet({ cta, signedIn }: { cta: string; signedIn: boolean }) {
    const revealed = useRevealedRows(needs.length);
    const [open, setOpen] = useState<number | null>(null);
    const total = needs.slice(0, revealed).reduce((sum, need) => sum + need.amount, 0);
    const complete = revealed === needs.length;

    return (
        <section id="example" aria-label="Example budget sheet" className="glass scroll-mt-24 overflow-hidden rounded-3xl">
            <div className="grid gap-6 px-5 pt-8 pb-6 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
                <h1 className="text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl" style={displayFont}>
                    From proposal to vendor plan.
                </h1>
                <div className="space-y-4">
                    <p className="text-base leading-relaxed text-[#3D434B]">
                        Upload your event proposal. Venditores lists the vendors you need and splits the budget.
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <Link href={cta} className={`${primaryButton} px-5 py-2.5`}>
                            {signedIn ? 'Open dashboard' : 'Get started'}
                            <ArrowRight className="size-4" />
                        </Link>
                        {!signedIn && (
                            <Link
                                href={route('login')}
                                className={`rounded-full border border-white/70 bg-white/50 px-5 py-2.5 font-medium transition-colors hover:bg-white/80 ${focusRing}`}
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div
                className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-5 py-3 text-sm text-[#5B616A] md:px-8', rule)}
            >
                <span className="inline-flex items-center gap-2">
                    <FileText className="size-4" />
                    Example sheet: two-day tech festival, 800 people. Invented data.
                </span>
            </div>

            <div className={cn(rowGrid, 'border-t px-5 py-2.5 text-xs font-medium text-[#5B616A] md:px-8', rule)}>
                <span>Need</span>
                <span className="hidden md:block">Vendor</span>
                <span className="text-right md:text-left">Budget</span>
                <span className="hidden md:block">Share</span>
                <span className="hidden md:block">Status</span>
            </div>

            {needs.map((need, index) => (
                <NeedRow key={need.name} need={need} index={index} open={open === index} onToggle={() => setOpen(open === index ? null : index)} />
            ))}

            <div className={cn(rowGrid, 'border-t-2 border-[#17191D]/70 bg-white/35 px-5 py-4 md:px-8')}>
                <span className="font-semibold">Total</span>
                <span className="hidden items-center gap-2 text-sm md:inline-flex">
                    {complete ? (
                        <>
                            <Check className="size-4 text-[#244CFF]" strokeWidth={3} />
                            Every rupiah allocated
                        </>
                    ) : (
                        <span className="text-[#5B616A]">Reading the proposal…</span>
                    )}
                </span>
                <span
                    className="text-right text-xl font-bold tracking-tight tabular-nums md:text-left md:text-2xl"
                    style={displayFont}
                    aria-live="off"
                >
                    {formatRupiah(complete ? BUDGET : total)}
                </span>
                <span className="hidden text-sm text-[#5B616A] tabular-nums md:block">{Math.round((total / BUDGET) * 100)}%</span>
                <span className="hidden md:block" />
            </div>
        </section>
    );
}

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const signedIn = Boolean(auth.user);
    const cta = signedIn ? route('dashboard') : route('register');

    return (
        <>
            <Head title="Venditores" />

            <div
                className="relative min-h-screen overflow-x-clip text-[#17191D] selection:bg-[#244CFF] selection:text-white"
                style={{ scrollBehavior: 'smooth' }}
            >
                <GlassBackdrop />

                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <header className="glass sticky top-4 z-20 mt-4 grid grid-cols-[1fr_auto] items-center rounded-full px-5 py-2.5 md:grid-cols-[1fr_auto_1fr]">
                        <Link href={route('home')} className={`flex items-center gap-2 rounded-full font-semibold ${focusRing}`} style={displayFont}>
                            <AppLogoIcon className="size-5 fill-[#244CFF]" />
                            Venditores
                        </Link>
                        <nav className="hidden items-center gap-1 text-sm font-medium text-[#3D434B] md:flex">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className={`rounded-full px-4 py-1.5 transition-colors hover:bg-white/70 hover:text-[#17191D] ${focusRing}`}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                        <div className="flex items-center justify-end gap-1 text-sm font-medium">
                            {signedIn ? (
                                <Link href={route('dashboard')} className={`${primaryButton} px-4 py-1.5`}>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className={`rounded-full px-4 py-1.5 hover:bg-white/70 ${focusRing}`}>
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className={`${primaryButton} px-4 py-1.5`}>
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                    <main className="pt-6">
                        <Sheet cta={cta} signedIn={signedIn} />

                        <section id="how-it-works" className="scroll-mt-24 pt-16">
                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={displayFont}>
                                The committee decides. Venditores proposes and scores.
                            </h2>
                            <ol className="glass mt-6 overflow-hidden rounded-3xl">
                                {steps.map((step, index) => (
                                    <li
                                        key={step.verb}
                                        className={cn(
                                            'grid gap-2 px-5 py-5 md:grid-cols-[1fr_1.6fr] md:items-center md:gap-12 md:px-8',
                                            index > 0 && cn('border-t', rule),
                                        )}
                                    >
                                        <p className="text-xl font-bold tracking-tight" style={displayFont}>
                                            {step.verb} <span className="font-sans text-sm font-normal text-[#5B616A]">{step.object}</span>
                                        </p>
                                        <p className="max-w-md text-sm leading-relaxed text-[#3D434B]">{step.text}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section id="start" className="scroll-mt-24 py-16">
                            <div className="glass flex flex-col items-start justify-between gap-5 rounded-3xl px-5 py-8 sm:flex-row sm:items-center md:px-8">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight" style={displayFont}>
                                        Approve your first plan.
                                    </h2>
                                    <p className="text-sm text-[#3D434B]">Upload a proposal and see the sheet fill in for your own event.</p>
                                </div>
                                <Link href={cta} className={`${primaryButton} shrink-0 px-5 py-2.5 text-sm`}>
                                    {signedIn ? 'Open dashboard' : 'Create your account'}
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

import AppLogoIcon from '@/components/app-logo-icon';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, ChevronDown, FileText, Search, Sparkles, Star } from 'lucide-react';
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
    /** Colour of this need in the budget split. */
    tone: string;
    vendor?: string;
    offers?: Offer[];
}

const needs: Need[] = [
    { name: 'Venue', amount: 45_000_000, status: 'locked', tone: '#244CFF', vendor: 'Grand City Convention Hall' },
    {
        name: 'Catering',
        amount: 42_000_000,
        status: 'comparing',
        tone: '#E8944A',
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
        tone: '#261F17',
        offers: [
            { vendor: 'Sonic Pro Audio', price: 24_000_000, spec: 91, priceScore: 90 },
            { vendor: 'Lumina Stage Lighting', price: 27_500_000, spec: 84, priceScore: 66 },
        ],
    },
    { name: 'Decoration', amount: 18_000_000, status: 'open', tone: '#9AACFF' },
    { name: 'Documentation', amount: 12_000_000, status: 'open', tone: '#D3B98A' },
    { name: 'Printing', amount: 7_500_000, status: 'open', tone: '#A39580' },
];

/** Same formula the app uses: 60% spec fit, 40% price. */
const score = (offer: Offer) => Math.round(offer.spec * 0.6 + offer.priceScore * 0.4);

const ranked = (offers: Offer[]) => [...offers].sort((a, b) => score(b) - score(a));

const bestCatering = ranked(needs[1].offers ?? [])[0];

const navLinks = [
    { href: '#example', label: 'Example' },
    { href: '#how-it-works', label: 'How it works' },
];

const serif = { fontFamily: "'Instrument Serif', 'Bricolage Grotesque', serif" };

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const primaryButton = `inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-white shadow-[0_6px_20px_rgb(36_76_255/0.28)] transition-all hover:-translate-y-px hover:bg-[#1B3BE0] ${focusRing}`;

const ghostButton = `inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-white/55 font-medium backdrop-blur transition-colors hover:bg-white/85 ${focusRing}`;

const rule = 'border-foreground/10';

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

/** Colour sits behind the glass so the frosting has something to refract. */
function Orbs() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="orb absolute -top-40 -left-32 size-[34rem] rounded-full bg-[#F2A860]/55 blur-[2px]" />
            <div className="orb absolute top-1/3 -right-40 size-[38rem] rounded-full bg-[#244CFF]/20 blur-[2px]" style={{ animationDelay: '-6s' }} />
            <div className="orb absolute -bottom-52 left-1/4 size-[32rem] rounded-full bg-[#D8B98C]/60 blur-[2px]" style={{ animationDelay: '-11s' }} />
        </div>
    );
}

function StatusMark({ status }: { status: Status }) {
    if (status === 'locked') {
        return (
            <span className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-white">
                    <Check className="size-3" strokeWidth={3} />
                </span>
                Locked
            </span>
        );
    }

    if (status === 'comparing') {
        return (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <span className="flex size-5 items-center justify-center rounded-full border-2 border-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                </span>
                Comparing
            </span>
        );
    }

    return (
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <span className="flex size-5 items-center justify-center">
                <span className="bg-muted-foreground h-px w-3" />
            </span>
            Not started
        </span>
    );
}

function Offers({ need }: { need: Need }) {
    const offers = ranked(need.offers ?? []);

    return (
        <div className="px-5 pb-6 md:px-8">
            <div className="rounded-2xl border border-white/80 bg-white/50">
                <p className="text-muted-foreground px-4 pt-3.5 pb-3 text-sm">
                    Offers for <span className="text-foreground font-semibold">{need.name}</span> against {formatRupiah(need.amount)}. Score = 60% spec
                    fit + 40% price.
                </p>
                <div
                    className={cn(
                        'text-muted-foreground grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 border-t px-4 py-2 text-xs font-medium md:grid-cols-[1.6fr_1fr_1fr_0.6fr_0.6fr_0.6fr] md:gap-x-6',
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
                                    <span className="bg-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white">
                                        <Check className="size-3" strokeWidth={3} />
                                        Best
                                    </span>
                                )}
                                <span className="text-muted-foreground basis-full text-xs md:hidden">
                                    Fit {offer.spec}, price {offer.priceScore}, {formatRupiah(Math.abs(difference))} {difference > 0 ? 'over' : 'under'}
                                </span>
                            </span>
                            <span className="text-right tabular-nums">{formatRupiah(offer.price)}</span>
                            <span className={cn('hidden text-right tabular-nums md:block', difference > 0 ? 'text-[#B42318]' : 'text-muted-foreground')}>
                                {formatRupiah(Math.abs(difference))} {difference > 0 ? 'over' : 'under'}
                            </span>
                            <span className="hidden text-right tabular-nums md:block">{offer.spec}</span>
                            <span className="hidden text-right tabular-nums md:block">{offer.priceScore}</span>
                            <span className="font-display text-right text-base font-bold tabular-nums">{score(offer)}</span>
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
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: need.tone }} aria-hidden />
                <span className="min-w-0">
                    <span className="block truncate font-semibold">{need.name}</span>
                    <span className="mt-1 flex flex-col gap-0.5 md:hidden">
                        <StatusMark status={need.status} />
                        {need.status !== 'open' && <span className="text-muted-foreground truncate text-xs">{vendor}</span>}
                    </span>
                </span>
                {expandable && (
                    <ChevronDown className={cn('text-primary size-4 shrink-0 transition-transform duration-300 md:hidden', open && 'rotate-180')} />
                )}
            </span>
            <span className={cn('hidden truncate text-sm md:block', need.status === 'open' && 'text-muted-foreground')}>{vendor}</span>
            <span className="text-right font-medium tabular-nums md:text-left">{formatRupiah(need.amount)}</span>
            <span className="hidden items-center gap-3 md:flex">
                <span className="bg-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden>
                    <span
                        className="rab-bar block h-full rounded-full"
                        style={{ width: `${share}%`, background: need.tone, '--i': index } as React.CSSProperties}
                    />
                </span>
                <span className="text-muted-foreground w-9 text-right text-sm tabular-nums">{Math.round(share)}%</span>
            </span>
            <span className="hidden items-center justify-between gap-2 md:flex">
                <StatusMark status={need.status} />
                {expandable && <ChevronDown className={cn('text-muted-foreground size-4 transition-transform duration-300', open && 'rotate-180')} />}
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
                    className={cn(rowGrid, 'w-full px-5 py-3.5 text-left transition-colors hover:bg-white/55 md:px-8', focusRing)}
                >
                    {cells}
                </button>
            ) : (
                <div className={cn(rowGrid, 'px-5 py-3.5 md:px-8')}>{cells}</div>
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

/** The budget as one stacked bar, each need in its own colour. */
function SplitBar({ className }: { className?: string }) {
    return (
        <div className={cn('flex h-3 w-full gap-0.5 overflow-hidden rounded-full', className)} aria-hidden>
            {needs.map((need) => (
                <span key={need.name} className="budget-split h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(need.amount / BUDGET) * 100}%`, background: need.tone }} />
            ))}
        </div>
    );
}

/** Three overlapping glass cards: the proposal goes in, the split and the best offer come out. */
function Hero({ cta, signedIn }: { cta: string; signedIn: boolean }) {
    return (
        <section className="grid items-center gap-14 pt-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-24 lg:pb-28">
            <div>
                <p
                    className="rise glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
                    style={{ '--d': 0 } as React.CSSProperties}
                >
                    <span className="bg-primary size-1.5 rounded-full" />
                    Made for campus event committees
                </p>
                <h1
                    className="rise mt-6 text-[2.75rem] leading-[0.98] font-bold tracking-[-0.03em] text-balance sm:text-6xl lg:text-[5.25rem]"
                    style={{ '--d': 1 } as React.CSSProperties}
                >
                    Proposal in.
                    <br />
                    Vendor plan{' '}
                    <span className="text-primary font-normal tracking-normal italic" style={serif}>
                        out.
                    </span>
                </h1>
                <p className="rise text-foreground/75 mt-6 max-w-md text-lg leading-relaxed" style={{ '--d': 2 } as React.CSSProperties}>
                    Drop in the proposal PDF you already have. Venditores lists the vendors you need, splits the budget, and scores every offer you
                    collect.
                </p>
                <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--d': 3 } as React.CSSProperties}>
                    <Link href={cta} className={`${primaryButton} px-6 py-3`}>
                        {signedIn ? 'Open dashboard' : 'Upload a proposal'}
                        <ArrowRight className="size-4" />
                    </Link>
                    <a href="#example" className={`${ghostButton} px-6 py-3`}>
                        See an example
                    </a>
                </div>
            </div>

            <div className="rise relative flex flex-col gap-4 lg:block lg:h-[33rem]" style={{ '--d': 3 } as React.CSSProperties} aria-hidden>
                <div className="glass rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1 lg:absolute lg:top-0 lg:left-0 lg:w-[62%] lg:-rotate-3">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-white/70">
                            <FileText className="text-primary size-5" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">proposal-techfest.pdf</p>
                            <p className="text-muted-foreground text-xs">Read in a few seconds</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <span className="bg-foreground/10 block h-2 w-full rounded-full" />
                        <span className="bg-foreground/10 block h-2 w-11/12 rounded-full" />
                        <span className="bg-foreground/10 block h-2 w-3/5 rounded-full" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-white/70 px-2.5 py-1">800 people</span>
                        <span className="rounded-full bg-white/70 px-2.5 py-1">2 days</span>
                        <span className="rounded-full bg-white/70 px-2.5 py-1">{formatRupiah(BUDGET)}</span>
                    </div>
                </div>

                <div className="glass rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1 lg:absolute lg:top-[11.5rem] lg:right-0 lg:w-[66%] lg:rotate-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Budget split</p>
                        <span className="text-primary inline-flex items-center gap-1 text-xs font-medium">
                            <Sparkles className="size-3.5" />
                            Drafted by AI
                        </span>
                    </div>
                    <SplitBar className="mt-4" />
                    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {needs.slice(0, 4).map((need) => (
                            <li key={need.name} className="flex items-center gap-2">
                                <span className="size-2 rounded-full" style={{ background: need.tone }} />
                                <span className="truncate">{need.name}</span>
                                <span className="text-muted-foreground ml-auto tabular-nums">{Math.round((need.amount / BUDGET) * 100)}%</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="glass rounded-3xl p-5 transition-transform duration-500 hover:-translate-y-1 lg:absolute lg:bottom-0 lg:left-6 lg:w-[56%] lg:-rotate-1">
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                        <Star className="text-primary size-3.5 fill-current" />
                        Best catering offer
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-sm leading-snug font-semibold">{bestCatering.vendor}</p>
                        <p className="font-display text-5xl leading-none font-bold tracking-tight tabular-nums">{score(bestCatering)}</p>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">60% spec fit + 40% price</p>
                </div>
            </div>
        </section>
    );
}

function Sheet() {
    const revealed = useRevealedRows(needs.length);
    const [open, setOpen] = useState<number | null>(null);
    const total = needs.slice(0, revealed).reduce((sum, need) => sum + need.amount, 0);
    const complete = revealed === needs.length;

    return (
        <section id="example" aria-label="Example budget sheet" className="scroll-mt-24">
            <p className="text-primary text-sm font-medium">The example</p>
            <h2 className="mt-2 max-w-xl text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
                A real-looking RAB,{' '}
                <span className="font-normal italic" style={serif}>
                    already filled in.
                </span>
            </h2>

            <div className="glass mt-8 overflow-hidden rounded-3xl">
                <div className={cn('text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5 text-sm md:px-8')}>
                    <span className="inline-flex items-center gap-2">
                        <FileText className="size-4" />
                        Example sheet: two-day tech festival, 800 people. Invented data. Tap a row with offers to open it.
                    </span>
                </div>

                <div className={cn(rowGrid, 'text-muted-foreground border-t px-5 py-2.5 text-xs font-medium md:px-8', rule)}>
                    <span>Need</span>
                    <span className="hidden md:block">Vendor</span>
                    <span className="text-right md:text-left">Budget</span>
                    <span className="hidden md:block">Share</span>
                    <span className="hidden md:block">Status</span>
                </div>

                {needs.map((need, index) => (
                    <NeedRow key={need.name} need={need} index={index} open={open === index} onToggle={() => setOpen(open === index ? null : index)} />
                ))}

                <div className={cn(rowGrid, 'border-foreground/60 border-t-2 bg-white/40 px-5 py-4 md:px-8')}>
                    <span className="font-semibold">Total</span>
                    <span className="hidden items-center gap-2 text-sm md:inline-flex">
                        {complete ? (
                            <>
                                <Check className="text-primary size-4" strokeWidth={3} />
                                Every rupiah allocated
                            </>
                        ) : (
                            <span className="text-muted-foreground">Reading the proposal…</span>
                        )}
                    </span>
                    <span className="font-display text-right text-xl font-bold tracking-tight tabular-nums md:text-left md:text-2xl" aria-live="off">
                        {formatRupiah(complete ? BUDGET : total)}
                    </span>
                    <span className="text-muted-foreground hidden text-sm tabular-nums md:block">{Math.round((total / BUDGET) * 100)}%</span>
                    <span className="hidden md:block" />
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section id="how-it-works" className="scroll-mt-24 pt-24">
            <p className="text-primary text-sm font-medium">How it works</p>
            <h2 className="mt-2 max-w-2xl text-3xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
                The committee decides.{' '}
                <span className="font-normal italic" style={serif}>
                    Venditores proposes and scores.
                </span>
            </h2>

            <ol className="mt-10 grid gap-4 md:grid-cols-6">
                <li className="glass relative overflow-hidden rounded-3xl p-6 md:col-span-3 md:p-8">
                    <span className="text-6xl leading-none italic" style={serif}>
                        01
                    </span>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight">Upload your proposal</h3>
                    <p className="text-foreground/75 mt-2 max-w-sm text-sm leading-relaxed">
                        AI fills in the event details, lists the vendors you need and splits the budget across them. You can change anything.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
                        {['Event name', 'Date', 'Venue', 'Budget', '6 vendor needs'].map((chip) => (
                            <span key={chip} className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5">
                                {chip}
                            </span>
                        ))}
                    </div>
                </li>

                <li className="glass relative overflow-hidden rounded-3xl p-6 md:col-span-3 md:p-8">
                    <span className="text-6xl leading-none italic" style={serif}>
                        02
                    </span>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight">Choose your vendors</h3>
                    <p className="text-foreground/75 mt-2 max-w-sm text-sm leading-relaxed">
                        Pick from admin recommendations with reviews, reuse vendors from past events, or search the web without leaving the page.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1.5">
                            <Star className="text-primary size-3.5 fill-current" />
                            Admin picks
                        </span>
                        <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5">Your history</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3 py-1.5">
                            <Search className="size-3.5" />
                            Web search
                        </span>
                    </div>
                </li>

                <li className="glass relative overflow-hidden rounded-3xl p-6 md:col-span-6 md:p-8">
                    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-14">
                        <div>
                            <span className="text-6xl leading-none italic" style={serif}>
                                03
                            </span>
                            <h3 className="mt-6 text-2xl font-bold tracking-tight">Compare the offers</h3>
                            <p className="text-foreground/75 mt-2 max-w-sm text-sm leading-relaxed">
                                Every offer gets one score. The cheaper it is, the higher the price score, even when it lands under budget.
                            </p>
                        </div>
                        <div>
                            <div className="flex h-14 overflow-hidden rounded-2xl text-sm font-semibold" aria-hidden>
                                <span className="bg-primary flex w-[60%] items-center px-4 text-white">60% spec fit</span>
                                <span className="bg-foreground flex w-[40%] items-center px-4 text-white">40% price</span>
                            </div>
                            <p className="text-muted-foreground mt-3 text-xs">
                                Fit is read by AI from the offer details. Price is scored against the budget for that need.
                            </p>
                        </div>
                    </div>
                </li>
            </ol>
        </section>
    );
}

function Closing({ cta, signedIn }: { cta: string; signedIn: boolean }) {
    return (
        <section id="start" className="scroll-mt-24 py-24">
            <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-14 text-center md:px-12 md:py-20">
                <div aria-hidden className="bg-primary/25 pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full" />
                <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-[#F2A860]/45" />
                <div className="relative">
                    <h2 className="mx-auto max-w-xl text-4xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl">
                        Approve your{' '}
                        <span className="font-normal italic" style={serif}>
                            first plan.
                        </span>
                    </h2>
                    <p className="text-foreground/75 mx-auto mt-5 max-w-sm">Upload a proposal and watch the sheet fill in for your own event.</p>
                    <Link href={cta} className={`${primaryButton} mt-8 px-7 py-3.5`}>
                        {signedIn ? 'Open dashboard' : 'Create your account'}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
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

            <div className="grain relative min-h-screen overflow-x-clip selection:bg-primary selection:text-white" style={{ scrollBehavior: 'smooth' }}>
                <Orbs />

                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <header className="glass sticky top-4 z-20 mt-4 grid grid-cols-[1fr_auto] items-center rounded-full px-5 py-2.5 md:grid-cols-[1fr_auto_1fr]">
                        <Link href={route('home')} className={`font-display flex items-center gap-2 rounded-full font-semibold ${focusRing}`}>
                            <AppLogoIcon className="fill-primary size-5" />
                            Venditores
                        </Link>
                        <nav className="text-foreground/75 hidden items-center gap-1 text-sm font-medium md:flex">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className={`hover:text-foreground rounded-full px-4 py-1.5 transition-colors hover:bg-white/70 ${focusRing}`}
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

                    <main>
                        <Hero cta={cta} signedIn={signedIn} />
                        <Sheet />
                        <HowItWorks />
                        <Closing cta={cta} signedIn={signedIn} />
                    </main>

                    <footer className="border-foreground/10 text-muted-foreground flex flex-col items-center justify-between gap-4 border-t py-8 text-sm sm:flex-row">
                        <span className="font-display text-foreground flex items-center gap-2 font-semibold">
                            <AppLogoIcon className="fill-primary size-4" />
                            Venditores
                        </span>
                        <p>&copy; 2026 Venditores. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </>
    );
}

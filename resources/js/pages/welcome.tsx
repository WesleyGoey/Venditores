import AppLogoIcon from '@/components/app-logo-icon';
import { formatRupiah } from '@/lib/format';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const exampleBudget = 150_000_000;

const exampleAllocation = [
    { category: 'Venue', percentage: 30, color: '#244CFF', vital: true },
    { category: 'Catering', percentage: 28, color: '#17191D', vital: true },
    { category: 'Sound and lighting', percentage: 17, color: '#6F86FF', vital: true },
    { category: 'Decoration and booths', percentage: 12, color: '#5B616A', vital: false },
    { category: 'Documentation', percentage: 8, color: '#AEBBFF', vital: false },
    { category: 'Printing and merchandise', percentage: 5, color: '#9AA1AA', vital: false },
];

const steps = [
    { title: 'Upload the proposal', text: 'Upload the PDF. AI fills in the name, date and budget.' },
    { title: 'Get a vendor plan', text: 'AI lists the vendors you need and splits the budget to the Rupiah.' },
    { title: 'Compare offers', text: 'Use recommended vendors or search online. Each offer is scored on spec and price.' },
    { title: 'Stay on time', text: 'Track every vendor until paid. Get warned when a vital one is still open.' },
];

const displayFont = { fontFamily: "'Bricolage Grotesque', 'Instrument Sans', sans-serif" };

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Turn event proposals into vendor budgets">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:500,700|instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-[#E8EBED] text-[#17191D]">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <header className="flex items-center justify-between py-6">
                        <Link href={route('home')} className="flex items-center gap-2 text-lg font-semibold" style={displayFont}>
                            <AppLogoIcon className="size-6 fill-[#244CFF]" />
                            Venditores
                        </Link>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-md bg-[#244CFF] px-4 py-2 text-white hover:bg-[#1B3BE0]">
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-md px-4 py-2 hover:bg-[#DDE1E4]">
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className="rounded-md bg-[#244CFF] px-4 py-2 text-white hover:bg-[#1B3BE0]">
                                        Create account
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <main>
                        <section className="pt-12 pb-10 lg:pt-20">
                            <h1 className="max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl" style={displayFont}>
                                From event proposal to vendor budget, in one upload.
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#5B616A]">
                                Venditores reads your proposal PDF, lists every vendor your event needs, and shows how far the budget goes for each
                                one.
                            </p>
                            {!auth.user && (
                                <Link
                                    href={route('register')}
                                    className="mt-8 inline-block rounded-md bg-[#244CFF] px-6 py-3 font-medium text-white hover:bg-[#1B3BE0]"
                                >
                                    Plan your first event
                                </Link>
                            )}
                        </section>

                        <section aria-label="Example budget split" className="pb-20">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
                                <p className="text-sm text-[#5B616A]">Example: a two-day tech festival for 800 people</p>
                                <p className="text-xl font-bold tabular-nums" style={displayFont}>
                                    {formatRupiah(exampleBudget)}
                                </p>
                            </div>

                            <div className="budget-split flex h-20 overflow-hidden rounded-lg sm:h-28" aria-hidden="true">
                                {exampleAllocation.map((item) => (
                                    <div key={item.category} style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                                ))}
                            </div>

                            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                                {exampleAllocation.map((item) => (
                                    <li key={item.category} className="flex items-start gap-3">
                                        <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                                        <div>
                                            <p className="font-medium">
                                                {item.category}
                                                {item.vital && <span className="ml-2 text-xs font-medium text-[#D92D20]">Vital</span>}
                                            </p>
                                            <p className="text-sm text-[#5B616A] tabular-nums">
                                                {formatRupiah((exampleBudget * item.percentage) / 100)} ({item.percentage}%)
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="border-t border-[#D1D6DA] py-16">
                            <h2 className="text-3xl font-bold tracking-tight" style={displayFont}>
                                How it works
                            </h2>
                            <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                                {steps.map((step, index) => (
                                    <li key={step.title}>
                                        <p className="text-4xl font-bold text-[#244CFF]" style={displayFont}>
                                            {index + 1}
                                        </p>
                                        <h3 className="mt-3 font-semibold">{step.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#5B616A]">{step.text}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </main>

                    <footer className="border-t border-[#D1D6DA] py-6 text-sm text-[#5B616A]">
                        Cloud Computing final project, Informatics, Universitas Ciputra
                    </footer>
                </div>
            </div>
        </>
    );
}

import AppLogoIcon from '@/components/app-logo-icon';
import { formatRupiah } from '@/lib/format';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';


const exampleBudget = 150_000_000;


const exampleAllocation = [
    { category: 'Venue', percentage: 30, color: '#2546D8', vital: true },
    { category: 'Catering', percentage: 28, color: '#F2A91C', vital: true },
    { category: 'Sound and lighting', percentage: 17, color: '#0B8A83', vital: true },
    { category: 'Decoration and booths', percentage: 12, color: '#E2502F', vital: false },
    { category: 'Documentation', percentage: 8, color: '#8A3FA8', vital: false },
    { category: 'Printing and merchandise', percentage: 5, color: '#14213D', vital: false },
];


const steps = [
    { title: 'Upload the proposal', text: 'Add your event date and total budget, then upload the proposal PDF.' },
    { title: 'Review the vendor plan', text: 'AI lists the vendors you need with draft specs, and splits the budget to the exact Rupiah.' },
    { title: 'Compare quotes', text: 'Record vendor offers. Each one is scored on how well it fits the spec and the budget.' },
    { title: 'Close the gaps in time', text: 'Track every vendor from drafting to paid, and get a warning when a vital one is still open.' },
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


            <div className="min-h-screen bg-white text-[#14213D]">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <header className="flex items-center justify-between py-6">
                        <Link href={route('home')} className="flex items-center gap-2 text-lg font-semibold" style={displayFont}>
                            <AppLogoIcon className="size-6 fill-[#2546D8]" />
                            Venditores
                        </Link>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-md bg-[#2546D8] px-4 py-2 text-white hover:bg-[#1C37AD]">
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-md px-4 py-2 hover:bg-[#EEF1FB]">
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className="rounded-md bg-[#2546D8] px-4 py-2 text-white hover:bg-[#1C37AD]">
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
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#4A5468]">
                                Venditores reads your proposal PDF, lists every vendor your event needs, and shows how far the budget goes for each
                                one.
                            </p>
                            {!auth.user && (
                                <Link
                                    href={route('register')}
                                    className="mt-8 inline-block rounded-md bg-[#2546D8] px-6 py-3 font-medium text-white hover:bg-[#1C37AD]"
                                >
                                    Plan your first event
                                </Link>
                            )}
                        </section>


                        <section aria-label="Example budget split" className="pb-20">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
                                <p className="text-sm text-[#4A5468]">Example: a two-day tech festival for 800 people</p>
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
                                                {item.vital && <span className="ml-2 text-xs font-medium text-[#C23A1E]">Vital</span>}
                                            </p>
                                            <p className="text-sm text-[#4A5468] tabular-nums">
                                                {formatRupiah((exampleBudget * item.percentage) / 100)} ({item.percentage}%)
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>


                        <section className="border-t border-[#E3E7F0] py-16">
                            <h2 className="text-3xl font-bold tracking-tight" style={displayFont}>
                                How it works
                            </h2>
                            <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                                {steps.map((step, index) => (
                                    <li key={step.title}>
                                        <p className="text-4xl font-bold text-[#2546D8]" style={displayFont}>
                                            {index + 1}
                                        </p>
                                        <h3 className="mt-3 font-semibold">{step.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-[#4A5468]">{step.text}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </main>


                    <footer className="border-t border-[#E3E7F0] py-6 text-sm text-[#4A5468]">
                        Cloud Computing final project, Informatics, Universitas Ciputra
                    </footer>
                </div>
            </div>
        </>
    );
}

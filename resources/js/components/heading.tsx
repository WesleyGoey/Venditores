import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';

interface HeadingProps {
    title: string;
    /** Only when it says something the title does not. */
    description?: ReactNode;
    /** The page one level up, since the app has no breadcrumb bar. */
    back?: { href: string; label: string };
    /** Actions on the right of the title row. */
    children?: ReactNode;
}

/** The page's one h1, in the display face, with an optional way back and its actions. */
export default function Heading({ title, description, back, children }: HeadingProps) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-2">
                {back && (
                    <Link href={back.href} className="text-muted-foreground hover:text-foreground inline-flex min-h-8 items-center gap-1.5 text-sm">
                        <ArrowLeft className="size-3.5" />
                        {back.label}
                    </Link>
                )}
                <h1 className="font-display text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
                {description && <div className="text-muted-foreground max-w-prose text-sm">{description}</div>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}

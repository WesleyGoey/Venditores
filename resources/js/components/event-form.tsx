import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { xsrfToken } from '@/lib/xsrf';
import { useForm } from '@inertiajs/react';
import { FileText, LoaderCircle, Sparkles } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useState } from 'react';

type EventFormData = {
    name: string;
    event_date: string;
    location: string;
    total_budget: string;
    description: string;
    proposal: File | null;
    _method?: 'put';
};

interface EventFormProps {
    initialValues?: Partial<Omit<EventFormData, 'proposal'>>;
    currentProposalName?: string | null;
    submitUrl: string;
    submitLabel: string;
    isUpdate?: boolean;
}

export default function EventForm({ initialValues = {}, currentProposalName, submitUrl, submitLabel, isUpdate = false }: EventFormProps) {
    const { data, setData, post, processing, errors, progress } = useForm<EventFormData>({
        name: initialValues.name ?? '',
        event_date: initialValues.event_date ?? '',
        location: initialValues.location ?? '',
        total_budget: initialValues.total_budget ?? '',
        description: initialValues.description ?? '',
        proposal: null,
        ...(isUpdate ? { _method: 'put' as const } : {}),
    });

    const [reading, setReading] = useState(false);
    const [readResult, setReadResult] = useState<{ ok: boolean; text: string } | null>(null);

    // Picking a PDF on the create form reads it and fills in the empty fields.
    const chooseProposal = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('proposal', file);
        setReadResult(null);

        if (isUpdate || file === null) {
            return;
        }

        setReading(true);

        try {
            const body = new FormData();
            body.append('proposal', file);

            const response = await fetch(route('events.extract'), {
                method: 'POST',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrfToken() },
                body,
            });
            const found = await response.json().catch(() => ({}));

            if (!response.ok) {
                setReadResult({
                    ok: false,
                    text: found.errors?.proposal?.[0] ?? found.message ?? 'Could not read the proposal. Fill in the details yourself.',
                });

                return;
            }

            // Only fill what is still empty, so anything already typed stays.
            setData((current) => ({
                ...current,
                name: current.name || found.name || '',
                event_date: current.event_date || found.event_date || '',
                location: current.location || found.location || '',
                total_budget: current.total_budget || (found.total_budget ? String(found.total_budget) : ''),
                description: current.description || found.description || '',
            }));
            setReadResult({ ok: true, text: 'Details filled in from the proposal. Check them and edit if needed.' });
        } catch {
            setReadResult({ ok: false, text: 'Could not reach the server. Fill in the details yourself.' });
        } finally {
            setReading(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Files can only be sent with POST, so updates spoof the PUT method.
        post(submitUrl, { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="max-w-2xl space-y-6">
            <div className="glass grid gap-2 rounded-2xl p-4">
                <Label htmlFor="proposal" className="flex items-center gap-2">
                    <FileText className="size-4" />
                    Proposal PDF
                </Label>
                <Input id="proposal" type="file" accept="application/pdf" onChange={chooseProposal} disabled={reading} />
                <p className="text-muted-foreground text-xs">
                    {isUpdate
                        ? currentProposalName
                            ? `Current: ${currentProposalName}. A new file replaces it.`
                            : 'Optional. PDF, max 10 MB.'
                        : 'Upload it and the AI fills in the details below. You can edit them.'}
                </p>
                {reading && (
                    <p className="text-primary flex items-center gap-1.5 text-xs font-medium">
                        <LoaderCircle className="size-3.5 animate-spin" />
                        Reading the proposal…
                    </p>
                )}
                {readResult && (
                    <p className={readResult.ok ? 'text-primary flex items-center gap-1.5 text-xs font-medium' : 'text-destructive text-xs'}>
                        {readResult.ok && <Sparkles className="size-3.5" />}
                        {readResult.text}
                    </p>
                )}
                {progress && <progress value={progress.percentage} max="100" className="w-full" />}
                <InputError message={errors.proposal} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="name" required>
                    Event name
                </Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    placeholder="e.g. Nusantara Tech Fest 2027"
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="event_date" required>
                        Date
                    </Label>
                    <Input id="event_date" type="date" value={data.event_date} onChange={(e) => setData('event_date', e.target.value)} required />
                    <InputError message={errors.event_date} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="e.g. Surabaya" />
                    <InputError message={errors.location} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="total_budget" required>
                    Total budget (Rp)
                </Label>
                <Input
                    id="total_budget"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={data.total_budget}
                    onChange={(e) => setData('total_budget', e.target.value)}
                    required
                    placeholder="150000000"
                />
                {data.total_budget !== '' && <p className="text-muted-foreground text-xs">{formatRupiah(Number(data.total_budget))}</p>}
                <InputError message={errors.total_budget} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Short notes about the event"
                />
                <InputError message={errors.description} />
            </div>

            <Button disabled={processing || reading}>
                {(processing || reading) && <LoaderCircle className="size-4 animate-spin" />}
                {submitLabel}
            </Button>
        </form>
    );
}

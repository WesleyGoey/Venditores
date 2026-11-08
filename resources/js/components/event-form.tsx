import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';


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


    const submit: FormEventHandler = (e) => {
        e.preventDefault();


        // Files can only be sent with POST, so updates spoof the PUT method.
        post(submitUrl, { forceFormData: true });
    };


    return (
        <form onSubmit={submit} className="max-w-2xl space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="name">Event name</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    placeholder="e.g. Ciputra Tech Fest 2027"
                />
                <InputError message={errors.name} />
            </div>


            <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="event_date">Event date</Label>
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
                <Label htmlFor="total_budget">Total budget (Rupiah)</Label>
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
                    rows={4}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Short notes about the event for the committee and the AI analysis"
                />
                <InputError message={errors.description} />
            </div>


            <div className="grid gap-2">
                <Label htmlFor="proposal">Proposal PDF</Label>
                <Input id="proposal" type="file" accept="application/pdf" onChange={(e) => setData('proposal', e.target.files?.[0] ?? null)} />
                <p className="text-muted-foreground text-xs">
                    {currentProposalName ? `Current file: ${currentProposalName}. Uploading a new file replaces it.` : 'Optional. PDF up to 10 MB.'}
                </p>
                {progress && <progress value={progress.percentage} max="100" className="w-full" />}
                <InputError message={errors.proposal} />
            </div>


            <Button disabled={processing}>
                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {submitLabel}
            </Button>
        </form>
    );
}

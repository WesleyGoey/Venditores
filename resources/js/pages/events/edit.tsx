import EventForm from '@/components/event-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface EditEventProps {
    event: {
        id: number;
        name: string;
        event_date: string;
        location: string | null;
        total_budget: number;
        description: string | null;
        proposal_original_name: string | null;
    };
}

export default function EditEvent({ event }: EditEventProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: route('events.index') },
        { title: event.name, href: route('events.show', event.id) },
        { title: 'Edit', href: route('events.edit', event.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${event.name}`} />
            <div className="p-4">
                <Heading title="Edit event" description="Changing the budget keeps the current split. Analyze again to rebalance." />
                <EventForm
                    isUpdate
                    submitUrl={route('events.update', event.id)}
                    submitLabel="Save changes"
                    currentProposalName={event.proposal_original_name}
                    initialValues={{
                        name: event.name,
                        event_date: event.event_date,
                        location: event.location ?? '',
                        total_budget: String(event.total_budget),
                        description: event.description ?? '',
                    }}
                />
            </div>
        </AppLayout>
    );
}

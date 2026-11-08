import EventForm from '@/components/event-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Events', href: '/events' },
    { title: 'New event', href: '/events/create' },
];


export default function CreateEvent() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New event" />
            <div className="p-4">
                <Heading title="New event" description="Fill in the event basics and upload the proposal PDF so the AI can analyze it." />
                <EventForm submitUrl={route('events.store')} submitLabel="Create event" />
            </div>
        </AppLayout>
    );
}

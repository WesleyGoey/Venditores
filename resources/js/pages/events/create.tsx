import EventForm from '@/components/event-form';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';


export default function CreateEvent() {
    return (
        <AppLayout>
            <Head title="New event" />
            <Heading
                title="New event"
                back={{ href: route('events.index'), label: 'Events' }}
                description="Pick the proposal PDF first. Name, date, location, budget and description fill in from it, and you can change any of them."
            />
            <EventForm submitUrl={route('events.store')} submitLabel="Create event" />
        </AppLayout>
    );
}

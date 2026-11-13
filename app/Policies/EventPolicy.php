<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    /**
     * Determine whether the user can view the event.
     */
    public function view(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    /**
     * Determine whether the user can update the event and its vendor needs and quotes.
     */
    public function update(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    /**
     * Determine whether the user can delete the event.
     */
    public function delete(User $user, Event $event): Response
    {
        return $this->owns($user, $event);
    }

    /**
     * Other users' events are reported as missing so their existence is not revealed.
     */
    private function owns(User $user, Event $event): Response
    {
        return $event->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }
}

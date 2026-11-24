<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Quote;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use stdClass;
use Throwable;

/**
 * Tells open browsers that data changed, through Supabase Realtime Broadcast.
 *
 * Only a "changed" ping is sent, never data. The browser then reloads its page from Laravel,
 * which still decides what each user may see. Topics are signed with the app key so they
 * cannot be guessed from a user id.
 */
class RealtimeNotifier
{
    /**
     * @var array<string, true>
     */
    private array $pending = [];

    public function enabled(): bool
    {
        return (bool) config('services.supabase.realtime')
            && filled(config('services.supabase.url'))
            && filled(config('services.supabase.secret_key'))
            && filled(config('services.supabase.publishable_key'));
    }

    /**
     * What the browser needs to listen: the project URL, the publishable key (safe in a browser) and its topics.
     *
     * @return array{url: string, key: string, topics: list<string>}|null
     */
    public function connectionFor(?User $user): ?array
    {
        if ($user === null || ! $this->enabled()) {
            return null;
        }

        return [
            'url' => config('services.supabase.url'),
            'key' => config('services.supabase.publishable_key'),
            'topics' => $user->is_admin
                ? [$this->topic('vendors'), $this->topic('admins')]
                : [$this->topic("user.{$user->id}"), $this->topic('vendors')],
        ];
    }

    /**
     * A change to an event, vendor need or quote reaches the event's owner, and the admins see quotes.
     */
    public function changed(Event|VendorNeed|Quote $model): void
    {
        if (! $this->enabled()) {
            return;
        }

        $ownerId = match (true) {
            $model instanceof Event => $model->user_id,
            $model instanceof VendorNeed => Event::query()->whereKey($model->event_id)->value('user_id'),
            default => Event::query()->whereHas('vendorNeeds', fn ($needs) => $needs->whereKey($model->vendor_need_id))->value('user_id'),
        };

        if ($ownerId !== null) {
            $this->queue("user.{$ownerId}");
        }

        if ($model instanceof Quote) {
            $this->queue('admins');
        }
    }

    /**
     * A change to the recommended vendors or their reviews reaches everyone.
     */
    public function vendorsChanged(): void
    {
        $this->queue('vendors');
    }

    /**
     * One request can change many rows, so the pings are collected and sent once after the response.
     */
    private function queue(string $name): void
    {
        if (! $this->enabled()) {
            return;
        }

        if ($this->pending === []) {
            app()->terminating(fn () => $this->flush());
        }

        $this->pending[$this->topic($name)] = true;
    }

    public function flush(): void
    {
        $topics = array_keys($this->pending);
        $this->pending = [];

        if ($topics === []) {
            return;
        }

        try {
            Http::baseUrl(rtrim(config('services.supabase.url'), '/').'/realtime/v1/api/')
                ->withHeaders(['apikey' => config('services.supabase.secret_key')])
                ->timeout(5)
                ->post('broadcast', ['messages' => array_map(fn (string $topic): array => [
                    'topic' => $topic,
                    'event' => 'changed',
                    'payload' => new stdClass,
                    'private' => false,
                ], $topics)])
                ->throw();
        } catch (Throwable $exception) {
            // A missed ping only delays a refresh, it must never break the request that saved the data.
            Log::warning('Supabase Realtime broadcast failed: '.$exception->getMessage());
        }
    }

    private function topic(string $name): string
    {
        return 'rt-'.substr(hash_hmac('sha256', $name, (string) config('app.key')), 0, 32);
    }
}

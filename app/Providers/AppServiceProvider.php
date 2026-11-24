<?php

namespace App\Providers;

use App\Models\Event;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorNeed;
use App\Models\VendorReview;
use App\Services\RealtimeNotifier;
use App\Services\SupabaseAuth;
use App\Services\SupabaseUserProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(RealtimeNotifier::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('manage-vendors', fn (User $user): bool => $user->is_admin);

        Auth::provider('supabase', fn (Application $app, array $config): SupabaseUserProvider => new SupabaseUserProvider(
            $app['hash'],
            $config['model'],
            $app->make(SupabaseAuth::class),
        ));

        $this->configureAiRateLimits();
        $this->configureRealtime();
    }

    /**
     * Ping open browsers when data they show was saved or deleted.
     */
    private function configureRealtime(): void
    {
        foreach ([Event::class, VendorNeed::class, Quote::class] as $model) {
            $model::saved(fn (Model $changed) => app(RealtimeNotifier::class)->changed($changed));
            $model::deleted(fn (Model $changed) => app(RealtimeNotifier::class)->changed($changed));
        }

        foreach ([RecommendedVendor::class, VendorReview::class] as $model) {
            $model::saved(fn () => app(RealtimeNotifier::class)->vendorsChanged());
            $model::deleted(fn () => app(RealtimeNotifier::class)->vendorsChanged());
        }
    }

    /**
     * Limit how often each user may call Gemini-backed features.
     */
    private function configureAiRateLimits(): void
    {
        $limits = [
            'ai-analysis' => 5,
            'ai-matching' => 10,
            'ai-vendor-search' => 10,
        ];

        foreach ($limits as $name => $perMinute) {
            RateLimiter::for($name, fn (Request $request): Limit => Limit::perMinute($perMinute)
                ->by($request->user()?->id ?: $request->ip())
                ->response(fn (Request $request) => $request->expectsJson()
                    ? response()->json(['message' => 'Too many AI requests. Please wait a minute and try again.'], 429)
                    : back()->with('error', 'Too many AI requests. Please wait a minute and try again.')));
        }
    }
}

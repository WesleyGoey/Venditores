<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureAiRateLimits();
    }

    /**
     * Limit how often each user may call Gemini-backed features.
     */
    private function configureAiRateLimits(): void
    {
        $limits = [
            'ai-analysis' => 5,
            'ai-matching' => 10,
            'ai-risk' => 5,
        ];

        foreach ($limits as $name => $perMinute) {
            RateLimiter::for($name, fn (Request $request): Limit => Limit::perMinute($perMinute)
                ->by($request->user()?->id ?: $request->ip())
                ->response(fn () => back()->with('error', 'Too many AI requests. Please wait a minute and try again.')));
        }
    }
}
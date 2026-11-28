<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admins and vendor accounts only deal with the vendor directory. Events, budgets and quotes belong to regular users.
 */
class RedirectAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->is_admin || $user?->is_vendor) {
            return redirect()->route('vendors.index');
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admins only manage vendors. Events, budgets and quotes belong to regular users.
 */
class RedirectAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->is_admin) {
            return redirect()->route('vendors.index');
        }

        return $next($request);
    }
}

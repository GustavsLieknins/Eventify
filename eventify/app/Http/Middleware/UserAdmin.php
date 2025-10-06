<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UserAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Not logged in → let 'auth' middleware handle it or fail safe here
        if (!$user) {
            // if you're guarding APIs with sanctum, you may prefer 401 here:
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->route('login');
        }

        // Require role === 1
        if ((int) $user->role !== 1) {
            // For APIs/axios, return JSON; for web/Inertia, abort 403
            return $request->expectsJson()
                ? response()->json(['message' => 'Forbidden. Admins only.'], 403)
                : abort(403, 'Forbidden');
        }

        return $next($request);
    }
}

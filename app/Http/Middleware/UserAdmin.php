<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

class UserAdmin
{
    public function handle(Request $request, \Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->route('login');
        }

        if (!in_array((int) ($user->role ?? 0), [1, 2], true)) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Forbidden. Admins only.'], 403)
                : abort(403, 'Forbidden');
        }

        return $next($request);
    }
}

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

        if ((int) $user->role !== 1) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Forbidden. Admins only.'], 403)
                : abort(403, 'Forbidden');
        }

        return $next($request);
    }
}

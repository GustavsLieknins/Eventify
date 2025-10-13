<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

class UserSuperAdmin
{
    public function handle(Request $request, \Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->route('login');
        }
        if ((int) $user->role !== 2) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Forbidden. SuperAdmins only.'], 403)
                : abort(403, 'Forbidden');
        }

        return $next($request);
    }
}

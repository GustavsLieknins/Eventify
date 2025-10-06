<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app'; // whatever your root view is (default from Breeze is 'app')

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => (int) ($user->role ?? 0),
                ] : null,
            ],
            // optional flash helpers
            'flash' => [
                'success' => fn () => session('success'),
                'error'   => fn () => session('error'),
            ],
        ]);
    }
}

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // add Inertia middleware to web group
        $middleware->appendToGroup('web', [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // your admin alias from earlier
        $middleware->alias([
            'admin' => \App\Http\Middleware\UserAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // empty is fine
    })
    ->create();

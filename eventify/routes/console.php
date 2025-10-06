<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Models\CachedSearch;
use Carbon\CarbonImmutable;

Artisan::command('eventify:prune-cache {--keep=5000 : Keep at most N newest fresh rows}', function () {
    $keep = (int) $this->option('keep');
    $now = CarbonImmutable::now();

    $expired = CachedSearch::whereNotNull('expires_at')
        ->where('expires_at', '<=', $now)
        ->delete();

    $errors = CachedSearch::where('status', 'error')
        ->whereNull('payload_json')
        ->delete();

    $total = CachedSearch::count();
    $excess = max(0, $total - $keep);
    if ($excess > 0) {
        CachedSearch::orderBy('updated_at')->limit($excess)->delete();
    }

    $this->info("Expired deleted: {$expired}; empty errors deleted: {$errors}; trimmed: {$excess}");
})->purpose('Delete expired/error cache rows and trim cache size');

Schedule::command('eventify:prune-cache --keep=5000')
    ->dailyAt('03:30')
    ->onOneServer()
    ->withoutOverlapping();

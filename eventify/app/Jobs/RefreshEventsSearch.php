<?php

namespace App\Jobs;

use App\Models\CachedSearch;
use App\Services\HasDataClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RefreshEventsSearch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $params;
    public string $keyHash;
    public ?int $softMinutes;
    public ?int $hardMinutes;


    public function __construct(array $params, string $keyHash, ?int $softMinutes = null, ?int $hardMinutes = null)
    {
        $this->params = $params;
        $this->keyHash = $keyHash;
        $this->softMinutes = $softMinutes;
        $this->hardMinutes = $hardMinutes;
        $this->onQueue(config('queue.connections.database.queue', 'default'));
    }

   public function handle(HasDataClient $hasData): void
    {
        $payload = $hasData->events($this->params);

        $cache = CachedSearch::firstOrNew(['key_hash' => $this->keyHash]);
        $cache->params_json = $this->params;

        $list = $payload['eventsResults'] ?? $payload['results'] ?? $payload['items'] ?? [];
        $hasDataNow = is_array($list) && count($list) > 0;

        if ($hasDataNow) {
            $cache->payload_json = json_encode($payload);
            $cache->status = 'fresh';
            $cache->markFresh($this->softMinutes ?? 10, $this->hardMinutes ?? 1440);
        } else {
            $cache->status = $cache->exists && $cache->payload_json ? 'stale' : 'error';
        }

        $cache->save();
    }


    public function failed(\Throwable $e): void
    {
        $cache = CachedSearch::firstOrNew(['key_hash' => $this->keyHash]);
        $cache->params_json = $this->params;
        $cache->status = $cache->exists && $cache->payload_json ? 'stale' : 'error';
        $cache->error_text = $e->getMessage();
        $cache->save();
    }
}

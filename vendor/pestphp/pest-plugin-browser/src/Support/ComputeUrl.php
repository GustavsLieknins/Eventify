<?php

declare(strict_types=1);

namespace Pest\Browser\Support;

use Pest\Browser\ServerManager;

/**
 * @internal
 */
final readonly class ComputeUrl
{
    /**
     * Computes the URL based on the given string.
     */
    public static function from(string $url): string
    {
        return match (true) {
            str_starts_with($url, 'http://') || str_starts_with($url, 'https://') => $url,
            ! str_starts_with($url, '/') => 'https://'.$url,
            default => ServerManager::instance()->http()->rewrite($url),
        };
    }
}

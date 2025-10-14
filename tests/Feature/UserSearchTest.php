<?php

test('lietotājs var atrast koncertu', function () {
    $page = visit('/dashboard');

    $page->type('SearchQuery', 'Korn');
    $page->click('Search');

    $page->assertPresent('.event-title');
});

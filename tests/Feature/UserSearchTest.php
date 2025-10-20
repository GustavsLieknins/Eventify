<?php

test('lietotājs var atrast koncertu', function () {
    $page = visit('/dashboard');

    $page->type('SearchQuery', 'Korn');
    $page->click('Search');

    $page->assertPresent('.event-title');
});

test('lietotājs nevar atstāt tukšu meklēšanas joslu, meklēšanas laikā', function () {
    $page = visit('/dashboard');

    $page->type('SearchQuery', '');
    $page->click('Search');

    $page->assertNotPresent('.event-title');
});

test('lietotājs var atrast koncertu, izmantojot piedāvātos variantus', function () {
    $page = visit('/dashboard');

    $page->click('Korn');

    $page->assertPresent('.event-title');
});

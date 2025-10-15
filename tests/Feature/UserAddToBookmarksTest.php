<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('lietotājs var pievienot atrastu koncertu grāmatzīmēm', function () {
    // Lietotājs
    User::updateOrCreate(
        ['email' => 'user@user.com'],
        [
            'name' => 'Regular User',
            'email_verified_at' => now(),
            'password' => Hash::make('user123'),
            'role' => 0,
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    // Ieeja
    $page = visit('/login');
    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');
    $page->click('submit');

    // Meklējam koncertu
    $page->type('SearchQuery', 'Korn');
    $page->click('Search');

    // Atveram ceļojuma skatu
    $page->click('View travel');
    $page->wait(1); // īsa pauze, lai viesnīcas ielādējas

    // Paņemam pirmā radio value ar JS (bez 'return' top-level!)
    $firstValue = $page->script(
        '(function(){var el=document.querySelector("input[type=\'radio\'][name=\'hotels-select\']"); return el ? el.value : null;})()'
    );

    // Ja script() atgriež masīvu, paņemam 1. elementu
    if (is_array($firstValue)) {
        $firstValue = $firstValue[0] ?? null;
    }

    // Pārliecināmies, ka atrasts value
    expect($firstValue)->not->toBeNull();

    // Atzīmējam pirmo viesnīcu ar Pest radio API
    $page->radio('hotels-select', (string) $firstValue);

    // Apstiprinām izvēli
    $page->assertRadioSelected('hotels-select', (string) $firstValue);

    // Pievienojam grāmatzīmēm
    $page->click('Bookmark this trip');

    // Pārbaude
    // $page->assertPathIs('/bookmarks');
});

<?php

use App\Models\User;

test('lietotājs var pieslēgties', function () {
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

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertPathIs('/bookmarks');
});

test('lietotājs var atrast koncertu', function () {
    $page = visit('/dashboard');

    $page->type('SearchQuery', 'Korn');
    $page->click('Search');

    $page->assertPresent('.event-title');
});

test('lietotājs var pievienot atrastu koncertu grāmatzīmēm ', function () {
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

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page->type('SearchQuery', 'Korn');
    $page->click('Search');

    $page->click('View travel');
    $page->wait(2);

    $page->press('hotels-select');
    $page->assertPathIs('/bookmarks');
});

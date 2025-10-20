<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

test('lietotājs nevar pieslēgties ar nepareizu paroli', function () {
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
    $page->type('password', 'user1234');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertPathIs('/login');
});

test('lietotājs var izrakstīties no sistēmas', function () {
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

    $page->click('Logout');
    $page->assertPathIs('/dashboard');
});

test('aizsargātie skati nav pieejami neautentificējušam lietotājam', function () {
    $page = visit('/bookmarks');

    $page->assertPathIs('/login');
});

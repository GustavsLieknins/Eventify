<?php

use App\Models\BookmarkedTrip;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('lietotājs var apskatīt savu grāmatzīmju sarakstu', function () {
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

    BookmarkedTrip::updateOrCreate(
        ['user_id' => 1],
        [
            'user_id' => 1,
            'title' => 'My Trip',
            'fligths' => [],
            'hotels' => [],
        ]
    );

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertPathIs('/bookmarks');
});

test('lietotājs var dalīties ar grāmatzīmes pievienotu pasākumu', function () {
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

    BookmarkedTrip::updateOrCreate(
        ['user_id' => 1],
        [
            'user_id' => 1,
            'title' => 'My Trip',
            'fligths' => [],
            'hotels' => [],
        ]
    );

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertSee('Share link');
});

test('lietotājs var dzēst grāmatzīmes pievienotu pasākumu', function () {
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

    BookmarkedTrip::updateOrCreate(
        ['user_id' => 1],
        [
            'user_id' => 1,
            'title' => 'My Trip',
            'fligths' => [],
            'hotels' => [],
        ]
    );

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertSee('Delete');
});

test('lietotājs var apskatīt grāmatzīmes pievienota pasākuma detaļas', function () {
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

    BookmarkedTrip::updateOrCreate(
        ['user_id' => 1],
        [
            'user_id' => 1,
            'title' => 'My Trip',
            'fligths' => [],
            'hotels' => [],
        ]
    );

    $page = visit('/login');

    $page->type('email', 'user@user.com');
    $page->type('password', 'user123');

    $page->click('submit');

    $page = visit('/bookmarks');

    $page->assertSee('View');
});

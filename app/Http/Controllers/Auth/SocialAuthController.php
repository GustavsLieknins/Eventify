<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirect(string $provider)
    {
        // Ask only for basic profile + email
        $driver = Socialite::driver($provider);

        if ($provider === 'google') {
            $driver = $driver->scopes(['openid', 'profile', 'email']);
        }

        return $driver->redirect();
    }

    public function callback(string $provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $e) {
            // Optional: flash a message / log
            return redirect()->route('login')->with('status', 'Login canceled or failed.');
        }

        // Normalize fields
        $email = $socialUser->getEmail();
        $name  = $socialUser->getName() ?: $socialUser->getNickname() ?: 'User';
        $avatar = $socialUser->getAvatar();

        // GitHub may return null email if hidden — fabricate a stable placeholder
        if (!$email) {
            $email = sprintf('%s@%s.local', $socialUser->getId(), $provider);
        }

        // Find existing user by email or create
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                // random password so the row is valid even if user never sets a local password
                'password' => bcrypt(Str::random(32)),
            ]);
        }

        // (Optional) store provider info if you want; add columns first if needed.
        // $user->update([
        //     'provider' => $provider,
        //     'provider_id' => $socialUser->getId(),
        //     'avatar' => $avatar,
        // ]);

        Auth::login($user, remember: true);

        return redirect()->intended('/dashboard'); // or your home route
    }
}

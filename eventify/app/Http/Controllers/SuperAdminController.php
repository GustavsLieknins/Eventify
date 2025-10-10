<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SuperAdminController extends Controller
{
    public function index(Request $request)
    {
        $users = User::orderBy('role', 'desc')->orderBy('name')->get();
        $superCount = User::where('role', 2)->count();
        $me = $request->user();

        return Inertia::render('SuperAdmin/Index', [
            'users' => $users,
            'superCount' => $superCount,
            'meId' => $me?->id,
        ]);
    }

    public function promote(User $user, Request $request)
    {
        if ((int) $user->role >= 1) {
            return back()->with('error', "{$user->name} already has admin privileges.");
        }
        $user->update(['role' => 1]);

        return back()->with('success', "{$user->name} is now an Admin.");
    }

    public function demote(User $user, Request $request)
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'You cannot change your own role here.');
        }
        if ((int) $user->role <= 0) {
            return back()->with('error', "{$user->name} is already a User.");
        }
        if ((int) $user->role === 2) {
            $superCount = User::where('role', 2)->count();
            if ($superCount <= 1) {
                return back()->with('error', 'Cannot demote the last SuperAdmin.');
            }
        }
        $user->update(['role' => 0]);

        return back()->with('success', "{$user->name} is now a User.");
    }

    public function makeSuper(User $user)
    {
        if ((int) $user->role === 2) {
            return back()->with('error', "{$user->name} is already a SuperAdmin.");
        }
        $user->update(['role' => 2]);

        return back()->with('success', "{$user->name} is now a SuperAdmin.");
    }

    public function removeSuper(User $user, Request $request)
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', 'You cannot remove your own SuperAdmin role.');
        }
        if ((int) $user->role !== 2) {
            return back()->with('error', "{$user->name} is not a SuperAdmin.");
        }
        $superCount = User::where('role', 2)->count();
        if ($superCount <= 1) {
            return back()->with('error', 'Cannot remove the last SuperAdmin.');
        }
        $user->update(['role' => 1]);

        return back()->with('success', "{$user->name} is no longer a SuperAdmin.");
    }
}

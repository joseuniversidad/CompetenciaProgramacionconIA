<?php

use App\Http\Controllers\SolarController as Solar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('solar'));
Route::get('/login', fn () => view('login'))->name('login');
Route::post('/login', function (Request $r) {
    $credentials = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
    if (! Auth::attempt($credentials)) {
        return back()->withErrors(['email' => 'Credenciales incorrectas.'])->onlyInput('email');
    }$r->session()->regenerate();

    return redirect('/');
})->middleware('throttle:6,1');
Route::post('/logout', function (Request $r) {
    Auth::logout();
    $r->session()->invalidate();
    $r->session()->regenerateToken();

    return redirect('/');
});
Route::middleware('auth')->prefix('manage')->group(function () {
    Route::post('/farms', [Solar::class, 'saveFarm']);
    Route::put('/farms/{farm}', [Solar::class, 'saveFarm']);
    Route::delete('/farms/{farm}', [Solar::class, 'deactivate']);
    Route::post('/panels', [Solar::class, 'savePanel']);
    Route::put('/panels/{panel}', [Solar::class, 'savePanel']);
    Route::post('/generations', [Solar::class, 'saveGeneration']);
    Route::put('/generations/{generation}', [Solar::class, 'saveGeneration']);
});

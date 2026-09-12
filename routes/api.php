<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SolarController as Solar;
Route::middleware('throttle:120,1')->group(function(){
 Route::get('/departments',[Solar::class,'departments']);Route::get('/farms',[Solar::class,'farms']);Route::get('/farms/{farm}',[Solar::class,'farm']);Route::get('/panels',[Solar::class,'panels']);Route::get('/generations',[Solar::class,'generations']);Route::get('/statistics',[Solar::class,'statistics']);Route::get('/alerts',[Solar::class,'alerts']);Route::get('/farms/{farm}/forecast',[Solar::class,'forecast']);Route::get('/reports/departments.csv',[Solar::class,'csv']);
});

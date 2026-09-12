<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Farm;
use App\Models\Generation;
use App\Models\Panel;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (json_decode(file_get_contents(__DIR__.'/departments.json'), true) as $d) {
            Department::firstOrCreate(['name' => $d[0]], ['latitude' => $d[1], 'longitude' => $d[2]]);
        }
        if (env('ADMIN_EMAIL') && env('ADMIN_PASSWORD')) {
            User::firstOrCreate(['email' => env('ADMIN_EMAIL')], ['name' => 'Administrador Solar GT', 'password' => Hash::make(env('ADMIN_PASSWORD'))]);
        }
        if (! filter_var(env('SEED_DEMO', false), FILTER_VALIDATE_BOOL) || Farm::exists()) {
            return;
        }
        $p1 = Panel::create(['brand' => 'Modelo demostrativo', 'model' => 'Monocristalino 550', 'power_kw' => 0.55, 'status' => 'activo']);
        $p2 = Panel::create(['brand' => 'Modelo demostrativo', 'model' => 'Bifacial 600', 'power_kw' => 0.6, 'status' => 'activo']);
        foreach (Department::all() as $i => $d) {
            $farm = Farm::create(['department_id' => $d->id, 'name' => 'Solar '.$d->name, 'latitude' => $d->latitude, 'longitude' => $d->longitude, 'families' => 120 + $i * 31, 'active' => true]);
            $farm->panels()->attach($p1->id, ['quantity' => 400 + $i * 80]);
            $farm->panels()->attach($p2->id, ['quantity' => 100 + $i * 10]);
            for ($m = 1; $m <= 8; $m++) {
                $expected = round($farm->capacity_kw * (115 + [0, 4, 12, 8, -4, -9, -6, 1][$m - 1]), 2);
                $ratio = ($m === 8 && $i % 5 === 0) ? 0.68 : 0.88 + (($i + $m) % 9) * 0.02;
                Generation::create(['farm_id' => $farm->id, 'period' => sprintf('2026-%02d-01', $m), 'expected_kwh' => $expected, 'actual_kwh' => round($expected * $ratio, 2)]);
            }
        }
    }
}

<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Farm;
use App\Models\Generation;
use App\Models\Panel;
use App\Models\User;
use App\Services\SolarAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SolarTest extends TestCase
{
    use RefreshDatabase;

    private function farm(): Farm
    {
        $d = Department::create(['name' => 'Guatemala', 'latitude' => 14.63, 'longitude' => -90.5]);

        return Farm::create(['department_id' => $d->id, 'name' => 'Prueba', 'latitude' => 14.63, 'longitude' => -90.5, 'families' => 25, 'active' => true]);
    }

    public function test_capacity_uses_panel_quantity_and_power(): void
    {
        $f = $this->farm();
        $p = Panel::create(['brand' => 'Test', 'model' => '550', 'power_kw' => .55, 'status' => 'activo']);
        $f->panels()->attach($p, ['quantity' => 100]);
        $this->assertEquals(55, $f->fresh()->capacity_kw);
        $this->assertEquals(100, $f->fresh()->panel_count);
    }

    public function test_alert_boundary_and_correction(): void
    {
        $f = $this->farm();
        $g = Generation::create(['farm_id' => $f->id, 'period' => '2026-01-01', 'actual_kwh' => 80, 'expected_kwh' => 100]);
        $this->assertTrue($g->is_alert);
        $this->assertEquals(32, $g->co2_kg);
        $this->assertDatabaseHas('alerts', ['generation_id' => $g->id]);
        $g->update(['actual_kwh' => 80.01]);
        $this->assertFalse($g->is_alert);
        $this->assertDatabaseMissing('alerts', ['generation_id' => $g->id]);
        $g->update(['expected_kwh' => 0]);
        $this->assertNull($g->deviation_percent);
        $this->assertFalse($g->is_alert);
    }

    public function test_forecast_uses_only_prior_months(): void
    {
        $f = $this->farm();
        foreach ([100, 200, 300, 900] as $i => $v) {
            Generation::create(['farm_id' => $f->id, 'period' => sprintf('2026-%02d-01', $i + 1), 'actual_kwh' => $v, 'expected_kwh' => 1000]);
        }$s = (new SolarAnalytics)->forecast($f);
        $this->assertEquals(466.67, $s['projected_kwh']);
        $this->assertEquals(200, $s['backtest'][0]['projected_kwh']);
        $this->assertEquals(700, $s['mae_kwh']);
        $this->assertEquals('2026-05', $s['period']);
    }

    public function test_forecast_refuses_gaps_or_insufficient_history(): void
    {
        $f = $this->farm();
        foreach (['2026-01-01', '2026-03-01', '2026-04-01'] as $p) {
            Generation::create(['farm_id' => $f->id, 'period' => $p, 'actual_kwh' => 100, 'expected_kwh' => 100]);
        }$this->assertNull((new SolarAnalytics)->forecast($f)['projected_kwh']);
    }

    public function test_writes_require_auth_and_validate_duplicates(): void
    {
        $f = $this->farm();
        $data = ['farm_id' => $f->id, 'period' => '2026-01', 'actual_kwh' => 80, 'expected_kwh' => 100];
        $this->postJson('/manage/generations', $data)->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->postJson('/manage/generations', $data)->assertCreated();
        $this->postJson('/manage/generations', $data)->assertUnprocessable()->assertJsonValidationErrors('period');
        $data['actual_kwh'] = -1;
        $this->postJson('/manage/generations', $data)->assertUnprocessable();
    }

    public function test_department_filter_and_co2_totals(): void
    {
        $f = $this->farm();
        Generation::create(['farm_id' => $f->id, 'period' => '2026-01-01', 'actual_kwh' => 100, 'expected_kwh' => 100]);
        $this->getJson('/api/statistics?department_id='.$f->department_id.'&period=2026-01')->assertOk()->assertJsonPath('totals.co2_kg', 40)->assertJsonPath('totals.families', 25);
        $this->getJson('/api/statistics?period=invalid')->assertUnprocessable();
        $this->getJson('/api/farms/99999')->assertNotFound();
    }

    public function test_farm_creation_relations_and_deactivation(): void
    {
        $f = $this->farm();
        $this->actingAs(User::factory()->create());
        $this->postJson('/manage/farms', ['name' => 'New', 'department_id' => $f->department_id, 'latitude' => 99, 'longitude' => -90, 'families' => 2, 'active' => true, 'panels' => []])->assertUnprocessable();
        $this->deleteJson('/manage/farms/'.$f->id)->assertOk();
        $this->assertFalse($f->fresh()->active);
        $this->postJson('/manage/generations', ['farm_id' => $f->id, 'period' => '2026-01', 'actual_kwh' => 10, 'expected_kwh' => 10])->assertUnprocessable();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Farm;
use App\Models\Generation;
use App\Models\Panel;
use App\Services\SolarAnalytics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SolarController extends Controller
{
    public function departments()
    {
        return Department::orderBy('name')->get();
    }

    public function farms(Request $r)
    {
        $r->validate(['department_id' => 'nullable|exists:departments,id']);

        return Farm::with(['department', 'panels'])->when($r->department_id, fn ($q) => $q->where('department_id', $r->department_id))->orderBy('name')->get();
    }

    public function farm(Farm $farm)
    {
        return $farm->load(['department', 'panels', 'generations']);
    }

    public function panels()
    {
        return Panel::orderBy('brand')->get();
    }

    public function savePanel(Request $r, ?Panel $panel = null)
    {
        $data = $r->validate(['brand' => 'required|string|max:100', 'model' => 'required|string|max:100', 'power_kw' => 'required|numeric|decimal:0,3|min:0.001|max:10', 'status' => ['required', Rule::in(['activo', 'inactivo'])]]);
        $panel ??= new Panel;
        $panel->fill($data)->save();

        return response()->json($panel, $panel->wasRecentlyCreated ? 201 : 200);
    }

    public function saveFarm(Request $r, ?Farm $farm = null)
    {
        $data = $r->validate(['name' => 'required|string|max:150', 'department_id' => 'required|exists:departments,id', 'latitude' => 'required|numeric|between:13.5,17.9', 'longitude' => 'required|numeric|between:-92.3,-88.0', 'families' => 'required|integer|min:0|max:10000000', 'active' => 'required|boolean', 'panels' => 'present|array', 'panels.*.panel_id' => 'required|distinct|exists:panels,id', 'panels.*.quantity' => 'required|integer|min:1|max:10000000']);
        $farm ??= new Farm;
        DB::transaction(function () use ($farm, $data) {
            $panels = $data['panels'];
            unset($data['panels']);
            $farm->fill($data)->save();
            $farm->panels()->sync(collect($panels)->mapWithKeys(fn ($p) => [$p['panel_id'] => ['quantity' => $p['quantity']]])->all());
        });

        return response()->json($farm->fresh()->load(['department', 'panels']), $farm->wasRecentlyCreated ? 201 : 200);
    }

    public function deactivate(Farm $farm)
    {
        $farm->update(['active' => false]);

        return $farm;
    }

    public function generations(Request $r)
    {
        $r->validate(['farm_id' => 'nullable|exists:farms,id', 'period' => 'nullable|date_format:Y-m']);

        return Generation::with('farm.department')->when($r->farm_id, fn ($q) => $q->where('farm_id', $r->farm_id))->when($r->period, fn ($q) => $q->where('period', $r->period.'-01'))->orderByDesc('period')->get();
    }

    public function saveGeneration(Request $r, ?Generation $generation = null)
    {
        $data = $r->validate(['farm_id' => ['required', Rule::exists('farms', 'id')->where('active', true)], 'period' => 'required|date_format:Y-m|before_or_equal:'.now()->format('Y-m'), 'actual_kwh' => 'required|numeric|decimal:0,2|min:0|max:999999999', 'expected_kwh' => 'required|numeric|decimal:0,2|min:0|max:999999999']);
        $data['period'] .= '-01';
        $duplicate = Generation::where('farm_id', $data['farm_id'])->where('period', $data['period'])->when($generation, fn ($q) => $q->where('id', '!=', $generation->id))->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['period' => 'Ya existe un registro para esta granja y mes. Edite el registro existente.']);
        }$generation ??= new Generation;
        DB::transaction(fn () => $generation->fill($data)->save());

        return response()->json($generation, $generation->wasRecentlyCreated ? 201 : 200);
    }

    public function statistics(Request $r, SolarAnalytics $s)
    {
        $r->validate(['department_id' => 'nullable|exists:departments,id', 'period' => 'nullable|date_format:Y-m']);

        return $s->summary($r->department_id, $r->period);
    }

    public function alerts(Request $r)
    {
        return $this->generations($r)->filter->is_alert->values();
    }

    public function forecast(Farm $farm, SolarAnalytics $s)
    {
        return $s->forecast($farm);
    }

    public function csv(Request $r, SolarAnalytics $s)
    {
        $r->validate(['department_id' => 'nullable|exists:departments,id', 'period' => 'nullable|date_format:Y-m']);
        $rows = $s->summary($r->department_id, $r->period)['departments'];

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Departamento', 'Granjas', 'Paneles', 'Capacidad kW', 'Generacion kWh', 'Esperada kWh', 'Familias', 'CO2 kg'], ',', '"', '');
            foreach ($rows as $d) {
                fputcsv($out, [$d['name'], $d['farms'], $d['panels'], $d['capacity_kw'], $d['actual_kwh'], $d['expected_kwh'], $d['families'], $d['co2_kg']], ',', '"', '');
            }fclose($out);
        }, 'solar-gt-departamentos.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}

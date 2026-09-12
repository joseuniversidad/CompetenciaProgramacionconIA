<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Farm;
use App\Models\Generation;
use Carbon\Carbon;

class SolarAnalytics
{
    public function summary(?int $departmentId = null, ?string $period = null): array
    {
        $farms = Farm::with(['department', 'panels'])->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))->get();
        $generations = Generation::whereIn('farm_id', $farms->pluck('id'))->when($period, fn ($q) => $q->where('period', $period.'-01'))->get();
        $departments = Department::when($departmentId, fn ($q) => $q->whereKey($departmentId))->get()->map(function ($d) use ($farms, $generations) {
            $f = $farms->where('department_id', $d->id);
            $g = $generations->whereIn('farm_id', $f->pluck('id'));

            return ['id' => $d->id, 'name' => $d->name, 'farms' => $f->count(), 'active_farms' => $f->where('active', true)->count(), 'panels' => $f->sum('panel_count'), 'capacity_kw' => round($f->sum('capacity_kw'), 3), 'families' => $f->sum('families'), 'actual_kwh' => round($g->sum('actual_kwh'), 2), 'expected_kwh' => round($g->sum('expected_kwh'), 2), 'co2_kg' => round($g->sum('actual_kwh') * 0.4, 2)];
        })->sortByDesc('actual_kwh')->values();

        return ['totals' => ['farms' => $farms->count(), 'active_farms' => $farms->where('active', true)->count(), 'panels' => $farms->sum('panel_count'), 'capacity_kw' => round($farms->sum('capacity_kw'), 3), 'families' => $farms->sum('families'), 'actual_kwh' => round($generations->sum('actual_kwh'), 2), 'expected_kwh' => round($generations->sum('expected_kwh'), 2), 'co2_kg' => round($generations->sum('actual_kwh') * 0.4, 2), 'co2_tonnes' => round($generations->sum('actual_kwh') * 0.0004, 3), 'alerts' => $generations->filter->is_alert->count()], 'departments' => $departments, 'monthly' => $generations->groupBy('period')->sortKeys()->map(fn ($g, $p) => ['period' => substr($p, 0, 7), 'actual_kwh' => round($g->sum('actual_kwh'), 2), 'expected_kwh' => round($g->sum('expected_kwh'), 2)])->values()];
    }

    public function forecast(Farm $farm): array
    {
        $history = $farm->generations()->orderBy('period')->get();
        $backtest = [];
        foreach ($history as $i => $g) {
            if ($i < 3) {
                continue;
            }$previous = $history->slice($i - 3, 3)->values();
            if (Carbon::parse($previous[0]->period)->addMonths(3)->toDateString() !== $g->period) {
                continue;
            }$prediction = round($previous->avg('actual_kwh'), 2);
            $backtest[] = ['period' => substr($g->period, 0, 7), 'projected_kwh' => $prediction, 'actual_kwh' => $g->actual_kwh, 'absolute_error' => round(abs($prediction - $g->actual_kwh), 2)];
        }
        $tail = $history->take(-3)->values();
        $complete = $tail->count() === 3 && Carbon::parse($tail[0]->period)->addMonths(2)->toDateString() === $tail[2]->period;

        return ['farm_id' => $farm->id, 'method' => 'Promedio móvil de 3 meses consecutivos', 'status' => $complete ? 'ok' : 'insufficient_history', 'projected_kwh' => $complete ? round($tail->avg('actual_kwh'), 2) : null, 'period' => $history->isNotEmpty() ? Carbon::parse($history->last()->period)->addMonth()->format('Y-m') : null, 'sample_size' => $tail->count(), 'mae_kwh' => count($backtest) ? round(collect($backtest)->avg('absolute_error'), 2) : null, 'backtest' => $backtest, 'history' => $history, 'limitations' => 'No incorpora clima ni estacionalidad. Requiere tres meses consecutivos; el error histórico no garantiza resultados futuros.'];
    }
}

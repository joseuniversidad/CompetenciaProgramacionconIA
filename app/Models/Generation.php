<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Generation extends Model
{
    protected $guarded = [];

    protected $casts = ['actual_kwh' => 'float', 'expected_kwh' => 'float'];

    protected $appends = ['co2_kg', 'deviation_percent', 'is_alert'];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function getCo2KgAttribute()
    {
        return round($this->actual_kwh * 0.40, 2);
    }

    public function getDeviationPercentAttribute()
    {
        return $this->expected_kwh > 0 ? round((1 - $this->actual_kwh / $this->expected_kwh) * 100, 2) : null;
    }

    public function getIsAlertAttribute()
    {
        return $this->expected_kwh > 0 && $this->actual_kwh <= $this->expected_kwh * 0.8;
    }

    protected static function booted()
    {
        static::saved(function ($g) {
            if ($g->is_alert) {
                DB::table('alerts')->updateOrInsert(['generation_id' => $g->id], ['deviation_percent' => $g->deviation_percent, 'created_at' => now(), 'updated_at' => now()]);
            } else {
                DB::table('alerts')->where('generation_id', $g->id)->delete();
            }
        });
    }
}

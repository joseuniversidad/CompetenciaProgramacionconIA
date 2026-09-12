<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Farm extends Model
{
    protected $guarded = [];

    protected $casts = ['active' => 'boolean', 'latitude' => 'float', 'longitude' => 'float', 'families' => 'integer'];

    protected $appends = ['capacity_kw', 'panel_count'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function panels()
    {
        return $this->belongsToMany(Panel::class)->withPivot('quantity');
    }

    public function generations()
    {
        return $this->hasMany(Generation::class);
    }

    public function getCapacityKwAttribute()
    {
        return round($this->panels->sum(fn ($p) => $p->power_kw * $p->pivot->quantity), 3);
    }

    public function getPanelCountAttribute()
    {
        return $this->panels->sum('pivot.quantity');
    }
}

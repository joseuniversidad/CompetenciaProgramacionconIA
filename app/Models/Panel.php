<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Panel extends Model {protected $guarded=[]; protected $casts=['power_kw'=>'float'];}

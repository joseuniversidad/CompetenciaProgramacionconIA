<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('departments', function(Blueprint $t){$t->id();$t->string('name')->unique();$t->decimal('latitude',10,7);$t->decimal('longitude',10,7);});
  Schema::create('panels', function(Blueprint $t){$t->id();$t->string('brand');$t->string('model');$t->decimal('power_kw',10,3);$t->string('status')->default('activo');$t->timestamps();});
  Schema::create('farms',function(Blueprint $t){$t->id();$t->foreignId('department_id')->constrained();$t->string('name');$t->decimal('latitude',10,7);$t->decimal('longitude',10,7);$t->unsignedInteger('families');$t->boolean('active')->default(true);$t->timestamps();});
  Schema::create('farm_panel',function(Blueprint $t){$t->id();$t->foreignId('farm_id')->constrained()->cascadeOnDelete();$t->foreignId('panel_id')->constrained();$t->unsignedInteger('quantity');$t->unique(['farm_id','panel_id']);});
  Schema::create('generations',function(Blueprint $t){$t->id();$t->foreignId('farm_id')->constrained();$t->date('period');$t->decimal('actual_kwh',14,2);$t->decimal('expected_kwh',14,2);$t->timestamps();$t->unique(['farm_id','period']);});
  Schema::create('alerts',function(Blueprint $t){$t->id();$t->foreignId('generation_id')->unique()->constrained()->cascadeOnDelete();$t->decimal('deviation_percent',8,2);$t->timestamps();});
 }
 public function down(): void {foreach(['alerts','generations','farm_panel','farms','panels','departments'] as $table) Schema::dropIfExists($table);}
};

<?php

return [
    'required' => 'El campo :attribute es obligatorio.',
    'present' => 'Debe incluir el campo :attribute.',
    'string' => 'El campo :attribute debe ser texto.',
    'numeric' => 'El campo :attribute debe ser numérico.',
    'integer' => 'El campo :attribute debe ser un número entero.',
    'boolean' => 'El campo :attribute debe indicar verdadero o falso.',
    'array' => 'El campo :attribute debe ser una lista.',
    'email' => 'Ingrese un correo electrónico válido.',
    'exists' => 'La selección de :attribute no existe o no está activa.',
    'distinct' => 'No repita el mismo modelo de panel.',
    'in' => 'El valor de :attribute no está permitido.',
    'decimal' => 'El campo :attribute admite entre :min y :max decimales.',
    'date_format' => 'El campo :attribute debe tener formato :format.',
    'before_or_equal' => 'El campo :attribute debe ser anterior o igual a :date.',
    'min' => ['numeric' => 'El campo :attribute debe ser al menos :min.', 'string' => 'El campo :attribute debe tener al menos :min caracteres.'],
    'max' => ['numeric' => 'El campo :attribute no debe superar :max.', 'string' => 'El campo :attribute no debe superar :max caracteres.'],
    'between' => ['numeric' => 'El campo :attribute debe estar entre :min y :max.'],
    'attributes' => ['name' => 'nombre', 'department_id' => 'departamento', 'latitude' => 'latitud', 'longitude' => 'longitud', 'families' => 'familias', 'farm_id' => 'granja', 'period' => 'mes', 'actual_kwh' => 'generación real', 'expected_kwh' => 'generación esperada', 'power_kw' => 'potencia nominal', 'brand' => 'marca', 'model' => 'modelo', 'status' => 'estado', 'active' => 'estado activo', 'panels' => 'paneles'],
];

# Diagrama relacional

```mermaid
erDiagram
 departments ||--o{ farms : contiene
 farms ||--o{ farm_panel : instala
 panels ||--o{ farm_panel : modelo
 farms ||--o{ generations : registra
 generations ||--o| alerts : genera
 departments { bigint id PK
 string name UK
 decimal latitude
 decimal longitude }
 farms { bigint id PK
 bigint department_id FK
 string name
 decimal latitude
 decimal longitude
 int families
 boolean active }
 panels { bigint id PK
 string brand
 string model
 decimal power_kw
 string status }
 farm_panel { bigint id PK
 bigint farm_id FK
 bigint panel_id FK
 int quantity }
 generations { bigint id PK
 bigint farm_id FK
 date period
 decimal actual_kwh
 decimal expected_kwh }
 alerts { bigint id PK
 bigint generation_id FK
 decimal deviation_percent }
```

Restricciones únicas: departments.name; farm_panel(farm_id, panel_id); generations(farm_id, period); alerts.generation_id. Las tablas con escritura tienen timestamps, excepto la tabla pivote. users mantiene credenciales con hash. La capacidad, CO₂ y proyecciones se derivan, evitando duplicar valores que podrían desactualizarse.

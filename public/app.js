const $ = (s) => document.querySelector(s),
    esc = (v) =>
        String(v ?? "").replace(
            /[&<>"']/g,
            (c) =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                })[c],
        ),
    num = (v, d = 0) =>
        Number(v ?? 0).toLocaleString("es-GT", { maximumFractionDigits: d });
let page = "dashboard",
    departments = [],
    farms = [],
    panels = [],
    stats = {},
    charts = [],
    map = null,
    generations = [],
    loadId = 0;
const titles = {
    dashboard: [
        "Panorama solar nacional",
        "Generación, desempeño e impacto en un solo lugar.",
    ],
    map: [
        "Energía en el territorio",
        "Explora la ubicación y capacidad de cada granja solar.",
    ],
    farms: [
        "Granjas solares",
        "Administra instalaciones, ubicación y familias beneficiadas.",
    ],
    panels: ["Modelos de panel", "Catálogo de equipos y potencia nominal."],
    generation: [
        "Registro de generación",
        "Mediciones mensuales reales y esperadas en kWh.",
    ],
    alerts: [
        "Atención al desempeño",
        "Desviaciones de 20% o más respecto a la generación esperada.",
    ],
    forecast: [
        "La energía que viene",
        "Estimación mensual basada en el historial de cada granja.",
    ],
    reports: [
        "Comparativo departamental",
        "Inventario, generación e impacto de los 22 departamentos.",
    ],
    docs: [
        "API y metodología",
        "Reglas transparentes, datos consultables y decisiones explicables.",
    ],
};
async function api(path, options = {}) {
    const r = await fetch(path, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').content,
            ...options.headers,
        },
    });
    const data = await r
        .json()
        .catch(() => ({ message: "Respuesta no válida del servidor." }));
    if (!r.ok)
        throw Error(
            data.errors
                ? Object.values(data.errors).flat().join("\n")
                : data.message || "No se pudo completar la operación.",
        );
    return data;
}
function query() {
    const p = new URLSearchParams();
    if ($("#department").value) p.set("department_id", $("#department").value);
    if ($("#period").value) p.set("period", $("#period").value);
    return p.toString();
}
function filteredFarms() {
    return farms.filter(
        (f) =>
            !$("#department").value ||
            String(f.department_id) === $("#department").value,
    );
}
function table(headers, rows) {
    return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || `<tr><td colspan="${headers.length}" class="empty">No hay registros para esta selección.</td></tr>`}</tbody></table></div>`;
}
function metric(label, value, unit, note, symbol) {
    return `<article class="card metric"><small>${label}</small><span class="symbol">${symbol}</span><strong>${num(value, value < 100 ? 1 : 0)} <em>${unit}</em></strong><p>${note}</p></article>`;
}
function editButton(kind, id, label = "Editar") {
    return window.canEdit
        ? `<button data-edit="${kind}" data-id="${id}">${label}</button>`
        : "";
}
function toolbar(label, kind) {
    return `<div class="toolbar"><input id="search" type="search" placeholder="Buscar ${label.toLowerCase()}…" aria-label="Buscar ${label}">${window.canEdit ? `<button class="primary" data-edit="${kind}" data-id="">+ ${label}</button>` : '<a class="read-only" href="/login">Inicia sesión para registrar o editar ↗</a>'}</div>`;
}
function drawChart(id, type, labels, datasets) {
    if (!window.Chart) {
        $("#" + id).parentNode.innerHTML =
            "<p>No se pudo cargar el gráfico.</p>";
        return;
    }
    charts.push(
        new Chart($("#" + id), {
            type,
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            boxWidth: 7,
                            font: { size: 10 },
                            padding: 20,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: "#edf1f3" },
                        ticks: {
                            font: { size: 10 },
                            callback: (v) =>
                                v >= 1000 ? num(v / 1000, 1) + "k" : v,
                        },
                    },
                },
            },
        }),
    );
}
function energyChart(id, data) {
    drawChart(
        id,
        "bar",
        data.map((d) => d.period),
        [
            {
                label: "Real · kWh",
                data: data.map((d) => d.actual_kwh),
                backgroundColor: "#218c70",
                borderRadius: 4,
                maxBarThickness: 24,
            },
            {
                label: "Esperada · kWh",
                data: data.map((d) => d.expected_kwh),
                backgroundColor: "#dcebe3",
                borderRadius: 4,
                maxBarThickness: 24,
            },
        ],
    );
}
function mapView(id, list) {
    if (!window.L) {
        $("#" + id).innerHTML =
            "<p>El mapa no pudo cargarse. Recarga la página.</p>";
        return;
    }
    map = L.map(id, { scrollWheelZoom: false }).setView([15.65, -90.3], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const markers = [];
    list.forEach((f) => {
        const color = f.active
            ? `hsl(${145 + ((f.department_id * 17) % 85)},48%,40%)`
            : "#929b9f";
        const m = L.circleMarker([f.latitude, f.longitude], {
            radius: 8,
            color: "white",
            weight: 2,
            fillColor: color,
            fillOpacity: 0.95,
        }).addTo(map);
        m.bindPopup(
            `<strong>${esc(f.name)}</strong><br>${esc(f.department.name)}<br>${num(f.capacity_kw, 2)} kW · ${num(f.panel_count)} paneles<br>${num(f.families)} familias<br>${f.active ? "Activa" : "Inactiva"}<br><button onclick="showFarm(${f.id})">Ver detalle</button>`,
        );
        markers.push(m);
    });
    if (markers.length)
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25), {
            maxZoom: 10,
        });
    setTimeout(() => map.invalidateSize(), 100);
}
async function load() {
    const ticket = ++loadId;
    $("#error").hidden = true;
    charts.forEach((c) => c.destroy());
    charts = [];
    if (map) {
        map.remove();
        map = null;
    }
    $("#page-title").textContent = titles[page][0];
    $("#page-subtitle").textContent = titles[page][1];
    document
        .querySelectorAll("nav button")
        .forEach((b) =>
            b.classList.toggle("selected", b.dataset.page === page),
        );
    $("#filters").hidden = ["docs", "panels", "forecast"].includes(page);
    $("#filters").style.display = ["docs", "panels", "forecast"].includes(page)
        ? "none"
        : "";
    $("#period").disabled = ["farms", "map"].includes(page);
    $("#export").href = "/api/reports/departments.csv?" + query();
    $("#content").innerHTML = '<div class="card">Cargando datos…</div>';
    try {
        stats = await api("/api/statistics?" + query());
        if (ticket !== loadId) return;
        $("#alert-count").textContent = stats.totals.alerts || "";
        await render(ticket);
    } catch (e) {
        $("#error").textContent = e.message;
        $("#error").hidden = false;
        $("#content").innerHTML =
            '<div class="card empty">No se pudieron cargar los datos. <button onclick="load()">Reintentar</button></div>';
    }
}
async function render(ticket) {
    const c = $("#content"),
        t = stats.totals,
        fs = filteredFarms();
    if (page === "dashboard") {
        c.innerHTML = `<div class="metrics">${metric("Generación solar", t.actual_kwh, "kWh", "Durante el período seleccionado", "ϟ")}${metric("Capacidad instalada", t.capacity_kw, "kW", num(t.panels) + " paneles instalados", "▦")}${metric("CO₂ evitado", t.co2_tonnes, "t", num(t.co2_kg, 1) + " kg de emisiones evitadas", "♧")}${metric("Granjas registradas", t.farms, "", num(t.active_farms) + " instalaciones activas", "⌂")}${metric("Familias beneficiadas", t.families, "", "Suma declarada por instalación", "⌘")}${metric("Alertas de generación", t.alerts, "", "Real ≤ 80% de lo esperado", "△")}</div><div class="grid"><article class="card"><div class="card-heading"><div><h2>Generación real vs. esperada</h2><p>Comparación mensual · kWh</p></div><span class="pill">${esc($("#period").value || "Acumulado")}</span></div><div class="chart"><canvas id="energy"></canvas></div></article><article class="card"><div class="card-heading"><div><h2>Departamentos destacados</h2><p>Ranking por energía generada</p></div><span class="pill">Top 5</span></div><div class="rank">${stats.departments
            .slice(0, 5)
            .map(
                (d, i) =>
                    `<div class="rank-row"><span>0${i + 1}</span><div>${esc(d.name)}<div class="bar"><i style="width:${Math.max(1, (d.actual_kwh / (stats.departments[0]?.actual_kwh || 1)) * 100)}%"></i></div></div><strong>${num(d.actual_kwh)} <small>kWh</small></strong></div>`,
            )
            .join(
                "",
            )}</div></article></div><div class="grid"><article class="card"><div class="card-heading"><div><h2>Distribución solar</h2><p>Instalaciones por departamento</p></div><button data-go="map">Explorar mapa ↗</button></div><div id="map" class="map"></div><div class="map-legend">● Colores por departamento · Selecciona una granja para consultar sus datos</div></article><article class="card"><div class="card-heading"><div><h2>Monitoreo de desempeño</h2><p>Detecta dónde se necesita atención</p></div></div><div class="details-kpis"><div><strong>${t.expected_kwh ? num((t.actual_kwh / t.expected_kwh) * 100, 1) + "%" : "—"}</strong><small>Cumplimiento nacional</small></div><div><strong>${num(t.alerts)}</strong><small>Registros con alerta</small></div></div><h3>Una regla, una señal clara</h3><p>Se registra una alerta cuando la generación real es 20% o más inferior a la esperada en el mismo mes.</p><button data-go="alerts">Consultar alertas →</button><h3 style="margin-top:30px">Proyección explicable</h3><p>Promedio de tres meses consecutivos y evaluación histórica sin usar datos futuros.</p><button data-go="forecast">Ver proyecciones →</button></article></div>`;
        energyChart("energy", stats.monthly);
        mapView("map", fs);
    } else if (page === "map") {
        c.innerHTML = `<article class="card"><div class="card-heading"><div><h2>${fs.length} granjas en el territorio</h2><p>Arrastra para navegar. Usa + y − para acercar y alejar.</p></div><span class="pill">Ubicaciones simuladas</span></div><div id="map" class="map fullmap"></div><div class="map-legend">${departments
            .filter((d) => fs.some((f) => f.department_id === d.id))
            .map(
                (d) =>
                    `<span style="color:hsl(${145 + ((d.id * 17) % 85)},48%,35%)">● ${esc(d.name)}</span>`,
            )
            .join("")}</div></article>`;
        mapView("map", fs);
    } else if (page === "farms") {
        c.innerHTML = `<article class="card">${toolbar("Nueva granja", "farm")}${table(
            [
                "Granja / departamento",
                "Paneles",
                "Capacidad",
                "Familias",
                "Estado",
                "Acciones",
            ],
            fs.map(
                (f) =>
                    `<tr data-search="${esc((f.name + " " + f.department.name).toLowerCase())}"><td><b>${esc(f.name)}</b><small>${esc(f.department.name)}</small></td><td>${num(f.panel_count)}</td><td>${num(f.capacity_kw, 2)} kW</td><td>${num(f.families)}</td><td><span class="pill ${f.active ? "" : "off"}">${f.active ? "Activa" : "Inactiva"}</span></td><td><button onclick="showFarm(${f.id})">Detalle</button> ${editButton("farm", f.id)}</td></tr>`,
            ),
        )}</article>`;
    } else if (page === "panels") {
        c.innerHTML = `<article class="card">${toolbar("Nuevo modelo", "panel")}${table(
            ["Marca", "Modelo", "Potencia nominal", "Estado", "Acciones"],
            panels.map(
                (p) =>
                    `<tr data-search="${esc((p.brand + " " + p.model).toLowerCase())}"><td>${esc(p.brand)}</td><td>${esc(p.model)}</td><td>${num(p.power_kw, 3)} kW</td><td><span class="pill ${p.status === "activo" ? "" : "off"}">${esc(p.status)}</span></td><td>${editButton("panel", p.id)}</td></tr>`,
            ),
        )}</article>`;
    } else if (page === "generation" || page === "alerts") {
        let q = new URLSearchParams();
        if ($("#period").value) q.set("period", $("#period").value);
        generations = (await api("/api/generations?" + q)).filter((g) =>
            fs.some((f) => f.id === g.farm_id),
        );
        if (ticket !== loadId) return;
        if (page === "generation")
            c.innerHTML = `<article class="card">${toolbar("Nueva medición", "generation")}${table(
                [
                    "Granja",
                    "Mes",
                    "Real kWh",
                    "Esperada kWh",
                    "CO₂ kg",
                    "Desempeño",
                    "Acciones",
                ],
                generations.map(
                    (g) =>
                        `<tr data-search="${esc(g.farm.name.toLowerCase())}"><td>${esc(g.farm.name)}</td><td>${esc(g.period.slice(0, 7))}</td><td>${num(g.actual_kwh, 2)}</td><td>${num(g.expected_kwh, 2)}</td><td>${num(g.co2_kg, 2)}</td><td><span class="pill ${g.is_alert ? "warn" : ""}">${g.expected_kwh ? num((g.actual_kwh / g.expected_kwh) * 100, 1) + "%" : "Sin base"}</span></td><td>${editButton("generation", g.id)}</td></tr>`,
                ),
            )}</article>`;
        else {
            const alerts = generations
                .filter((g) => g.is_alert)
                .sort((a, b) => b.deviation_percent - a.deviation_percent);
            c.innerHTML = `<div class="card-heading"><div><h2>${alerts.length} registros requieren atención</h2><p>Ordenados por desviación. Corregir la medición recalcula la alerta automáticamente.</p></div></div>${alerts.map((g) => `<article class="card alert-card"><div><span class="pill warn">${esc(g.period.slice(0, 7))} · ${esc(g.farm.department.name)}</span><h3>${esc(g.farm.name)}</h3><p>Real: ${num(g.actual_kwh, 2)} kWh / Esperada: ${num(g.expected_kwh, 2)} kWh</p></div><div><strong>−${num(g.deviation_percent, 1)}%</strong><p>Frente a lo esperado</p>${editButton("generation", g.id, "Revisar medición")}</div></article>`).join("") || '<div class="card empty">No hay alertas para el período y departamento seleccionados.</div>'}`;
        }
    } else if (page === "reports") {
        c.innerHTML = `<article class="card"><div class="card-heading"><div><h2>Comparativo de departamentos</h2><p>Las granjas inactivas conservan su historial. Familias: suma declarada, sin deduplicación entre granjas.</p></div><span class="pill">${esc($("#period").value || "Acumulado")}</span></div>${table(
            [
                "Departamento",
                "Granjas",
                "Paneles",
                "kW instalados",
                "Real kWh",
                "Esperada kWh",
                "Familias",
                "CO₂ kg",
            ],
            stats.departments.map(
                (d) =>
                    `<tr><td><b>${esc(d.name)}</b></td><td>${d.farms}</td><td>${num(d.panels)}</td><td>${num(d.capacity_kw, 2)}</td><td>${num(d.actual_kwh, 2)}</td><td>${num(d.expected_kwh, 2)}</td><td>${num(d.families)}</td><td>${num(d.co2_kg, 2)}</td></tr>`,
            ),
        )}</article>`;
    } else if (page === "forecast") {
        c.innerHTML = `<article class="card"><div class="card-heading"><div><h2>Proyección por granja</h2><p>Elige una instalación para consultar el próximo mes disponible.</p></div></div><label class="forecast-select">Granja<select id="forecast-farm">${farms.map((f) => `<option value="${f.id}">${esc(f.name)}</option>`).join("")}</select></label><div id="forecast-result"></div></article>`;
        $("#forecast-farm").onchange = forecast;
        await forecast();
    } else if (page === "docs") {
        c.innerHTML = docs();
    }
    bind();
}
async function forecast() {
    if (!$("#forecast-farm").value) {
        $("#forecast-result").innerHTML = "<p>No hay granjas registradas.</p>";
        return;
    }
    try {
        const f = await api(`/api/farms/${$("#forecast-farm").value}/forecast`);
        $("#forecast-result").innerHTML =
            `<div class="details-kpis"><div><strong>${f.projected_kwh === null ? "Sin historial" : num(f.projected_kwh, 2) + " kWh"}</strong><small>Proyección para ${esc(f.period || "próximo mes")}</small></div><div><strong>${f.mae_kwh === null ? "—" : num(f.mae_kwh, 2) + " kWh"}</strong><small>Error absoluto medio histórico</small></div><div><strong>${f.sample_size} meses</strong><small>Ventana de observación</small></div></div><p>${esc(f.method)}. ${esc(f.limitations)}</p><div class="chart" style="margin:25px 0"><canvas id="forecast-chart"></canvas></div><h3>Validación con meses posteriores</h3><p>En cada fila se usan únicamente los tres meses anteriores. El resultado real se reserva para evaluar el error.</p>${table(
                ["Mes", "Proyectada kWh", "Real kWh", "Error absoluto kWh"],
                f.backtest.map(
                    (b) =>
                        `<tr><td>${esc(b.period)}</td><td>${num(b.projected_kwh, 2)}</td><td>${num(b.actual_kwh, 2)}</td><td>${num(b.absolute_error, 2)}</td></tr>`,
                ),
            )}`;
        charts.forEach((c) => c.destroy());
        charts = [];
        drawChart(
            "forecast-chart",
            "line",
            [
                ...f.history.map((g) => g.period.slice(0, 7)),
                ...(f.projected_kwh === null ? [] : [f.period]),
            ],
            [
                {
                    label: "Generación real",
                    data: f.history.map((g) => g.actual_kwh),
                    borderColor: "#168768",
                    backgroundColor: "#168768",
                    tension: 0.25,
                },
                {
                    label: "Proyección",
                    data: [
                        ...f.history.map((g, i) =>
                            i === f.history.length - 1 ? g.actual_kwh : null,
                        ),
                        f.projected_kwh,
                    ],
                    borderColor: "#d69a40",
                    backgroundColor: "#d69a40",
                    borderDash: [5, 5],
                },
            ],
        );
    } catch (e) {
        $("#forecast-result").textContent = e.message;
    }
}
function docs() {
    return `<article class="card docs"><h2>API REST pública</h2><p>Consultas JSON sin autenticación; límite de 120 solicitudes por minuto. La administración usa sesión y protección CSRF.</p>${table(
        ["Método", "Endpoint", "Resultado"],
        [
            ["/api/departments", "22 departamentos"],
            ["/api/farms?department_id=1", "Granjas, paneles y capacidad"],
            ["/api/farms/1", "Detalle e historial"],
            ["/api/panels", "Modelos de panel"],
            ["/api/generations?farm_id=1&period=2026-08", "Generación mensual"],
            [
                "/api/statistics?department_id=1&period=2026-08",
                "Totales, ranking y serie mensual",
            ],
            ["/api/alerts?period=2026-08", "Desviaciones de al menos 20%"],
            ["/api/farms/1/forecast", "Proyección y evaluación histórica"],
            ["/api/reports/departments.csv", "Reporte descargable"],
        ].map(
            ([url, desc]) =>
                `<tr><td>GET</td><td><a href="${url}" target="_blank"><code>${url}</code></a></td><td>${desc}</td></tr>`,
        ),
    )}<h2>Reglas de cálculo</h2><ul><li>Capacidad instalada = Σ potencia nominal del modelo × cantidad instalada. Se expresa en kW.</li><li>CO₂ evitado = generación real × 0.40 kg/kWh. Toneladas = kg / 1000.</li><li>Alerta: real ≤ esperada × 0.80, siempre que la esperada sea mayor que cero. Con esperada cero no se calcula desviación.</li><li>Un registro por granja y mes. La fecha se almacena como primer día del mes. No se admiten meses futuros.</li><li>Proyección = promedio de los tres meses consecutivos anteriores. Sin tres meses no se publica una cifra.</li><li>El inventario refleja el estado actual. La generación conserva el historial de granjas desactivadas.</li></ul><h2>Arquitectura</h2><p>Laravel 12 · MySQL 8 · Eloquent · Blade · JavaScript · Leaflet · Chart.js. Controlador para validación y operaciones; servicio SolarAnalytics para agregaciones y proyecciones; modelos y claves foráneas para relaciones.</p><pre>departments 1 ── N farms 1 ── N generations 1 ── 0..1 alerts\n                     │\n                     1\n                     │\n                     N\n                 farm_panel N ── 1 panels</pre><h2>Errores y administración</h2><p>422: validación; 404: registro inexistente; 401: sesión requerida; 419: CSRF o sesión vencida; 429: demasiadas solicitudes. POST y PUT en <code>/manage/farms</code>, <code>/manage/panels</code> y <code>/manage/generations</code> requieren acceso administrativo. PUT agrega el ID al endpoint. DELETE <code>/manage/farms/{id}</code> desactiva sin borrar el historial.</p><h2>Uso de IA y referencias</h2><p>Codex se utilizó para analizar las bases, generar código, diseñar las pruebas y preparar documentación. La proyección utiliza un método estadístico, no un modelo de IA en producción. La evidencia de prompts y resultados se conserva en la documentación del proyecto.</p><p><a href="https://laravel.com/docs/12.x">Documentación Laravel</a> · <a href="https://leafletjs.com/examples/quick-start/">Leaflet</a> · <a href="/presentacion.html" target="_blank">Presentación del proyecto</a> · <a href="/openapi.json" target="_blank">Especificación OpenAPI</a></p></article>`;
}
function bind() {
    document
        .querySelectorAll("[data-edit]")
        .forEach(
            (b) => (b.onclick = () => editor(b.dataset.edit, b.dataset.id)),
        );
    document
        .querySelectorAll("[data-go]")
        .forEach((b) => (b.onclick = () => navigate(b.dataset.go)));
    if ($("#search"))
        $("#search").oninput = (e) =>
            document
                .querySelectorAll("[data-search]")
                .forEach(
                    (r) =>
                        (r.hidden = !r.dataset.search.includes(
                            e.target.value.toLowerCase(),
                        )),
                );
}
function navigate(p) {
    page = p;
    location.hash = p;
    load();
}
document
    .querySelectorAll("nav button")
    .forEach((b) => (b.onclick = () => navigate(b.dataset.page)));
$("#department").onchange = load;
$("#period").onchange = load;
$("#all-periods").onclick = () => {
    $("#period").value = "";
    load();
};
$("#close-modal").onclick = $("#cancel-modal").onclick = () =>
    $("#modal").close();
function field(label, name, type, value = "", extra = "") {
    return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra} required></label>`;
}
let editKind = "",
    editId = "";
function panelLine(id = "", quantity = 1) {
    return `<div class="panel-line"><select class="panel-id" aria-label="Modelo de panel">${panels.map((p) => `<option value="${p.id}" ${String(p.id) === String(id) ? "selected" : ""}>${esc(p.model)} · ${p.power_kw} kW</option>`).join("")}</select><input class="panel-quantity" aria-label="Cantidad instalada" type="number" min="1" max="10000000" value="${quantity}" required><button type="button" onclick="this.parentElement.remove()" aria-label="Quitar modelo">×</button></div>`;
}
function editor(kind, id) {
    if (!window.canEdit) return;
    editKind = kind;
    editId = id;
    $("#form-error").hidden = true;
    $("#editor").onsubmit = save;
    $("#save").hidden = false;
    $("#dialog-title").textContent =
        (id ? "Editar " : "Registrar ") +
        { farm: "granja", panel: "modelo de panel", generation: "generación" }[
            kind
        ];
    const x =
        (kind === "farm"
            ? farms
            : kind === "panel"
              ? panels
              : generations
        ).find((x) => String(x.id) === id) || {};
    if (kind === "farm")
        $("#fields").innerHTML =
            `${field("Nombre de la granja", "name", "text", x.name || "", 'maxlength="150"')}<label>Departamento<select name="department_id">${departments.map((d) => `<option value="${d.id}" ${d.id === x.department_id ? "selected" : ""}>${esc(d.name)}</option>`).join("")}</select></label>${field("Latitud", "latitude", "number", x.latitude ?? 14.6349, 'step="any" min="13.5" max="17.9"')}${field("Longitud", "longitude", "number", x.longitude ?? -90.5069, 'step="any" min="-92.3" max="-88"')}${field("Familias beneficiadas", "families", "number", x.families ?? 0, 'min="0" max="10000000"')}<label>Estado<select name="active"><option value="1">Activa</option><option value="0" ${x.active === false ? "selected" : ""}>Inactiva</option></select></label><div class="wide"><h3>Paneles instalados</h3><div id="panel-lines">${(x.panels || []).map((p) => panelLine(p.id, p.pivot.quantity)).join("")}</div><button type="button" id="add-panel">+ Asociar modelo</button><p>Capacidad = potencia × cantidad. La desactivación conserva el historial.</p></div>`;
    if (kind === "panel")
        $("#fields").innerHTML =
            `${field("Marca", "brand", "text", x.brand || "", 'maxlength="100"')}${field("Modelo", "model", "text", x.model || "", 'maxlength="100"')}${field("Potencia nominal (kW)", "power_kw", "number", x.power_kw ?? 0.55, 'step="0.001" min="0.001" max="10"')}<label>Estado<select name="status"><option value="activo">activo</option><option value="inactivo" ${x.status === "inactivo" ? "selected" : ""}>inactivo</option></select></label><p class="wide">Editar la potencia de un modelo actualiza la capacidad de todas sus granjas asociadas. El estado del catálogo no retira paneles instalados.</p>`;
    if (kind === "generation")
        $("#fields").innerHTML =
            `<label>Granja activa<select name="farm_id">${farms
                .filter((f) => f.active)
                .map(
                    (f) =>
                        `<option value="${f.id}" ${f.id === x.farm_id ? "selected" : ""}>${esc(f.name)}</option>`,
                )
                .join(
                    "",
                )}</select></label>${field("Mes", "period", "month", x.period?.slice(0, 7) || $("#period").value || new Date().toISOString().slice(0, 7), 'max="' + new Date().toISOString().slice(0, 7) + '"')}${field("Generación real (kWh)", "actual_kwh", "number", x.actual_kwh ?? 0, 'min="0" max="999999999" step="0.01"')}${field("Generación esperada (kWh)", "expected_kwh", "number", x.expected_kwh ?? 0, 'min="0" max="999999999" step="0.01"')}<p class="wide">Una medición por granja y mes. Al guardar se recalculan CO₂ y alertas.</p>`;
    if ($("#add-panel"))
        $("#add-panel").onclick = () => {
            if (!panels.length) {
                alert("Registra primero un modelo de panel.");
                return;
            }
            $("#panel-lines").insertAdjacentHTML("beforeend", panelLine());
        };
    $("#modal").showModal();
}
async function save(e) {
    e.preventDefault();
    const b = $("#save");
    b.disabled = true;
    $("#form-error").hidden = true;
    const data = Object.fromEntries(new FormData($("#editor")));
    if (editKind === "farm") {
        data.active = data.active === "1";
        data.panels = [...document.querySelectorAll(".panel-line")].map(
            (r) => ({
                panel_id: Number(r.querySelector(".panel-id").value),
                quantity: Number(r.querySelector(".panel-quantity").value),
            }),
        );
    }
    const resource = {
        farm: "farms",
        panel: "panels",
        generation: "generations",
    }[editKind];
    try {
        await api("/manage/" + resource + (editId ? "/" + editId : ""), {
            method: editId ? "PUT" : "POST",
            body: JSON.stringify(data),
        });
        $("#modal").close();
        [farms, panels] = await Promise.all([
            api("/api/farms"),
            api("/api/panels"),
        ]);
        $("#toast").textContent = "Cambios guardados correctamente";
        $("#toast").hidden = false;
        setTimeout(() => ($("#toast").hidden = true), 3500);
        await load();
    } catch (e) {
        $("#form-error").textContent = e.message;
        $("#form-error").hidden = false;
    } finally {
        b.disabled = false;
    }
}
async function showFarm(id) {
  $("#editor").onsubmit = (event) => event.preventDefault();
    try {
        const f = await api("/api/farms/" + id);
        $("#dialog-title").textContent = f.name;
        $("#save").hidden = true;
        $("#form-error").hidden = true;
        $("#fields").innerHTML =
            `<div class="wide"><span class="pill">${esc(f.department.name)}</span><div class="details-kpis"><div><strong>${num(f.capacity_kw, 2)}</strong><small>kW instalados</small></div><div><strong>${num(f.panel_count)}</strong><small>Paneles</small></div><div><strong>${num(f.families)}</strong><small>Familias</small></div></div><p>Coordenadas: ${f.latitude}, ${f.longitude} · ${f.active ? "Activa" : "Inactiva"}</p><h3>Equipos instalados</h3>${table(
                ["Modelo", "Cantidad", "kW"],
                f.panels.map(
                    (p) =>
                        `<tr><td>${esc(p.model)}</td><td>${num(p.pivot.quantity)}</td><td>${num(p.power_kw * p.pivot.quantity, 2)}</td></tr>`,
                ),
            )}<h3>Historial mensual</h3>${table(
                ["Mes", "Real kWh", "Esperada kWh"],
                f.generations.map(
                    (g) =>
                        `<tr><td>${esc(g.period.slice(0, 7))}</td><td>${num(g.actual_kwh, 2)}</td><td>${num(g.expected_kwh, 2)}</td></tr>`,
                ),
            )}</div>`;
        $("#modal").showModal();
    } catch (e) {
        $("#error").textContent = e.message;
        $("#error").hidden = false;
    }
}
(async () => {
    try {
        [departments, farms, panels] = await Promise.all([
            api("/api/departments"),
            api("/api/farms"),
            api("/api/panels"),
        ]);
        $("#department").insertAdjacentHTML(
            "beforeend",
            departments
                .map((d) => `<option value="${d.id}">${esc(d.name)}</option>`)
                .join(""),
        );
        page = titles[location.hash.slice(1)]
            ? location.hash.slice(1)
            : "dashboard";
        await load();
    } catch (e) {
        $("#content").textContent =
            "No se pudo conectar con el servidor: " + e.message;
    }
})();

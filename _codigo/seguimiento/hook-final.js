
// ---------------------------------------------------------------------------
// Seguimiento de pedidos (8 nov 2026)
//
// - El pedido nace "Esperando anticipo" con 48 horas para pagar (vence_en, hora UTC en ISO).
// - Cada 15 minutos: recordatorio cuando faltan menos de 24 h y "Vencido" cuando pasa el plazo.
// - Correos automáticos al cliente y avisos al equipo (si el correo está configurado abajo).
// - Campos nuevos de "pedidos" que este archivo crea solo si no existen:
//   entrega (JSON), envio (número) y vence_en (texto).
// ---------------------------------------------------------------------------

onBootstrap((e) => {
	e.next();
	try {
		const c = e.app.findCollectionByNameOrId("pedidos");
		let cambio = false;
		if (!c.fields.getByName("entrega")) {
			c.fields.add(new JSONField({ name: "entrega", maxSize: 20000 }));
			cambio = true;
		}
		if (!c.fields.getByName("envio")) {
			c.fields.add(new NumberField({ name: "envio", min: 0 }));
			cambio = true;
		}
		if (!c.fields.getByName("vence_en")) {
			c.fields.add(new TextField({ name: "vence_en", max: 40 }));
			cambio = true;
		}
		if (cambio) e.app.save(c);
	} catch (err) {
		console.log("[samar/campos] " + err);
	}
	// Correo de salida: buzón de samarpadridin.com (Latinoamérica Hosting).
	// Para activarlo, el dueño pega la contraseña del buzón en CLAVE_CORREO (este archivo no es público).
	try {
		const CORREO = { host: "mail.samarpadridin.com", puerto: 465, usuario: "pedidos@samarpadridin.com", nombre: "Samar Padridin" };
		const CLAVE_CORREO = "PEGA_AQUI_LA_CLAVE";
		if (CLAVE_CORREO && CLAVE_CORREO.indexOf("PEGA_AQUI") !== 0) {
			const s = e.app.settings();
			s.smtp.enabled = true;
			s.smtp.host = CORREO.host;
			s.smtp.port = CORREO.puerto;
			s.smtp.tls = CORREO.puerto === 465;
			s.smtp.authMethod = "PLAIN";
			s.smtp.username = CORREO.usuario;
			s.smtp.password = CLAVE_CORREO;
			s.meta.senderAddress = CORREO.usuario;
			s.meta.senderName = CORREO.nombre;
			e.app.save(s);
		}
	} catch (err) {
		console.log("[samar/correo] configuración: " + err);
	}
});

// Cada 15 minutos: pedidos de antes al nuevo flujo, recordatorios y vencimientos
cronAdd("samar_seguimiento", "*/15 * * * *", () => {
	const PLAZO_HORAS = 48;
	const ahora = Date.now();
	const iso = new Date(ahora).toISOString();
	const leerHist = (r) => {
		try {
			const h = JSON.parse(r.getString("historial") || "[]");
			return Array.isArray(h) ? h : [];
		} catch (_) {
			return [];
		}
	};
	const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
	const fechaCO = (txtIso) => {
		const t = Date.parse(String(txtIso || ""));
		if (isNaN(t)) return "";
		const c = new Date(t - 5 * 3600 * 1000);
		let h = c.getUTCHours();
		const ap = h >= 12 ? "p. m." : "a. m.";
		h = h % 12 || 12;
		return c.getUTCDate() + " de " + MESES[c.getUTCMonth()] + ", " + h + ":" + String(c.getUTCMinutes()).padStart(2, "0") + " " + ap;
	};
	// 1) Pedidos creados antes de este cambio ("Recibido" sin pagar y sin comprobante): el plazo corre desde hoy
	try {
		const viejos = $app.findRecordsByFilter("pedidos", "estado = 'Recibido' && anticipo_pagado = false && vence_en = ''", "created", 200, 0);
		viejos.forEach((r) => {
			if (r.getString("comprobante")) return;
			const vence = new Date(ahora + PLAZO_HORAS * 3600 * 1000).toISOString();
			const h = leerHist(r);
			h.push({ estado: "Esperando anticipo", fecha: iso, nota: "Tienes hasta el " + fechaCO(vence) + " (hora de Colombia) para pagar el anticipo con Wompi.", publico: true });
			r.set("estado", "Esperando anticipo");
			r.set("vence_en", vence);
			r.set("historial", h);
			$app.save(r);
		});
	} catch (err) {
		console.log("[samar/seguimiento] pedidos de antes: " + err);
	}
	// 2) Recordatorio único cuando faltan menos de 24 horas
	try {
		const en24 = new Date(ahora + 24 * 3600 * 1000).toISOString();
		const porVencer = $app.findRecordsByFilter("pedidos", "estado = 'Esperando anticipo' && anticipo_pagado = false && vence_en != '' && vence_en > {:a} && vence_en <= {:b}", "vence_en", 200, 0, { a: iso, b: en24 });
		porVencer.forEach((r) => {
			const h = leerHist(r);
			if (h.some((x) => x && x.estado === "Recordatorio")) return;
			h.push({ estado: "Recordatorio", fecha: iso, nota: "Recordatorio de pago enviado (vence el " + fechaCO(r.getString("vence_en")) + ").", publico: false });
			r.set("historial", h);
			$app.save(r);
		});
	} catch (err) {
		console.log("[samar/seguimiento] recordatorios: " + err);
	}
	// 3) Vencidos
	try {
		const vencidos = $app.findRecordsByFilter("pedidos", "estado = 'Esperando anticipo' && anticipo_pagado = false && vence_en != '' && vence_en <= {:a}", "vence_en", 200, 0, { a: iso });
		vencidos.forEach((r) => {
			const h = leerHist(r);
			h.push({ estado: "Vencido", fecha: iso, nota: "El plazo para pagar el anticipo terminó. Tu diseño sigue guardado: puedes volver a hacer el pedido.", publico: true });
			r.set("estado", "Vencido");
			r.set("historial", h);
			$app.save(r);
		});
	} catch (err) {
		console.log("[samar/seguimiento] vencidos: " + err);
	}
});

// Pedido nuevo: correo al cliente con el plazo y aviso al equipo
onRecordAfterCreateSuccess((e) => {
	try {
		const r = e.record;
/*__CORREO__*/
		if (r.getString("estado") === "Esperando anticipo") {
			correoCliente(r, "Esperando anticipo");
			avisoEquipo(r, "Nuevo");
		}
	} catch (err) {
		console.log("[samar/correo] pedido nuevo: " + err);
	}
	e.next();
}, "pedidos");

// Cambios en un pedido (panel, Wompi, tareas programadas): correo al cliente y avisos al equipo
onRecordUpdate((e) => {
	let antesEstado = "";
	let antesPagado = false;
	let antesHist = 0;
	try {
		const o = e.record.original();
		antesEstado = o.getString("estado");
		antesPagado = o.getBool("anticipo_pagado");
		const ho = JSON.parse(o.getString("historial") || "[]");
		antesHist = Array.isArray(ho) ? ho.length : 0;
	} catch (_) {}
	e.next();
	try {
		const r = e.record;
		const estado = r.getString("estado");
		const pagado = r.getBool("anticipo_pagado");
		let hist = [];
		try {
			const h = JSON.parse(r.getString("historial") || "[]");
			if (Array.isArray(h)) hist = h;
		} catch (_) {}
		const nuevas = hist.slice(antesHist);
		const ultimaNota = nuevas.length ? String((nuevas[nuevas.length - 1] || {}).nota || "") : "";
		const pagoNuevo = pagado && !antesPagado;
		const cambioEstado = estado !== antesEstado;
		const recordatorio = nuevas.some((x) => x && x.estado === "Recordatorio");
		if (!pagoNuevo && !cambioEstado && !recordatorio) return;
/*__CORREO__*/
		if (pagoNuevo) {
			correoCliente(r, "Pagado");
			avisoEquipo(r, "Pagado");
		}
		if (recordatorio && estado === "Esperando anticipo") correoCliente(r, "Recordatorio");
		if (cambioEstado) {
			if (estado === "Esperando anticipo") {
				correoCliente(r, "Esperando anticipo");
			} else if (estado === "Vencido") {
				correoCliente(r, "Vencido");
				avisoEquipo(r, "Vencido");
			} else if (estado === "Cambios solicitados") {
				avisoEquipo(r, "Cambios");
			} else if (estado === "Cancelado" && ultimaNota.indexOf("Reemplazado") === 0) {
				// reemplazado por un pedido nuevo: el cliente ya recibe el correo del nuevo
			} else if (estado !== "Anticipo pagado" || !pagoNuevo) {
				correoCliente(r, estado);
			}
		}
	} catch (err) {
		console.log("[samar/correo] cambio de pedido: " + err);
	}
}, "pedidos");



// ---------------------------------------------------------------------------
// Pagos con Wompi (anticipo del 50%)
//
// POST /api/samar/wompi/firma      -> datos firmados para abrir el checkout de Wompi (cliente con sesión, dueño del pedido)
// POST /api/samar/wompi/verificar  -> al volver de Wompi: consulta la transacción en Wompi y marca el anticipo si quedó aprobado
// POST /api/samar/wompi/eventos    -> eventos de Wompi (URL de eventos del comercio): valida la firma y marca el anticipo
//
// La referencia de cada cobro es "<código del pedido>-<sufijo>", por ejemplo SAM-2026-11-004-LQ8Z1K.
// Solo se marca pagado si Wompi dice APPROVED, la moneda es COP y el valor es exactamente el anticipo del pedido.
// Los secretos de integridad y de eventos viven solo aquí (servidor); nunca en las páginas.
// ---------------------------------------------------------------------------

routerAdd("POST", "/api/samar/wompi/firma", (e) => {
	try {
		const LLAVE_PUBLICA = "__WOMPI_PUB__";
		const INTEGRIDAD = "__WOMPI_INT__";
		if (!e.auth || e.auth.collection().name !== "users") {
			return e.json(401, { message: "Inicia sesión para pagar tu pedido." });
		}
		const b = e.requestInfo().body || {};
		const codigo = String(b.codigo || "").trim().toUpperCase().slice(0, 20);
		const noEncontrado = { message: "No encontramos ese pedido en tu cuenta." };
		if (!codigo) return e.json(404, noEncontrado);
		let r;
		try {
			r = e.app.findFirstRecordByFilter("pedidos", "codigo = {:c}", { c: codigo });
		} catch (_) {
			return e.json(404, noEncontrado);
		}
		if (r.getString("usuario") !== e.auth.id) return e.json(404, noEncontrado);
		if (r.getBool("anticipo_pagado")) return e.json(409, { message: "El anticipo de este pedido ya está pagado." });
		if (r.getString("estado") === "Cancelado") return e.json(409, { message: "Este pedido está cancelado." });
		const moneda = r.getString("moneda") === "USD" ? "USD" : "COP";
		const anticipo = r.getFloat("anticipo");
		if (!(anticipo > 0)) return e.json(400, { message: "Este pedido no tiene un anticipo por pagar." });

		// Wompi cobra en pesos: en pedidos en dólares el anticipo se convierte con la TRM del día
		let trm = 0;
		let pesos = Math.round(anticipo);
		if (moneda === "USD") {
			const llave = "samar_trm";
			const guardada = e.app.store().get(llave);
			if (guardada && Date.now() - guardada.t < 6 * 60 * 60 * 1000) trm = guardada.v;
			if (!trm) {
				try {
					const res = $http.send({ url: "https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1", method: "GET", timeout: 15 });
					let j = null;
					try {
						j = res.json;
					} catch (_) {}
					if (!j) {
						try {
							j = JSON.parse(toString(res.body));
						} catch (_) {}
					}
					const v = Number(j && j[0] && j[0].valor);
					if (v > 1000 && v < 20000) {
						trm = v;
						e.app.store().set(llave, { v: v, t: Date.now() });
					}
				} catch (errTrm) {
					console.log("[samar/wompi/firma] TRM: " + errTrm);
				}
			}
			if (!trm && guardada) trm = guardada.v;
			if (!trm) return e.json(503, { message: "No pudimos consultar la tasa de cambio. Inténtalo de nuevo en unos minutos." });
			pesos = Math.round(anticipo * trm);
		}
		const centavos = pesos * 100;
		const referencia = codigo + "-" + Date.now().toString(36).toUpperCase();
		const firma = $security.sha256(referencia + String(centavos) + "COP" + INTEGRIDAD);

		// Cada intento de cobro queda en el historial interno: así la confirmación compara el valor exacto
		let historial = [];
		try {
			const h = JSON.parse(r.getString("historial") || "[]");
			if (Array.isArray(h)) historial = h;
		} catch (_) {}
		historial.push({
			estado: "Cobro Wompi",
			fecha: new Date().toISOString(),
			nota: "ref " + referencia + " · " + centavos + " centavos COP" + (moneda === "USD" ? " · anticipo US$" + anticipo + " · TRM " + trm : ""),
			publico: false,
		});
		r.set("historial", historial);
		e.app.save(r);

		return e.json(200, { llave_publica: LLAVE_PUBLICA, referencia: referencia, centavos: centavos, moneda: "COP", firma: firma, pesos: pesos, trm: trm });
	} catch (err) {
		console.log("[samar/wompi/firma] " + err);
		return e.json(500, { message: "No pudimos preparar el pago. Inténtalo de nuevo o escríbenos por WhatsApp." });
	}
});

routerAdd("POST", "/api/samar/wompi/verificar", (e) => {
	try {
		const b = e.requestInfo().body || {};
		const id = String(b.id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
		if (!id) return e.json(400, { message: "Falta el número de la transacción." });

		let tx = null;
		try {
			const res = $http.send({ url: "https://production.wompi.co/v1/transactions/" + id, method: "GET", timeout: 20 });
			let j = null;
			try {
				j = res.json;
			} catch (_) {}
			if (!j) {
				try {
					j = JSON.parse(toString(res.body));
				} catch (_) {}
			}
			if (res.statusCode === 200 && j && j.data) tx = j.data;
		} catch (errHttp) {
			console.log("[samar/wompi/verificar] consulta: " + errHttp);
		}
		if (!tx) return e.json(404, { message: "No encontramos ese pago en Wompi. Si ya pagaste, revisa en unos minutos." });

		const ref = String(tx.reference || "");
		const corte = ref.lastIndexOf("-");
		const codigo = corte > 0 ? ref.slice(0, corte) : "";
		let r;
		try {
			r = e.app.findFirstRecordByFilter("pedidos", "codigo = {:c}", { c: codigo });
		} catch (_) {
			return e.json(404, { message: "Ese pago no corresponde a un pedido de Samar." });
		}

		const estadoTx = String(tx.status || "");
		let pagado = r.getBool("anticipo_pagado");
		if (estadoTx === "APPROVED" && !pagado) {
			const fechaISO = new Date().toISOString();
			let historial = [];
			try {
				const h = JSON.parse(r.getString("historial") || "[]");
				if (Array.isArray(h)) historial = h;
			} catch (_) {}
			let esperado = 0;
			for (let i = 0; i < historial.length; i++) {
				const x = historial[i];
				const nota = String((x && x.nota) || "");
				if (x && x.estado === "Cobro Wompi" && nota.indexOf("ref " + ref + " ") === 0) {
					const mm = nota.match(/· (\d+) centavos COP/);
					if (mm) esperado = Number(mm[1]);
				}
			}
			if (!esperado && r.getString("moneda") !== "USD") esperado = Math.round(r.getFloat("anticipo")) * 100;
			const detalle = "Wompi " + String(tx.id || "") + " · " + String(tx.payment_method_type || "") + " · ref. " + ref + " · $" + Math.round(Number(tx.amount_in_cents || 0) / 100) + " COP";
			if (Number(tx.amount_in_cents) === esperado && String(tx.currency || "") === "COP") {
				r.set("anticipo_pagado", true);
				if (r.getString("estado") === "Recibido") r.set("estado", "Anticipo pagado");
				historial.push({ estado: "Anticipo pagado", fecha: fechaISO, nota: "Recibimos el pago del anticipo con Wompi. Empezamos tu pedido.", publico: true });
				historial.push({ estado: "Pago Wompi", fecha: fechaISO, nota: detalle, publico: false });
				pagado = true;
			} else {
				historial.push({ estado: "Pago Wompi por revisar", fecha: fechaISO, nota: "El valor pagado no coincide con el anticipo: " + detalle, publico: false });
			}
			r.set("historial", historial);
			e.app.save(r);
		}
		return e.json(200, { estado: estadoTx, codigo: r.getString("codigo"), anticipo_pagado: pagado });
	} catch (err) {
		console.log("[samar/wompi/verificar] " + err);
		return e.json(500, { message: "No pudimos confirmar el pago. Si ya pagaste, revisa en unos minutos o escríbenos por WhatsApp." });
	}
});

routerAdd("POST", "/api/samar/wompi/eventos", (e) => {
	try {
		const EVENTOS = "__WOMPI_EVT__";
		const b = e.requestInfo().body || {};
		const sig = b.signature || {};
		const props = Array.isArray(sig.properties) ? sig.properties : [];
		const data = b.data || {};
		let cadena = "";
		for (let i = 0; i < props.length; i++) {
			let v = data;
			const partes = String(props[i]).split(".");
			for (let k = 0; k < partes.length; k++) v = v === null || v === undefined ? undefined : v[partes[k]];
			cadena += v === null || v === undefined ? "" : String(v);
		}
		cadena += String(b.timestamp === undefined ? "" : b.timestamp) + EVENTOS;
		const calculado = String($security.sha256(cadena)).toLowerCase();
		if (!sig.checksum || calculado !== String(sig.checksum).toLowerCase()) {
			console.log("[samar/wompi/eventos] firma no válida");
			return e.json(401, { message: "Firma no válida." });
		}
		if (String(b.event || "") !== "transaction.updated") return e.json(200, { ok: true });

		const tx = data.transaction || {};
		const ref = String(tx.reference || "");
		const corte = ref.lastIndexOf("-");
		const codigo = corte > 0 ? ref.slice(0, corte) : "";
		let r;
		try {
			r = e.app.findFirstRecordByFilter("pedidos", "codigo = {:c}", { c: codigo });
		} catch (_) {
			return e.json(200, { ok: true, ignorado: "sin pedido" });
		}
		if (String(tx.status || "") !== "APPROVED" || r.getBool("anticipo_pagado")) return e.json(200, { ok: true });

		const fechaISO = new Date().toISOString();
		let historial = [];
		try {
			const h = JSON.parse(r.getString("historial") || "[]");
			if (Array.isArray(h)) historial = h;
		} catch (_) {}
		let esperado = 0;
		for (let i = 0; i < historial.length; i++) {
			const x = historial[i];
			const nota = String((x && x.nota) || "");
			if (x && x.estado === "Cobro Wompi" && nota.indexOf("ref " + ref + " ") === 0) {
				const mm = nota.match(/· (\d+) centavos COP/);
				if (mm) esperado = Number(mm[1]);
			}
		}
		if (!esperado && r.getString("moneda") !== "USD") esperado = Math.round(r.getFloat("anticipo")) * 100;
		const detalle = "Wompi " + String(tx.id || "") + " · " + String(tx.payment_method_type || "") + " · ref. " + ref + " · $" + Math.round(Number(tx.amount_in_cents || 0) / 100) + " COP";
		if (Number(tx.amount_in_cents) === esperado && String(tx.currency || "") === "COP") {
			r.set("anticipo_pagado", true);
			if (r.getString("estado") === "Recibido") r.set("estado", "Anticipo pagado");
			historial.push({ estado: "Anticipo pagado", fecha: fechaISO, nota: "Recibimos el pago del anticipo con Wompi. Empezamos tu pedido.", publico: true });
			historial.push({ estado: "Pago Wompi", fecha: fechaISO, nota: detalle, publico: false });
		} else {
			historial.push({ estado: "Pago Wompi por revisar", fecha: fechaISO, nota: "El valor pagado no coincide con el anticipo: " + detalle, publico: false });
		}
		r.set("historial", historial);
		e.app.save(r);
		return e.json(200, { ok: true });
	} catch (err) {
		console.log("[samar/wompi/eventos] " + err);
		return e.json(500, { message: "Error" });
	}
});


// País de la visita (para mostrar precios en dólares en Estados Unidos). Si el proxy no envía el país,
// responde vacío y la página usa la zona horaria del navegador.
routerAdd("GET", "/api/samar/region", (e) => {
	try {
		const h = (n) => {
			try {
				return String(e.request.header.get(n) || "");
			} catch (_) {
				return "";
			}
		};
		const pais = (h("CF-IPCountry") || h("X-Country-Code") || h("X-Geo-Country") || h("CloudFront-Viewer-Country") || h("X-Vercel-IP-Country") || h("X-Hcdn-Country") || h("X-Country")).toUpperCase().slice(0, 2);
		let dbg = null;
		try {
			if (e.request.url.query().get("debug") === "1") {
				dbg = { claves: Object.keys(e.request.header || {}), num: {} };
				const col = e.app.findCollectionByNameOrId("pedidos");
				["total", "precio_unitario", "anticipo", "saldo"].forEach((k) => {
					const f = col.fields.getByName(k);
					dbg.num[k] = f ? String(f.type()) + (f.onlyInt ? ":int" : ":dec") : "no";
				});
			}
		} catch (errDbg) {
			dbg = { err: String(errDbg) };
		}
		return e.json(200, dbg ? { pais: pais, dbg: dbg } : { pais: pais });
	} catch (err) {
		return e.json(200, { pais: "" });
	}
});

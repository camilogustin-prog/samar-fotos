// Construye el parche del hook samar-pedidos.pb.js (sin secretos).
// Cada cambio: { find: texto exacto (se compara ignorando diferencias de espacios), replace, count }.
import fs from 'node:fs';

const helper = fs.readFileSync(new URL('./correo-helper.js', import.meta.url), 'utf8');
const finalBlock = fs.readFileSync(new URL('./hook-final.js', import.meta.url), 'utf8').split('/*__CORREO__*/\n').join(helper);

const ENTREGA = `// --- lugar de entrega (obligatorio): define la moneda y el envío
		const entregaIn = b.entrega && typeof b.entrega === "object" ? b.entrega : {};
		const paisEntrega = String(entregaIn.pais || "").toUpperCase();
		if (paisEntrega !== "CO" && paisEntrega !== "US") {
			return e.json(400, { message: "Elige dónde se entregan las sandalias: Colombia o Estados Unidos." });
		}
		const moneda = paisEntrega === "US" ? "USD" : "COP";
		const sinTilde = (s) =>
			String(s || "")
				.toLowerCase()
				.replace(/[áàä]/g, "a")
				.replace(/[éèë]/g, "e")
				.replace(/[íìï]/g, "i")
				.replace(/[óòö]/g, "o")
				.replace(/[úùü]/g, "u")
				.replace(/ñ/g, "n")
				.replace(/[^a-z0-9 ]/g, " ")
				.replace(/\\s+/g, " ")
				.trim();
		// Deben coincidir con DEPARTAMENTOS_CO y ESTADOS_US en samar-kit.tsx
		const DEPARTAMENTOS = ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"];
		const ESTADOS_US = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
		const entrega = { pais: paisEntrega };
		entrega.ciudad = txt(entregaIn.ciudad, 80);
		entrega.direccion = txt(entregaIn.direccion, 160);
		entrega.recibe = txt(entregaIn.recibe, 80);
		let zona = 0;
		if (paisEntrega === "CO") {
			entrega.departamento = txt(entregaIn.departamento, 60);
			entrega.barrio = txt(entregaIn.barrio, 80);
			if (DEPARTAMENTOS.indexOf(entrega.departamento) < 0) return e.json(400, { message: "Elige el departamento de entrega." });
			if (entrega.ciudad.length < 2) return e.json(400, { message: "Escribe la ciudad o municipio de entrega." });
			if (entrega.direccion.length < 6) return e.json(400, { message: "Escribe la dirección de entrega completa." });
			const dd = sinTilde(entrega.departamento);
			const cc = sinTilde(entrega.ciudad);
			if (dd.indexOf("san andres") === 0) zona = 5;
			else if (dd === "valle del cauca" && ["cali", "santiago de cali", "jamundi", "yumbo", "palmira", "candelaria"].indexOf(cc) >= 0) zona = 1;
			else if (["valle del cauca", "risaralda", "quindio", "caldas"].indexOf(dd) >= 0) zona = 2;
			else if (dd === "bogota d c" || ["bogota", "medellin", "barranquilla", "cartagena", "cartagena de indias", "bucaramanga", "santa marta"].indexOf(cc) >= 0) zona = 3;
			else zona = 4;
			if (zona === 5) return e.json(400, { message: "Para San Andrés y Providencia cotizamos el envío por WhatsApp. Escríbenos y te ayudamos." });
		} else {
			entrega.estado = txt(entregaIn.estado, 2).toUpperCase();
			entrega.codigo_postal = txt(entregaIn.codigo_postal, 10);
			if (ESTADOS_US.indexOf(entrega.estado) < 0) return e.json(400, { message: "Elige el estado de Estados Unidos." });
			if (entrega.estado === "AK" || entrega.estado === "HI") return e.json(400, { message: "Para Alaska y Hawái cotizamos el envío por WhatsApp. Escríbenos y te ayudamos." });
			if (entrega.ciudad.length < 2) return e.json(400, { message: "Escribe la ciudad de entrega." });
			if (!/^\\d{5}$/.test(entrega.codigo_postal)) return e.json(400, { message: "Escribe el código postal (ZIP) de 5 dígitos." });
			if (entrega.direccion.length < 6) return e.json(400, { message: "Escribe la dirección de entrega completa." });
		}
		if (!(entregaIn.confirma === true || entregaIn.confirma === "true")) {
			return e.json(400, { message: "Confirma que la dirección de entrega es correcta." });
		}
		entrega.zona = zona;`;

const TOTAL = `const subtotal = Math.round(pares * precio * 100) / 100;
		// Envío dentro de Colombia por zona, en pesos (debe coincidir con ENVIO_CO en samar-kit.tsx).
		// null = todavía sin valor: el envío se confirma por WhatsApp. En Estados Unidos va incluido en el precio.
		const ENVIO_CO = { 1: null, 2: null, 3: null, 4: null };
		const PARES_POR_CAJA = 0; // 0 = valor por pedido; si es mayor, se cobra por cada caja
		let envio = 0;
		if (paisEntrega === "CO") {
			const v = ENVIO_CO[zona];
			if (typeof v === "number") envio = PARES_POR_CAJA > 0 ? v * Math.ceil(pares / PARES_POR_CAJA) : v;
			else entrega.envio_por_confirmar = true;
		}
		entrega.envio = envio;
		const total = Math.round((subtotal + envio) * 100) / 100;`;

const DIRECCION = `const direccion =
			paisEntrega === "US"
				? entrega.direccion + " · " + entrega.ciudad + ", " + entrega.estado + " " + entrega.codigo_postal + (entrega.recibe ? " · Recibe: " + entrega.recibe : "")
				: entrega.direccion + (entrega.barrio ? ", barrio " + entrega.barrio : "") + " · " + entrega.ciudad + ", " + entrega.departamento + (entrega.recibe ? " · Recibe: " + entrega.recibe : "");`;

const ANTES_CODIGO = `// --- fecha del evento: tiempo suficiente para producir y entregar
		const fechaEv = txt(b.fecha_evento, 20);
		const DIAS_MIN = moneda === "USD" ? 30 : 20;
		const mFecha = fechaEv.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
		if (mFecha) {
			const diaEv = Date.UTC(Number(mFecha[1]), Number(mFecha[2]) - 1, Number(mFecha[3]), 17, 0, 0);
			const dias = Math.floor((diaEv - ahora) / 86400000);
			if (dias < DIAS_MIN) {
				return e.json(400, { message: "Tu evento es en " + Math.max(dias, 0) + " días y necesitamos al menos " + DIAS_MIN + " para producir y entregar. Escríbenos por WhatsApp y miramos si alcanzamos.", codigo_error: "fecha" });
			}
		}

		// --- un solo pedido sin pagar por cliente (se puede reemplazar)
		const reemplazar = b.reemplazar === true || b.reemplazar === "true";
		let pendientes = [];
		try {
			pendientes = e.app.findRecordsByFilter("pedidos", "usuario = {:u} && anticipo_pagado = false && (estado = 'Esperando anticipo' || estado = 'Recibido')", "-created", 10, 0, { u: e.auth.id });
		} catch (_) {
			pendientes = [];
		}
		pendientes = pendientes.filter((p) => !p.getString("comprobante"));
		if (pendientes.length && !reemplazar) {
			return e.json(409, { message: "Ya tienes el pedido " + pendientes[0].getString("codigo") + " sin pagar. Págalo o reemplázalo por este.", codigo_pendiente: pendientes[0].getString("codigo") });
		}
		const venceISO = new Date(ahora + 48 * 3600 * 1000).toISOString();
		const MESES_V = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
		const vCO = new Date(Date.parse(venceISO) - 5 * 3600 * 1000);
		const venceTexto = vCO.getUTCDate() + " de " + MESES_V[vCO.getUTCMonth()] + ", " + (vCO.getUTCHours() % 12 || 12) + ":" + String(vCO.getUTCMinutes()).padStart(2, "0") + " " + (vCO.getUTCHours() >= 12 ? "p. m." : "a. m.");

		// --- código consecutivo del mes`;

const REEMPLAZADOS = `if (reemplazar && pendientes.length) {
			pendientes.forEach((p) => {
				try {
					let hp = [];
					try {
						const h0 = JSON.parse(p.getString("historial") || "[]");
						if (Array.isArray(h0)) hp = h0;
					} catch (_) {}
					hp.push({ estado: "Cancelado", fecha: new Date().toISOString(), nota: "Reemplazado por el pedido " + guardado.getString("codigo") + ".", publico: true });
					p.set("estado", "Cancelado");
					p.set("historial", hp);
					e.app.save(p);
				} catch (errR) {
					console.log("[samar/pedidos] reemplazo: " + errR);
				}
			});
		}

		return e.json(200, {
			codigo: guardado.getString("codigo"),`;

const changes = [
	{ find: 'const moneda = String(b.moneda || "").toUpperCase() === "USD" ? "USD" : "COP";', replace: ENTREGA, count: 1 },
	{ find: 'const total = Math.round(pares * precio * 100) / 100;', replace: TOTAL, count: 1 },
	{
		find: 'const direccion = txt(b.direccion_envio, 400); if (moneda === "USD" && direccion.length < 10) { return e.json(400, { message: "Escribe la dirección de envío en Estados Unidos." }); }',
		replace: DIRECCION,
		count: 1,
	},
	{ find: '// --- código consecutivo del mes', replace: ANTES_CODIGO, count: 1 },
	{ find: 'r.set("ciudad", txt(b.ciudad, 80));', replace: 'r.set("ciudad", entrega.ciudad);', count: 1 },
	{
		find: 'r.set("estado", "Recibido");',
		replace: 'r.set("estado", "Esperando anticipo");\n\t\t\tr.set("vence_en", venceISO);\n\t\t\tr.set("entrega", entrega);\n\t\t\tr.set("envio", envio);',
		count: 1,
	},
	{
		find: 'r.set("historial", [{ estado: "Recibido", fecha: fechaISO, nota: comprobante.length ? "Pedido recibido con el comprobante del anticipo. Lo estamos revisando." : "Pedido recibido. Falta el pago del anticipo con Wompi.", publico: true }]);',
		replace: 'r.set("historial", [{ estado: "Esperando anticipo", fecha: fechaISO, nota: "Pedido creado. Paga el anticipo del 50% con Wompi antes del " + venceTexto + " (hora de Colombia); si no, el pedido vence y tu diseño queda guardado.", publico: true }]);',
		count: 1,
	},
	{ find: 'return e.json(200, { codigo: guardado.getString("codigo"),', replace: REEMPLAZADOS, count: 1 },
	{ find: 'moneda: moneda,', replace: 'moneda: moneda,\n\t\t\tvence_en: venceISO,\n\t\t\tenvio: envio,\n\t\t\tsubtotal: subtotal,', count: 1 },
	{
		find: 'if (r.getString("estado") === "Cancelado") return e.json(409, { message: "Este pedido está cancelado." });',
		replace:
			'if (r.getString("estado") === "Cancelado") return e.json(409, { message: "Este pedido está cancelado." });\n\t\tconst venceF = r.getString("vence_en");\n\t\tif (r.getString("estado") === "Vencido" || (venceF && venceF < new Date().toISOString())) {\n\t\t\treturn e.json(409, { message: "Este pedido venció porque no se pagó el anticipo a tiempo. Tu diseño sigue guardado: vuelve a hacer el pedido o escríbenos por WhatsApp." });\n\t\t}',
		count: 1,
	},
	{
		find: 'if (r.getString("estado") === "Recibido") r.set("estado", "Anticipo pagado");',
		replace: 'if (["Recibido", "Esperando anticipo", "Vencido"].indexOf(r.getString("estado")) >= 0) r.set("estado", "Anticipo pagado");',
		count: 2,
	},
	{
		find: 'moneda: r.getString("moneda") || "COP",',
		replace: 'moneda: r.getString("moneda") || "COP",\n\t\t\t\tvence_en: r.getString("vence_en"),\n\t\t\t\tenvio: r.getFloat("envio"),',
		count: 2,
	},
	{
		find: 'comprobante_enviado: !!r.getString("comprobante"),',
		replace:
			'comprobante_enviado: !!r.getString("comprobante"),\n\t\t\t\tentrega: (() => {\n\t\t\t\t\ttry {\n\t\t\t\t\t\treturn JSON.parse(r.getString("entrega") || "null");\n\t\t\t\t\t} catch (_) {\n\t\t\t\t\t\treturn null;\n\t\t\t\t\t}\n\t\t\t\t})(),\n\t\t\t\tdireccion_envio: r.getString("direccion_envio"),',
		count: 1,
	},
];

const patch = { version: 1, changes, cutFrom: '// DIAGNÓSTICO TEMPORAL', append: finalBlock };
fs.writeFileSync(new URL('../samar-fotos/_codigo/seguimiento/hook-parche.json', import.meta.url), JSON.stringify(patch));
console.log('changes', changes.length, 'append chars', finalBlock.length);

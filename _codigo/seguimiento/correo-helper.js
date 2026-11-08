		// --- correo (este bloque se repite en cada manejador porque en PocketBase cada uno corre aislado)
		const SITIO = "https://samarpadridin.live";
		const AVISOS = "hello@samarpadridin.com"; // a dónde llegan los avisos para el equipo Samar
		const WHATSAPP_SAMAR = "573165379169";
		const esc = (s) => String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
		const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
		const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
		const fechaCO = (iso) => {
			const t = Date.parse(String(iso || ""));
			if (isNaN(t)) return "";
			const c = new Date(t - 5 * 3600 * 1000);
			let h = c.getUTCHours();
			const ap = h >= 12 ? "p. m." : "a. m.";
			h = h % 12 || 12;
			return DIAS[c.getUTCDay()] + " " + c.getUTCDate() + " de " + MESES[c.getUTCMonth()] + ", " + h + ":" + String(c.getUTCMinutes()).padStart(2, "0") + " " + ap;
		};
		const diaCO = (ymd) => {
			const m = String(ymd || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
			return m ? Number(m[3]) + " de " + MESES[Number(m[2]) - 1] + " de " + m[1] : "";
		};
		const dinero = (n, mon) => {
			const v = Number(n) || 0;
			if (mon === "USD") return "US$" + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return "$" + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		};
		const plantilla = (titulo, parrafos, filas, boton) => {
			let h = '<div style="background:#f4f1fb;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1d1730">';
			h += '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e0f5">';
			h += '<div style="background:#3d0097;color:#ffffff;padding:18px 24px;font-size:22px;letter-spacing:4px;font-weight:bold">SAMAR</div>';
			h += '<div style="padding:24px">';
			h += '<h1 style="font-size:20px;line-height:1.3;margin:0 0 14px">' + esc(titulo) + "</h1>";
			(parrafos || []).forEach((p) => {
				h += '<p style="font-size:15px;line-height:1.55;margin:0 0 12px">' + p + "</p>";
			});
			if (filas && filas.length) {
				h += '<table style="width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px">';
				filas.forEach((f) => {
					h += '<tr><td style="padding:7px 0;border-bottom:1px solid #eee;color:#6b6480">' + esc(f[0]) + '</td><td style="padding:7px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold">' + esc(f[1]) + "</td></tr>";
				});
				h += "</table>";
			}
			if (boton) {
				h += '<p style="margin:18px 0 6px"><a href="' + esc(boton.url) + '" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:bold;font-size:15px">' + esc(boton.texto) + "</a></p>";
			}
			h += "</div>";
			h += '<div style="padding:14px 24px;background:#faf9fd;color:#6b6480;font-size:12px;line-height:1.5">Samar Padridin · sandalias personalizadas · Cali, Colombia<br>¿Dudas? Escríbenos por WhatsApp: <a href="https://wa.me/' + WHATSAPP_SAMAR + '" style="color:#3d0097">+57 316 5379169</a></div>';
			h += "</div></div>";
			return h;
		};
		const enviar = (para, asunto, html) => {
			try {
				const s = $app.settings();
				if (!para || String(para).indexOf("@") < 1) return false; // usa el correo que dé la plataforma (SMTP o el del sistema)
				const msg = new MailerMessage({
					from: { address: s.meta.senderAddress, name: "Samar Padridin" },
					to: [{ address: String(para) }],
					subject: asunto,
					html: html,
				});
				$app.newMailClient().send(msg);
				return true;
			} catch (errMail) {
				console.log("[samar/correo] " + asunto + ": " + errMail);
				return false;
			}
		};
		const datosPedido = (r) => {
			const mon = r.getString("moneda") === "USD" ? "USD" : "COP";
			let entrega = null;
			try {
				entrega = JSON.parse(r.getString("entrega") || "null");
			} catch (_) {}
			const envio = r.getFloat("envio");
			const filas = [
				["Pedido", r.getString("codigo")],
				["Evento", r.getString("tipo_evento") + (r.getString("fecha_evento") ? " · " + diaCO(r.getString("fecha_evento")) : "")],
				["Pares", String(r.getInt("total_pares"))],
				["Precio por par", dinero(r.getFloat("precio_unitario"), mon)],
			];
			if (mon === "USD") filas.push(["Envío a Estados Unidos", "Incluido"]);
			else if (envio > 0) filas.push(["Envío", dinero(envio, mon)]);
			else if (entrega && entrega.envio_por_confirmar) filas.push(["Envío", "Lo confirmamos por WhatsApp"]);
			filas.push(["Total", dinero(r.getFloat("total"), mon)]);
			filas.push(["Anticipo 50%", dinero(r.getFloat("anticipo"), mon) + (r.getBool("anticipo_pagado") ? " (pagado)" : "")]);
			if (r.getString("direccion_envio")) filas.push(["Entrega", r.getString("direccion_envio")]);
			return { mon: mon, filas: filas, nombre: (r.getString("nombre") || "").split(" ")[0] };
		};
		const contactoLinks = (r) => {
			const tel = r.getString("whatsapp").replace(/\D/g, "");
			const partes = [];
			if (tel) partes.push('<a href="https://wa.me/' + tel + '">WhatsApp</a>');
			if (tel) partes.push('<a href="sms:+' + tel + '">iMessage / SMS</a>');
			if (r.getString("correo")) partes.push('<a href="mailto:' + esc(r.getString("correo")) + '">' + esc(r.getString("correo")) + "</a>");
			return esc(r.getString("nombre")) + " · " + esc(r.getString("whatsapp")) + " (prefiere " + esc(r.getString("contacto_preferido") || "WhatsApp") + ")<br>" + partes.join(" · ");
		};
		// Correo al cliente según lo que pasó con su pedido
		const correoCliente = (r, tipo) => {
			const d = datosPedido(r);
			const cod = r.getString("codigo");
			const para = r.getString("correo");
			const hola = "Hola " + esc(d.nombre) + ",";
			const cuenta = { texto: "Ver mi pedido", url: SITIO + "/mi-cuenta?tab=pedidos" };
			if (tipo === "Esperando anticipo") {
				const vence = fechaCO(r.getString("vence_en"));
				return enviar(para, "Tu pedido " + cod + ": paga el anticipo antes del " + vence, plantilla("Tu pedido está casi listo", [hola, "Recibimos tu pedido <b>" + esc(cod) + "</b>. Para empezar, paga el anticipo de <b>" + esc(dinero(r.getFloat("anticipo"), d.mon)) + "</b> con Wompi (tarjeta, PSE, Nequi, Daviplata o Bancolombia).", "Tienes hasta el <b>" + esc(vence) + "</b> (hora de Colombia). Si no se paga a tiempo, el pedido vence, pero tu diseño queda guardado en tu cuenta."], d.filas, { texto: "Pagar el anticipo", url: SITIO + "/mi-cuenta?tab=pedidos" }));
			}
			if (tipo === "Recordatorio") {
				const vence = fechaCO(r.getString("vence_en"));
				return enviar(para, "Te quedan menos de 24 horas para pagar tu pedido " + cod, plantilla("Tu pedido vence pronto", [hola, "Tu pedido <b>" + esc(cod) + "</b> sigue esperando el anticipo de <b>" + esc(dinero(r.getFloat("anticipo"), d.mon)) + "</b>.", "Págalo antes del <b>" + esc(vence) + "</b> para que empecemos tu arte. Si necesitas más tiempo o tienes dudas, respóndenos por WhatsApp."], d.filas, { texto: "Pagar el anticipo", url: SITIO + "/mi-cuenta?tab=pedidos" }));
			}
			if (tipo === "Vencido") {
				return enviar(para, "Tu pedido " + cod + " venció", plantilla("Tu pedido venció", [hola, "El plazo para pagar el anticipo del pedido <b>" + esc(cod) + "</b> terminó y el pedido quedó vencido.", "Tu diseño sigue guardado en tu cuenta: puedes volver a hacer el pedido cuando quieras. Si ya pagaste o necesitas ayuda, escríbenos por WhatsApp."], null, { texto: "Ver mis diseños", url: SITIO + "/mi-cuenta?tab=disenos" }));
			}
			if (tipo === "Pagado") {
				return enviar(para, "Recibimos tu anticipo: empezamos tu pedido " + cod, plantilla("¡Anticipo recibido!", [hola, "Confirmamos el pago del anticipo de tu pedido <b>" + esc(cod) + "</b>. Ya empezamos.", "Lo que sigue: en unos 5 días te enviamos el arte para que lo apruebes en tu cuenta o pidas ajustes (2 incluidos). Con el arte aprobado, tus sandalias quedan listas en unos 15 días."], d.filas, cuenta));
			}
			const MENSAJES = {
				"Arte en diseño": ["Estamos diseñando tu arte", "Nuestro equipo está preparando el arte final del pedido <b>" + esc(cod) + "</b>. Te avisamos apenas esté listo para que lo apruebes."],
				"Arte enviado al cliente": ["Tu arte está listo para aprobar", "El arte del pedido <b>" + esc(cod) + "</b> está listo. Entra a tu cuenta para verlo y aprobarlo o pedir cambios."],
				"Arte aprobado": ["Arte aprobado: vamos a producción", "Aprobaste el arte del pedido <b>" + esc(cod) + "</b>. Tus sandalias pasan a producción."],
				"En producción": ["Tus sandalias están en producción", "Estamos fabricando las sandalias del pedido <b>" + esc(cod) + "</b>."],
				"Listo para entrega": ["Tu pedido está listo", "Las sandalias del pedido <b>" + esc(cod) + "</b> están listas. Te escribimos para coordinar la entrega" + (r.getBool("saldo_pagado") ? "." : " y el pago del saldo de <b>" + esc(dinero(r.getFloat("saldo"), d.mon)) + "</b>.")],
				Entregado: ["Gracias por celebrar con Samar", "Entregamos tu pedido <b>" + esc(cod) + "</b>. Esperamos que disfruten la fiesta. Si nos mandas fotos del evento por WhatsApp, nos encantará verlas."],
				Cancelado: ["Tu pedido fue cancelado", "El pedido <b>" + esc(cod) + "</b> quedó cancelado. Si tienes dudas, escríbenos por WhatsApp."],
			};
			const m = MENSAJES[tipo];
			if (!m) return false;
			return enviar(para, m[0] + " · " + cod, plantilla(m[0], [hola, m[1]], null, cuenta));
		};
		// Aviso para el equipo Samar
		const avisoEquipo = (r, tipo) => {
			const d = datosPedido(r);
			const cod = r.getString("codigo");
			const panel = { texto: "Abrir el panel", url: SITIO + "/admin" };
			const T = {
				Nuevo: ["Nuevo pedido " + cod + " · " + r.getInt("total_pares") + " pares · " + dinero(r.getFloat("total"), d.mon) + " (sin pagar)", "Nuevo pedido sin pagar. Vence el " + esc(fechaCO(r.getString("vence_en"))) + "."],
				Pagado: ["Anticipo pagado · " + cod + " · " + dinero(r.getFloat("anticipo"), d.mon), "El cliente pagó el anticipo con Wompi. El pedido pasa a Anticipo pagado."],
				Vencido: ["Pedido vencido sin pagar · " + cod, "Este pedido venció sin pagar el anticipo. Puedes escribirle o extender el plazo desde el panel (pestaña Seguimiento)."],
				Cambios: ["El cliente pidió cambios al arte · " + cod, "Comentario del cliente: " + esc(r.getString("comentario_cliente"))],
			};
			const t = T[tipo];
			if (!t) return false;
			return enviar(AVISOS, "[Samar] " + t[0], plantilla(t[0], [t[1], "Cliente: " + contactoLinks(r)], d.filas, panel));
		};
		// --- fin del bloque de correo

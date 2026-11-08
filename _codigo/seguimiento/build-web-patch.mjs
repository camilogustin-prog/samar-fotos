// Parches de las páginas (sin secretos). find se compara ignorando diferencias de espacios.
import fs from 'node:fs';
const rd = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8');

// ---------------- disenar.tsx ----------------
const BLOQUE_ENTREGA = `// Lugar de entrega obligatorio: define la moneda, el envío y la dirección del pedido
	const bloqueEntrega = (
		<div className="dz-group">
			{aviso('e-pais')}
			<p className="dz-lbl" id="e-pais" tabIndex={-1}>
				¿Dónde se entregan las sandalias?
			</p>
			<div className="dz-chips">
				<button
					type="button"
					className="dz-chip"
					aria-pressed={entrega.pais === 'CO'}
					onClick={() => {
						setE('pais', 'CO');
						setMoneda('COP');
						if (!form.phone.trim()) setF('pais', '+57');
					}}
				>
					En Colombia · pesos
				</button>
				<button
					type="button"
					className="dz-chip"
					aria-pressed={entrega.pais === 'US'}
					onClick={() => {
						setE('pais', 'US');
						setMoneda('USD');
					}}
				>
					En Estados Unidos · dólares
				</button>
			</div>
			{!entrega.pais ? (
				<p className="dz-hint">
					{moneda === 'USD' ? 'Parece que estás en Estados Unidos. ' : ''}Elige dónde las vas a recibir: con eso calculamos el precio y el envío. Si celebras en Colombia, elige Colombia aunque vivas en otro país.
				</p>
			) : null}
			{entrega.pais === 'CO' ? (
				<>
					<div className="dz-two" style={{ marginTop: 12 }}>
						<div>
							{aviso('e-dep')}
							<label className="dz-lbl" htmlFor="e-dep">
								Departamento
							</label>
							<select
								id="e-dep"
								className="sm-in"
								value={entrega.departamento}
								onChange={(ev) => {
									const dep = ev.target.value;
									setEntrega((x) => ({ ...x, departamento: dep, ciudad: dep === 'Bogotá D.C.' ? 'Bogotá' : x.ciudad, confirma: false }));
								}}
							>
								<option value="">Elige el departamento</option>
								{DEPARTAMENTOS_CO.map((dd) => (
									<option key={dd} value={dd}>
										{dd}
									</option>
								))}
							</select>
						</div>
						<div>
							{aviso('e-ciudad')}
							<label className="dz-lbl" htmlFor="e-ciudad">
								Ciudad o municipio
							</label>
							<input id="e-ciudad" className="sm-in" list="e-ciudades" value={entrega.ciudad} onChange={(ev) => setE('ciudad', ev.target.value)} placeholder="Cali" autoComplete="address-level2" />
							<datalist id="e-ciudades">
								{CIUDADES_CO.map((cc) => (
									<option key={cc} value={cc} />
								))}
							</datalist>
						</div>
					</div>
					{aviso('e-dir')}
					<label className="dz-lbl" htmlFor="e-dir" style={{ marginTop: 10 }}>
						Dirección de entrega
					</label>
					<input id="e-dir" className="sm-in" value={entrega.direccion} onChange={(ev) => setE('direccion', ev.target.value)} placeholder="Calle 5 # 38-25, apto 301" autoComplete="street-address" />
					<label className="dz-lbl" htmlFor="e-barrio" style={{ marginTop: 10 }}>
						Barrio <span className="dz-count">opcional</span>
					</label>
					<input id="e-barrio" className="sm-in" value={entrega.barrio} onChange={(ev) => setE('barrio', ev.target.value)} placeholder="San Fernando" />
				</>
			) : null}
			{entrega.pais === 'US' ? (
				<>
					<div className="dz-two" style={{ marginTop: 12 }}>
						<div>
							{aviso('e-estado')}
							<label className="dz-lbl" htmlFor="e-estado">
								Estado
							</label>
							<select id="e-estado" className="sm-in" value={entrega.estado} onChange={(ev) => setE('estado', ev.target.value)}>
								<option value="">Elige el estado</option>
								{ESTADOS_US.map((s) => (
									<option key={s[0]} value={s[0]}>
										{s[1]}
									</option>
								))}
							</select>
						</div>
						<div>
							{aviso('e-zip')}
							<label className="dz-lbl" htmlFor="e-zip">
								Código postal (ZIP)
							</label>
							<input id="e-zip" className="sm-in" inputMode="numeric" maxLength={5} value={entrega.codigo_postal} onChange={(ev) => setE('codigo_postal', ev.target.value.replace(/\\D/g, '').slice(0, 5))} placeholder="33101" autoComplete="postal-code" />
						</div>
					</div>
					{aviso('e-ciudad')}
					<label className="dz-lbl" htmlFor="e-ciudad" style={{ marginTop: 10 }}>
						Ciudad
					</label>
					<input id="e-ciudad" className="sm-in" value={entrega.ciudad} onChange={(ev) => setE('ciudad', ev.target.value)} placeholder="Miami" autoComplete="address-level2" />
					{aviso('e-dir')}
					<label className="dz-lbl" htmlFor="e-dir" style={{ marginTop: 10 }}>
						Dirección de entrega
					</label>
					<input id="e-dir" className="sm-in" value={entrega.direccion} onChange={(ev) => setE('direccion', ev.target.value)} placeholder="123 Main St, Apt 4B" autoComplete="street-address" />
				</>
			) : null}
			{entrega.pais ? (
				<>
					<p className="dz-hint" style={{ marginTop: 10 }}>
						{envioInfo.etiqueta}: <b>{envioInfo.texto}</b>
						{entrega.pais === 'US' ? ' · Tallas americanas 5.5 a 10.5.' : ''}
					</p>
					{aviso('e-confirma')}
					<label className="dz-check">
						<input id="e-confirma" type="checkbox" checked={entrega.confirma} onChange={(ev) => setE('confirma', ev.target.checked)} />
						<span>Confirmo que la dirección de entrega es correcta.</span>
					</label>
				</>
			) : null}
		</div>
	);

	`;

const PENDIENTE_BOX = `{pendiente ? (
					<div className="dz-group" role="alert" style={{ border: '1px solid #e0d6f5', borderRadius: 12, padding: 14, background: '#faf7ff' }}>
						<p style={{ margin: '0 0 10px' }}>
							Ya tienes el pedido <b>{pendiente}</b> sin pagar. ¿Qué quieres hacer?
						</p>
						<div className="dz-chips">
							<button
								type="button"
								className="sm-btn sm-btn-p sm-btn-sm"
								onClick={() => {
									const c = pendiente;
									setPendiente('');
									pagarConWompi(c, { email: user ? user.email : '', name: user ? user.name : '' }).catch((e) => setErr(errMsg(e, 'No pudimos abrir el pago de Wompi. Inténtalo de nuevo.')));
								}}
							>
								Pagar el pedido {pendiente}
							</button>
							<button
								type="button"
								className="sm-btn sm-btn-o sm-btn-sm"
								onClick={() => {
									setPendiente('');
									makeOrder(true);
								}}
							>
								Reemplazarlo por este
							</button>
						</div>
					</div>
				) : null}
				<div className="dz-review">`;

const disenar = [
	{
		find: "const [form, setForm] = useState({ event: 'XV años', phone: '', city: '', notes: '', pais: '+57', contacto: 'WhatsApp', direccion: '' });",
		replace:
			"const [form, setForm] = useState({ event: 'XV años', phone: '', city: '', notes: '', pais: '+57', contacto: 'WhatsApp', direccion: '' });\n\t// Lugar de entrega: obligatorio y confirmado por el cliente (cambiar un dato pide confirmar de nuevo)\n\tconst [entrega, setEntrega] = useState<Entrega>(ENTREGA_VACIA);\n\tconst setE = (k: keyof Entrega, v: string | boolean) => setEntrega((x) => ({ ...x, [k]: v, ...(k !== 'confirma' ? { confirma: false } : {}) }));\n\tconst [pendiente, setPendiente] = useState('');",
		count: 1,
	},
	{
		find: 'useMoneda,',
		replace: 'useMoneda,\n\tDEPARTAMENTOS_CO,\n\tCIUDADES_CO,\n\tENTREGA_VACIA,\n\tESTADOS_US,\n\tcalcEnvio,\n\tdiasHasta,\n\tfaltaEntrega,\n\tfmtVence,\n\tresumenEntrega,\n\ttype Entrega,',
		count: 1,
	},
	{ find: "onClick={() => setMoneda('COP')}", replace: "onClick={() => {\n\t\t\t\t\t\tsetMoneda('COP');\n\t\t\t\t\t\tsetE('pais', 'CO');\n\t\t\t\t\t}}", count: 1 },
	{ find: "onClick={() => setMoneda('USD')}", replace: "onClick={() => {\n\t\t\t\t\t\tsetMoneda('USD');\n\t\t\t\t\t\tsetE('pais', 'US');\n\t\t\t\t\t}}", count: 1 },
	{
		find: 'const total = Math.round(pairs * unit * 100) / 100;',
		replace: 'const subtotal = Math.round(pairs * unit * 100) / 100;\n\tconst envioInfo = calcEnvio(entrega, pairs, moneda);\n\tconst total = Math.round((subtotal + envioInfo.valor) * 100) / 100;',
		count: 1,
	},
	{ find: 'nextTier.min * nextTier.price <= total', replace: 'nextTier.min * nextTier.price <= subtotal', count: 1 },
	{ find: 'const faltaParaPagar = ()', replace: BLOQUE_ENTREGA + 'const faltaParaPagar = ()', count: 1 },
	{
		find: "if (moneda === 'USD' && (form.direccion || '').trim().length < 10) return { t: 'Escribe la dirección de envío en Estados Unidos (el envío está incluido).', paso: 4, campo: 'o-dir' };",
		replace:
			"const fe = faltaEntrega(entrega);\n\t\tif (fe) return { t: fe.t, paso: 4, campo: fe.campo };\n\t\tif (d.date) {\n\t\t\tconst dias = diasHasta(d.date);\n\t\t\tconst minDias = entrega.pais === 'US' ? 30 : 20;\n\t\t\tif (dias < minDias) return { t: 'Tu evento es en ' + Math.max(dias, 0) + ' días y necesitamos al menos ' + minDias + ' para producir y entregar. Escríbenos por WhatsApp y miramos si alcanzamos.', paso: 4, campo: 'e-pais' };\n\t\t}",
		count: 1,
	},
	{ find: '{step === 4 ? ( <> {selectorEntrega}', replace: '{step === 4 ? (\n\t\t\t\t\t<>\n\t\t\t\t\t\t{bloqueEntrega}', count: 1 },
	{
		find: "<div> <label className=\"dz-lbl\" htmlFor=\"o-city\"> Ciudad </label> <input id=\"o-city\" className=\"sm-in\" value={form.city} onChange={(e) => setF('city', e.target.value)} placeholder={form.pais === '+1' ? 'Miami' : 'Cali'} /> </div>",
		replace:
			'<div>\n\t\t\t\t\t\t\t\t<label className="dz-lbl" htmlFor="e-recibe">\n\t\t\t\t\t\t\t\t\t¿Quién recibe? <span className="dz-count">opcional</span>\n\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t<input id="e-recibe" className="sm-in" value={entrega.recibe} onChange={(ev) => setEntrega((x) => ({ ...x, recibe: ev.target.value }))} placeholder="Nombre de quien recibe" autoComplete="name" />\n\t\t\t\t\t\t\t</div>',
		count: 1,
	},
	{
		find: "{moneda === 'USD' ? ( <div className=\"dz-group\"> {aviso('o-dir')} <label className=\"dz-lbl\" htmlFor=\"o-dir\"> Dirección de envío en Estados Unidos </label> <textarea id=\"o-dir\" className=\"sm-in\" rows={2} value={form.direccion || ''} onChange={(e) => setF('direccion', e.target.value)} placeholder=\"Calle y número, apto, ciudad, estado y código postal\" /> <p className=\"dz-hint\">El envío desde Colombia está incluido en el precio.</p> </div> ) : null}",
		replace: '',
		count: 1,
	},
	{
		find: '<div className="dz-review-row is-total"> <span>Total</span>',
		replace:
			'{envioInfo.valor > 0 ? (\n\t\t\t\t\t\t\t<div className="dz-review-row">\n\t\t\t\t\t\t\t\t<span>Sandalias</span>\n\t\t\t\t\t\t\t\t<b>{money(subtotal)}</b>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t) : null}\n\t\t\t\t\t\t<div className="dz-review-row">\n\t\t\t\t\t\t\t<span>{envioInfo.etiqueta}</span>\n\t\t\t\t\t\t\t<b>{envioInfo.texto}</b>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t{entrega.pais ? (\n\t\t\t\t\t\t\t<div className="dz-review-row">\n\t\t\t\t\t\t\t\t<span>Entrega</span>\n\t\t\t\t\t\t\t\t<b>{resumenEntrega(entrega) || \'Completa la dirección en el paso anterior\'}</b>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t) : null}\n\t\t\t\t\t\t<div className="dz-review-row is-total">\n\t\t\t\t\t\t\t<span>Total</span>',
		count: 1,
	},
	{ find: "{moneda === 'USD' ? ( <div className=\"dz-review-row\"> <span>Envío a Estados Unidos</span> <b>Incluido</b> </div> ) : null}", replace: '', count: 1 },
	{ find: '<div className="dz-review">', replace: PENDIENTE_BOX, count: 1 },
	{ find: 'const makeOrder = async () => {', replace: 'const makeOrder = async (reemplazar?: boolean) => {', count: 1 },
	{ find: 'let code = \'\';', replace: "let code = '';\n\t\tlet vence = '';", count: 1 },
	{ find: 'whatsapp: telefono, moneda,', replace: 'whatsapp: telefono,\n\t\t\t\tmoneda,\n\t\t\t\tentrega: { ...entrega },\n\t\t\t\treemplazar: !!reemplazar,', count: 1 },
	{ find: "direccion_envio: moneda === 'USD' ? (form.direccion || '').trim() : '',", replace: "direccion_envio: '',", count: 1 },
	{ find: 'form.city.trim()', replace: 'entrega.ciudad.trim()', count: 4 },
	{ find: "const res = (await PB.send('/api/samar/pedidos', { method: 'POST', body: fd })) as { codigo?: string };", replace: "const res = (await PB.send('/api/samar/pedidos', { method: 'POST', body: fd })) as { codigo?: string; vence_en?: string };", count: 1 },
	{ find: "code = res && res.codigo ? String(res.codigo) : '';", replace: "code = res && res.codigo ? String(res.codigo) : '';\n\t\t\tvence = res && res.vence_en ? String(res.vence_en) : '';\n\t\t\tsetPendiente('');", count: 1 },
	{
		find: "setSending(false); setErr(errMsg(e, 'No pudimos guardar tu pedido. Inténtalo de nuevo o escríbenos por WhatsApp.')); return;",
		replace:
			"setSending(false);\n\t\t\tconst pe = e as { status?: number; response?: { codigo_pendiente?: string } };\n\t\t\tif (pe && pe.status === 409 && pe.response && pe.response.codigo_pendiente) setPendiente(String(pe.response.codigo_pendiente));\n\t\t\tsetErr(errMsg(e, 'No pudimos guardar tu pedido. Inténtalo de nuevo o escríbenos por WhatsApp.'));\n\t\t\treturn;",
		count: 1,
	},
	{ find: "'Voy a pagar el anticipo con Wompi.',", replace: "'Entrega: ' + resumenEntrega(entrega),\n\t\t\t'Voy a pagar el anticipo con Wompi.',", count: 1 },
	{ find: "setOrder({ code, text: lines.join('\\n') });", replace: "setOrder({ code, text: lines.join('\\n'), vence });", count: 1 },
	{ find: 'useState<{ code: string; text: string } | null>(null)', replace: 'useState<{ code: string; text: string; vence?: string } | null>(null)', count: 1 },
	{
		find: '<p className="dz-done-code">{order.code}</p>',
		replace:
			'<p className="dz-done-code">{order.code}</p>\n\t\t\t\t\t{order.vence ? (\n\t\t\t\t\t\t<p className="dz-hint" style={{ textAlign: \'center\', maxWidth: 520, margin: \'0 auto 8px\' }}>\n\t\t\t\t\t\t\tTienes hasta el <b>{fmtVence(order.vence)}</b> para pagar el anticipo. Si no se paga a tiempo, el pedido vence y tu diseño queda guardado en tu cuenta.\n\t\t\t\t\t\t</p>\n\t\t\t\t\t) : null}',
		count: 1,
	},
];

// ---------------- mi-cuenta.tsx ----------------
const micuenta = [
	{ find: 'pagarConWompi, fmtMoneda,', replace: 'pagarConWompi,\n\tfmtMoneda,\n\tfmtVence,\n\trestante,', count: 1 },
	{ find: 'moneda?: string;', replace: 'moneda?: string;\n\tvence_en?: string;\n\tenvio?: number;\n\tdireccion_envio?: string;', count: 1 },
	{
		find: "Recibido: 'Recibimos tu pedido. Paga el anticipo del 50% con Wompi para empezar.',",
		replace:
			"Recibido: 'Recibimos tu pedido. Paga el anticipo del 50% con Wompi para empezar.',\n\t'Esperando anticipo': 'Tu pedido está creado. Paga el anticipo del 50% con Wompi antes de la hora límite para empezar.',\n\tVencido: 'Este pedido venció porque no se pagó el anticipo a tiempo. Tu diseño sigue guardado: puedes volver a hacer el pedido.',",
		count: 1,
	},
	{
		find: "PASOS_PEDIDO.indexOf(p.estado === 'Cambios solicitados' ? 'Arte en diseño' : p.estado)",
		replace: "PASOS_PEDIDO.indexOf(p.estado === 'Cambios solicitados' ? 'Arte en diseño' : p.estado === 'Esperando anticipo' ? 'Recibido' : p.estado)",
		count: 1,
	},
	{ find: "(p.estado === 'Cancelado' ? ' is-off' : '')", replace: "(p.estado === 'Cancelado' || p.estado === 'Vencido' ? ' is-off' : '')", count: 1 },
	{ find: "{p.estado !== 'Cancelado' ? ( <ol", replace: "{p.estado !== 'Cancelado' && p.estado !== 'Vencido' ? (\n\t\t\t\t\t\t\t\t\t\t<ol", count: 1 },
	{
		find: "<dt>Precio por par</dt> <dd>{fmtMoneda(p.precio_unitario, p.moneda)}</dd>",
		replace:
			"<dt>Precio por par</dt>\n\t\t\t\t\t\t\t\t\t\t\t<dd>{fmtMoneda(p.precio_unitario, p.moneda)}</dd>\n\t\t\t\t\t\t\t\t\t\t\t{p.moneda === 'USD' ? (\n\t\t\t\t\t\t\t\t\t\t\t\t<>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dt>Envío</dt>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dd>Incluido</dd>\n\t\t\t\t\t\t\t\t\t\t\t\t</>\n\t\t\t\t\t\t\t\t\t\t\t) : p.envio ? (\n\t\t\t\t\t\t\t\t\t\t\t\t<>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dt>Envío</dt>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dd>{fmtMoneda(p.envio, p.moneda)}</dd>\n\t\t\t\t\t\t\t\t\t\t\t\t</>\n\t\t\t\t\t\t\t\t\t\t\t) : null}\n\t\t\t\t\t\t\t\t\t\t\t{p.direccion_envio ? (\n\t\t\t\t\t\t\t\t\t\t\t\t<>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dt>Entrega</dt>\n\t\t\t\t\t\t\t\t\t\t\t\t\t<dd>{p.direccion_envio}</dd>\n\t\t\t\t\t\t\t\t\t\t\t\t</>\n\t\t\t\t\t\t\t\t\t\t\t) : null}",
		count: 1,
	},
	{
		find: "{!p.anticipo_pagado && p.estado !== 'Cancelado' ? ( <div className=\"sm-actions\" style={{ margin: '4px 0 14px' }}>",
		replace: "{!p.anticipo_pagado && p.estado !== 'Cancelado' && p.estado !== 'Vencido' ? (\n\t\t\t\t\t\t\t\t\t\t<div className=\"sm-actions\" style={{ margin: '4px 0 14px', flexWrap: 'wrap', alignItems: 'center' }}>",
		count: 1,
	},
	{
		find: "{pagando === p.codigo ? 'Abriendo Wompi…' : 'Pagar anticipo con Wompi'} </button>",
		replace:
			"{pagando === p.codigo ? 'Abriendo Wompi…' : 'Pagar anticipo con Wompi'}\n\t\t\t\t\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t\t\t\t\t\t{p.vence_en ? (\n\t\t\t\t\t\t\t\t\t\t\t\t<span className=\"sm-muted\" style={{ fontSize: 14 }}>\n\t\t\t\t\t\t\t\t\t\t\t\t\tPaga antes del {fmtVence(p.vence_en)} {restante(p.vence_en)}\n\t\t\t\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t\t\t\t) : null}",
		count: 1,
	},
	{
		find: '{p.historial && p.historial.length ? ( <ul className="sm-tl">',
		replace:
			"{p.estado === 'Vencido' ? (\n\t\t\t\t\t\t\t\t\t\t<div className=\"sm-actions\" style={{ margin: '4px 0 14px' }}>\n\t\t\t\t\t\t\t\t\t\t\t<button type=\"button\" className=\"sm-btn sm-btn-p sm-btn-sm\" onClick={() => setTab('disenos')}>\n\t\t\t\t\t\t\t\t\t\t\t\tVolver a pedir desde mis diseños\n\t\t\t\t\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t\t) : null}\n\t\t\t\t\t\t\t\t\t{p.historial && p.historial.length ? (\n\t\t\t\t\t\t\t\t\t\t<ul className=\"sm-tl\">",
		count: 1,
	},
];

// ---------------- mi-pedido.tsx ----------------
const mipedido = [
	{
		find: "Recibido: 'Recibimos tu pedido. Paga el anticipo del 50% con Wompi desde Mi cuenta para empezar.',",
		replace:
			"Recibido: 'Recibimos tu pedido. Paga el anticipo del 50% con Wompi desde Mi cuenta para empezar.',\n\t'Esperando anticipo': 'Tu pedido está creado. Paga el anticipo del 50% con Wompi desde Mi cuenta antes de la hora límite para empezar.',\n\tVencido: 'Este pedido venció porque no se pagó el anticipo a tiempo. Tu diseño sigue guardado en Mi cuenta: puedes volver a hacer el pedido.',",
		count: 1,
	},
	{ find: "(p.estado === 'Cancelado' ? ' is-off' : '')", replace: "(p.estado === 'Cancelado' || p.estado === 'Vencido' ? ' is-off' : '')", count: 1 },
];

// ---------------- admin.tsx ----------------
const admin = [
	{ find: "const ESTADOS = [ 'Recibido',", replace: "const ESTADOS = [\n\t'Esperando anticipo',\n\t'Recibido',", count: 1 },
	{ find: "'Entregado', 'Cancelado', ];", replace: "'Entregado',\n\t'Vencido',\n\t'Cancelado',\n];", count: 1 },
	{ find: 'comprobante?: string;', replace: 'comprobante?: string;\n\tvence_en?: string;\n\tenvio?: number;\n\tentrega?: Record<string, unknown> | null;', count: 1 },
	{ find: "type Vista = 'resumen' | 'pedidos' | 'clientes' | 'disenos' | 'cotizaciones';", replace: "type Vista = 'resumen' | 'seguimiento' | 'pedidos' | 'clientes' | 'disenos' | 'cotizaciones';", count: 1 },
	{ find: "['pedidos', 'Pedidos', pedidos.length],", replace: "['seguimiento', 'Seguimiento', contarSeguimiento(pedidos)],\n\t\t\t\t\t\t\t['pedidos', 'Pedidos', pedidos.length],", count: 1 },
	{
		find: "{vista === 'cotizaciones' ? <CotizacionesAdm /> : null}",
		replace:
			"{vista === 'seguimiento' ? (\n\t\t\t\t\t<SeguimientoAdm\n\t\t\t\t\t\tpedidos={pedidos}\n\t\t\t\t\t\tquien={user ? user.email : ''}\n\t\t\t\t\t\tonAbrir={(id: string) => {\n\t\t\t\t\t\t\tsetSelId(id);\n\t\t\t\t\t\t\tsetVista('pedidos');\n\t\t\t\t\t\t}}\n\t\t\t\t\t\tonCambio={(nuevo: Pedido) => setPedidos((lista) => lista.map((x) => (x.id === nuevo.id ? nuevo : x)))}\n\t\t\t\t\t/>\n\t\t\t\t) : null}\n\n\t\t\t\t{vista === 'cotizaciones' ? <CotizacionesAdm /> : null}",
		count: 1,
	},
	{ find: "const CERRADOS = ['Entregado', 'Cancelado'];", replace: "const CERRADOS = ['Entregado', 'Cancelado', 'Vencido'];", count: 1 },
	{ find: "const vivo = x.estado !== 'Cancelado';", replace: "const vivo = x.estado !== 'Cancelado' && x.estado !== 'Vencido';", count: 1 },
];

const out = {
	version: 1,
	files: {
		'samar-kit.tsx': { changes: [], append: rd('kit-entrega.tsx') },
		'disenar.tsx': { changes: disenar },
		'mi-cuenta.tsx': { changes: micuenta },
		'mi-pedido.tsx': { changes: mipedido },
		'admin.tsx': { changes: admin, append: rd('seguimiento-adm.tsx') },
	},
};
fs.writeFileSync(new URL('../samar-fotos/_codigo/seguimiento/web-parche.json', import.meta.url), JSON.stringify(out));
console.log(Object.entries(out.files).map(([k, v]) => k + ':' + v.changes.length).join(' '));

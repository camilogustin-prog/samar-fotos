
// ---------------------------------------------------------------------------
// Seguimiento (8 nov 2026): lo que necesita acción, por prioridad.
// Cada contacto (WhatsApp, iMessage, correo o nota) queda en el historial interno del pedido.
// ---------------------------------------------------------------------------
const SEG_SITIO = 'https://samarpadridin.live';

function contarSeguimiento(lista: Pedido[]): number {
	return lista.filter((x) => (!x.anticipo_pagado && (x.estado === 'Esperando anticipo' || x.estado === 'Recibido')) || x.estado === 'Cambios solicitados').length;
}

function segDinero(n: number, m?: string) {
	const v = Number(n) || 0;
	if (m === 'USD') return 'US$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function segFecha(iso?: string) {
	const t = Date.parse(String(iso || ''));
	if (isNaN(t)) return '';
	try {
		return new Date(t).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
	} catch (_) {
		return new Date(t).toLocaleString();
	}
}

function segRestante(iso?: string) {
	const t = Date.parse(String(iso || ''));
	if (isNaN(t)) return '';
	const ms = t - Date.now();
	const h = Math.round(Math.abs(ms) / 3600000);
	const txt = h >= 48 ? Math.round(h / 24) + ' días' : h >= 1 ? h + ' h' : Math.max(1, Math.round(Math.abs(ms) / 60000)) + ' min';
	return ms > 0 ? 'vence en ' + txt : 'venció hace ' + txt;
}

function segDia(ymd?: string) {
	const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!m) return 'sin fecha';
	const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
	return Number(m[3]) + ' ' + meses[Number(m[2]) - 1] + ' ' + m[1];
}

function segDiasA(ymd?: string) {
	const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!m) return 9999;
	return Math.floor((Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 17) - Date.now()) / 86400000);
}

const SEG_CSS = `
.seg-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 16px}
.seg-kpi{padding:12px 14px}
.seg-kpi b{display:block;font-size:22px;margin-top:2px}
.seg-sec{margin:0 0 16px}
.seg-sec h2{font-size:17px;margin:0 0 4px;display:flex;gap:8px;align-items:center}
.seg-sec h2 span{font-size:12px;background:#efe9fb;color:#3d0097;border-radius:20px;padding:2px 9px}
.seg-sec > p{margin:0 0 10px}
.seg-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.seg-item{border:1px solid #ece8f4;border-radius:12px;padding:12px 14px;background:#fff}
.seg-top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.seg-cod{font:inherit;font-weight:700;background:none;border:0;padding:0;color:#3d0097;cursor:pointer;text-decoration:underline}
.seg-chip{font-size:12px;border-radius:20px;padding:3px 9px;background:#f1f0f5;color:#4a4560}
.seg-chip.is-hot{background:#fde8e8;color:#a11d1d;font-weight:700}
.seg-meta{margin:6px 0 8px;font-size:13px;line-height:1.45}
.seg-acc{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.seg-nota{display:flex;gap:6px;margin-top:8px}
.seg-nota .sm-in{flex:1;min-width:0}
.seg-empty{font-size:14px;margin:0}
`;

function SeguimientoAdm({ pedidos, quien, onAbrir, onCambio }: { pedidos: Pedido[]; quien: string; onAbrir: (id: string) => void; onCambio: (p: Pedido) => void }) {
	const [msg, setMsg] = useState('');
	const [ocupado, setOcupado] = useState('');
	const [notas, setNotas] = useState<Record<string, string>>({});

	const g = useMemo(() => {
		const porVence = (a: Pedido, b: Pedido) => ((a.vence_en || 'z') < (b.vence_en || 'z') ? -1 : 1);
		const porEvento = (a: Pedido, b: Pedido) => ((a.fecha_evento || 'z') < (b.fecha_evento || 'z') ? -1 : 1);
		const hace30 = new Date(Date.now() - 30 * 86400000).toISOString();
		return {
			sinPagar: pedidos.filter((x) => !x.anticipo_pagado && (x.estado === 'Esperando anticipo' || x.estado === 'Recibido')).sort(porVence),
			vencidos: pedidos.filter((x) => x.estado === 'Vencido' && (!x.vence_en || x.vence_en >= hace30)).sort(porVence).reverse(),
			cambios: pedidos.filter((x) => x.estado === 'Cambios solicitados'),
			porDisenar: pedidos.filter((x) => x.estado === 'Anticipo pagado' || x.estado === 'Arte en diseño' || x.estado === 'Arte en revisión interna').sort(porEvento),
			porAprobar: pedidos.filter((x) => x.estado === 'Arte enviado al cliente').sort(porEvento),
			entregas: pedidos.filter((x) => x.estado === 'Arte aprobado' || x.estado === 'En producción' || x.estado === 'Listo para entrega').sort(porEvento),
		};
	}, [pedidos]);

	const anticiposPend = g.sinPagar.reduce((s, x) => s + (x.moneda === 'USD' ? 0 : Number(x.anticipo) || 0), 0);
	const vencenHoy = g.sinPagar.filter((x) => x.vence_en && Date.parse(x.vence_en) - Date.now() < 24 * 3600000).length;

	const ultimoContacto = (p: Pedido) => {
		const h = Array.isArray(p.historial) ? p.historial : [];
		for (let i = h.length - 1; i >= 0; i--) {
			if (h[i] && h[i].estado === 'Contacto') return String(h[i].nota || '').split(':')[0] + ' · ' + segFecha(h[i].fecha);
		}
		return '';
	};

	const conHist = (p: Pedido, estado: string, nota: string, publico: boolean): Hist[] => {
		const h = Array.isArray(p.historial) ? p.historial.slice() : [];
		h.push({ estado, fecha: new Date().toISOString(), nota, publico, por: quien });
		return h;
	};

	const guardar = async (p: Pedido, datos: Record<string, unknown>, ok: string) => {
		setOcupado(p.id);
		setMsg('');
		try {
			const nuevo = (await PB.collection('pedidos').update(p.id, datos)) as Pedido;
			onCambio(nuevo);
			setMsg(ok);
		} catch (e) {
			setMsg('No se pudo guardar el cambio en ' + p.codigo + '. ' + String((e as { message?: string }).message || ''));
		}
		setOcupado('');
	};

	const registrar = (p: Pedido, canal: string) => {
		const extra = (notas[p.id] || '').trim();
		guardar(p, { historial: conHist(p, 'Contacto', canal + (extra ? ': ' + extra : ''), false) }, 'Contacto registrado en ' + p.codigo + '.');
		setNotas((n) => ({ ...n, [p.id]: '' }));
	};

	const extender = (p: Pedido) => {
		const vence = new Date(Date.now() + 48 * 3600000).toISOString();
		guardar(p, { estado: 'Esperando anticipo', vence_en: vence, historial: conHist(p, 'Esperando anticipo', 'Te dimos 48 horas más para pagar el anticipo: hasta el ' + segFecha(vence) + ' (hora de Colombia).', true) }, 'Plazo extendido 48 horas para ' + p.codigo + '. El cliente recibe un correo con la nueva hora límite.');
	};

	const mensaje = (p: Pedido, tipo: string) => {
		const nombre = (p.nombre || '').split(' ')[0];
		if (tipo === 'pago')
			return 'Hola ' + nombre + ', te escribimos de Samar por tu pedido ' + p.codigo + ' (' + p.total_pares + ' pares). Para empezar falta el anticipo de ' + segDinero(p.anticipo, p.moneda) + '. Puedes pagarlo con Wompi aquí: ' + SEG_SITIO + '/mi-cuenta?tab=pedidos' + (p.vence_en ? ' (hasta el ' + segFecha(p.vence_en) + ').' : '.') + ' ¿Te ayudamos con algo?';
		if (tipo === 'vencido') return 'Hola ' + nombre + ', tu pedido ' + p.codigo + ' venció sin el pago del anticipo. Si todavía lo quieres, te damos 48 horas más para pagarlo. ¿Te ayudamos?';
		if (tipo === 'aprobar') return 'Hola ' + nombre + ', el arte de tu pedido ' + p.codigo + ' está listo para aprobar en ' + SEG_SITIO + '/mi-cuenta?tab=pedidos. ¿Lo pudiste ver?';
		if (tipo === 'entrega') return 'Hola ' + nombre + ', te escribimos de Samar por tu pedido ' + p.codigo + '. Coordinemos la entrega' + (p.saldo_pagado ? '.' : ' y el saldo de ' + segDinero(p.saldo, p.moneda) + '.');
		return 'Hola ' + nombre + ', te escribimos de Samar por tu pedido ' + p.codigo + '.';
	};

	const botones = (p: Pedido, tipo: string) => {
		const tel = (p.whatsapp || '').replace(/\D/g, '');
		const texto = mensaje(p, tipo);
		const prefiereIm = p.contacto_preferido === 'iMessage';
		return (
			<>
				{tel ? (
					<a className={'sm-btn sm-btn-sm ' + (prefiereIm ? 'sm-btn-o' : 'sm-btn-p')} href={'https://wa.me/' + tel + '?text=' + encodeURIComponent(texto)} target="_blank" rel="noopener noreferrer" onClick={() => registrar(p, 'WhatsApp')}>
						WhatsApp
					</a>
				) : null}
				{tel ? (
					<a className={'sm-btn sm-btn-sm ' + (prefiereIm ? 'sm-btn-p' : 'sm-btn-o')} href={'sms:+' + tel + '?&body=' + encodeURIComponent(texto)} onClick={() => registrar(p, 'iMessage / SMS')}>
						iMessage
					</a>
				) : null}
				{p.correo ? (
					<a className="sm-btn sm-btn-sm sm-btn-o" href={'mailto:' + p.correo + '?subject=' + encodeURIComponent('Tu pedido ' + p.codigo + ' · Samar') + '&body=' + encodeURIComponent(texto)} onClick={() => registrar(p, 'Correo')}>
						Correo
					</a>
				) : null}
			</>
		);
	};

	const item = (p: Pedido, tipo: string, extra?: React.ReactNode) => {
		const ultimo = ultimoContacto(p);
		const urgente = !!p.vence_en && Date.parse(p.vence_en) - Date.now() < 24 * 3600000;
		const diasEv = segDiasA(p.fecha_evento);
		return (
			<li key={p.id} className="seg-item">
				<div className="seg-top">
					<button type="button" className="seg-cod" onClick={() => onAbrir(p.id)}>
						{p.codigo}
					</button>
					<span>{p.nombre}</span>
					<span className="sm-muted">
						{p.total_pares} pares · {segDinero(p.total, p.moneda)}
					</span>
					{tipo === 'pago' && p.vence_en ? <span className={'seg-chip' + (urgente ? ' is-hot' : '')}>{segRestante(p.vence_en)}</span> : null}
					{tipo !== 'pago' && tipo !== 'vencido' && diasEv < 9999 ? <span className={'seg-chip' + (diasEv <= 10 ? ' is-hot' : '')}>evento en {diasEv} días</span> : null}
				</div>
				<p className="sm-muted seg-meta">
					{p.tipo_evento || 'Evento'} · {segDia(p.fecha_evento)} · {p.direccion_envio || p.ciudad || 'sin dirección'} · prefiere {p.contacto_preferido || 'WhatsApp'}
					{ultimo ? ' · último contacto: ' + ultimo : ' · sin contacto registrado'}
					{tipo === 'cambios' && p.comentario_cliente ? (
						<>
							<br />
							Pidió: “{p.comentario_cliente}”
						</>
					) : null}
				</p>
				<div className="seg-acc">
					{botones(p, tipo)}
					{extra}
				</div>
				<div className="seg-nota">
					<input className="sm-in" placeholder="Nota del contacto (qué te dijo, cuándo paga…)" value={notas[p.id] || ''} onChange={(e) => setNotas((n) => ({ ...n, [p.id]: e.target.value }))} />
					<button type="button" className="sm-btn sm-btn-o sm-btn-sm" disabled={ocupado === p.id || !(notas[p.id] || '').trim()} onClick={() => registrar(p, 'Nota')}>
						Guardar nota
					</button>
				</div>
			</li>
		);
	};

	const seccion = (titulo: string, ayuda: string, lista: Pedido[], tipo: string, extra?: (p: Pedido) => React.ReactNode, vacio?: string) => (
		<section className="sm-card seg-sec">
			<h2>
				{titulo} <span>{lista.length}</span>
			</h2>
			<p className="sm-muted">{ayuda}</p>
			{lista.length ? <ul className="seg-list">{lista.map((p) => item(p, tipo, extra ? extra(p) : null))}</ul> : <p className="sm-muted seg-empty">{vacio || 'Nada pendiente aquí.'}</p>}
		</section>
	);

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: SEG_CSS }} />
			<section className="seg-kpis">
				<div className="sm-card seg-kpi">
					<p className="sm-muted">Sin pagar</p>
					<b>{g.sinPagar.length}</b>
				</div>
				<div className="sm-card seg-kpi">
					<p className="sm-muted">Vencen en menos de 24 h</p>
					<b>{vencenHoy}</b>
				</div>
				<div className="sm-card seg-kpi">
					<p className="sm-muted">Anticipos por cobrar (COP)</p>
					<b>{segDinero(anticiposPend, 'COP')}</b>
				</div>
				<div className="sm-card seg-kpi">
					<p className="sm-muted">Cambios de arte pedidos</p>
					<b>{g.cambios.length}</b>
				</div>
			</section>
			{msg ? (
				<p className="sm-muted" role="status" style={{ margin: '0 0 12px' }}>
					{msg}
				</p>
			) : null}
			{seccion(
				'Sin pagar',
				'Pedidos esperando el anticipo. Tienen 48 horas; el cliente recibe un recordatorio cuando faltan 24 h y un aviso si vence.',
				g.sinPagar,
				'pago',
				(p) => (
					<button type="button" className="sm-btn sm-btn-o sm-btn-sm" disabled={ocupado === p.id} onClick={() => extender(p)}>
						Dar 48 h más
					</button>
				),
				'No hay pedidos esperando el anticipo.'
			)}
			{seccion('Cambios de arte pedidos', 'El cliente pidió ajustes al arte. Ábrelo para subir la nueva versión.', g.cambios, 'cambios')}
			{seccion('Arte por preparar', 'Anticipo pagado: el arte debe salir en unos 5 días.', g.porDisenar, 'arte')}
			{seccion('Arte esperando aprobación', 'Ya se envió el arte; falta que el cliente lo apruebe.', g.porAprobar, 'aprobar')}
			{seccion('Producción y entregas', 'Pedidos aprobados, en producción o listos. Ordenados por la fecha del evento.', g.entregas, 'entrega')}
			{seccion(
				'Vencidos (últimos 30 días)',
				'Pedidos que no pagaron a tiempo. Puedes escribirles y darles 48 horas más.',
				g.vencidos,
				'vencido',
				(p) => (
					<button type="button" className="sm-btn sm-btn-o sm-btn-sm" disabled={ocupado === p.id} onClick={() => extender(p)}>
						Reactivar 48 h
					</button>
				),
				'No hay pedidos vencidos recientes.'
			)}
		</>
	);
}

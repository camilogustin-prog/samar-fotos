

// ---- Cotizaciones de marcas propias (formulario de /marcas-propias) ----
type Cotizacion = {
	id: string;
	collectionId: string;
	created?: string;
	empresa: string;
	nit?: string;
	contacto: string;
	cargo?: string;
	email: string;
	whatsapp: string;
	ciudad?: string;
	tipo?: string;
	cantidad: number;
	suela?: string;
	tira?: string;
	tintas?: string;
	etiqueta_propia?: boolean;
	idea?: string;
	logos?: string[];
	fecha_requerida?: string;
	estado?: string;
	nota_interna?: string;
};
const COT_ESTADOS = ['Nueva', 'Cotizada', 'Aprobada', 'En producción', 'Entregada', 'Descartada'];
const COT_CSS = [
	'.cot-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:baseline;justify-content:space-between;margin-bottom:14px}',
	'.cot-top h2{margin:0;font-size:22px}',
	'.cot-top p{margin:0;color:#6b6475}',
	'.cot-fil{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}',
	'.cot-fil button,.cot-btn{border:1px solid rgba(0,0,0,.18);background:#fff;padding:7px 12px;font-weight:700;font-size:13.5px;cursor:pointer}',
	'.cot-fil button[aria-pressed="true"]{background:#120B1F;color:#fff;border-color:#120B1F}',
	'.cot-grid{display:grid;gap:16px;grid-template-columns:1fr}',
	'@media(min-width:980px){.cot-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}}',
	'.cot-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}',
	'.cot-item{width:100%;text-align:left;border:1px solid rgba(0,0,0,.12);background:#fff;padding:12px 14px;cursor:pointer;display:grid;gap:3px}',
	'.cot-item[aria-current="true"]{border-color:#120B1F;box-shadow:inset 3px 0 0 #120B1F}',
	'.cot-item b{font-size:15.5px}',
	'.cot-item span{color:#6b6475;font-size:13.5px}',
	'.cot-chip{display:inline-block;font-size:12px;font-weight:800;padding:2px 8px;background:#EDE7F8;color:#3B2A63;margin-right:6px}',
	'.cot-chip.is-nueva{background:#FFE9C2;color:#6A4300}',
	'.cot-det{border:1px solid rgba(0,0,0,.12);background:#fff;padding:18px}',
	'.cot-det h3{margin:0 0 4px;font-size:20px}',
	'.cot-dl{display:grid;grid-template-columns:140px 1fr;gap:6px 12px;margin:14px 0}',
	'.cot-dl dt{color:#6b6475;font-size:13.5px}',
	'.cot-dl dd{margin:0;font-weight:600;word-break:break-word}',
	'.cot-logos{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 14px}',
	'.cot-logos a{display:block;border:1px solid rgba(0,0,0,.12)}',
	'.cot-logos img{width:120px;height:120px;object-fit:contain;display:block;background:#fafafa}',
	'.cot-logos .is-pdf{padding:10px 12px;font-weight:700}',
	'.cot-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}',
	'.cot-det select,.cot-det textarea{font:inherit;border:1px solid rgba(0,0,0,.22);padding:8px 10px;background:#fff}',
	'.cot-det textarea{width:100%;min-height:80px;box-sizing:border-box}',
	'.cot-err{color:#B3261E;font-weight:700}',
].join('');

function CotizacionesAdm() {
	const P = pb as any;
	const [items, setItems] = useState<Cotizacion[]>([]);
	const [cargando, setCargando] = useState(true);
	const [err, setErr] = useState('');
	const [filtro, setFiltro] = useState('Todas');
	const [selId, setSelId] = useState('');
	const [nota, setNota] = useState('');
	const [tok, setTok] = useState('');
	const [guardando, setGuardando] = useState(false);

	const cargar = () => {
		setCargando(true);
		P.collection('cotizaciones')
			.getFullList({ sort: '-created' })
			.catch(() => P.collection('cotizaciones').getFullList())
			.then((r: Cotizacion[]) => {
				setItems(Array.isArray(r) ? r : []);
				setErr('');
			})
			.catch(() => setErr('No se pudieron cargar las cotizaciones.'))
			.finally(() => setCargando(false));
	};
	useEffect(() => {
		cargar();
		Promise.resolve(P.files && P.files.getToken ? P.files.getToken() : '')
			.then((t: string) => setTok(t || ''))
			.catch(() => undefined);
	}, []);

	const sel = items.find((x) => x.id === selId) || null;
	useEffect(() => {
		setNota(sel ? sel.nota_interna || '' : '');
	}, [selId]);

	const est = (c: Cotizacion) => c.estado || 'Nueva';
	const lista = filtro === 'Todas' ? items : items.filter((x) => est(x) === filtro);
	const nuevas = items.filter((x) => est(x) === 'Nueva').length;
	const fileUrl = (c: Cotizacion, f: string) =>
		String(POCKETBASE_API_URL || '').replace(/\/$/, '') + '/api/files/' + c.collectionId + '/' + c.id + '/' + encodeURIComponent(f) + (tok ? '?token=' + tok : '');
	const wa = (c: Cotizacion) => {
		const d = String(c.whatsapp || '').replace(/\D/g, '');
		const n = d.length === 10 ? '57' + d : d;
		return 'https://wa.me/' + n + '?text=' + encodeURIComponent('Hola ' + (c.contacto || '') + ', te escribimos de Samar por la cotización de sandalias con la marca de ' + (c.empresa || '') + '.');
	};
	const fecha = (s?: string) => {
		if (!s) return '';
		const d = new Date(String(s).replace(' ', 'T'));
		return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
	};
	const guardar = async (cambios: Partial<Cotizacion>) => {
		if (!sel) return;
		setGuardando(true);
		try {
			const r = await P.collection('cotizaciones').update(sel.id, cambios);
			setItems((xs) => xs.map((x) => (x.id === r.id ? r : x)));
			setErr('');
		} catch (e) {
			setErr('No se pudo guardar el cambio.');
		} finally {
			setGuardando(false);
		}
	};

	return (
		<section className="sm-card">
			<style dangerouslySetInnerHTML={{ __html: COT_CSS }} />
			<div className="cot-top">
				<div>
					<h2>Cotizaciones de marcas propias</h2>
					<p>
						{nuevas} nuevas · {items.length} en total
					</p>
				</div>
				<button type="button" className="cot-btn" onClick={cargar} disabled={cargando}>
					{cargando ? 'Cargando…' : 'Actualizar'}
				</button>
			</div>
			<div className="cot-fil" role="group" aria-label="Filtrar por estado">
				{['Todas'].concat(COT_ESTADOS).map((f) => (
					<button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
						{f}
					</button>
				))}
			</div>
			{err ? <p className="cot-err">{err}</p> : null}
			<div className="cot-grid">
				<ul className="cot-list">
					{lista.map((c) => (
						<li key={c.id}>
							<button type="button" className="cot-item" aria-current={c.id === selId} onClick={() => setSelId(c.id)}>
								<b>{c.empresa}</b>
								<span>
									<i className={'cot-chip' + (est(c) === 'Nueva' ? ' is-nueva' : '')}>{est(c)}</i>
									{c.cantidad} pares · {c.tipo || 'Sin tipo'}
									{c.created ? ' · ' + fecha(c.created) : ''}
								</span>
							</button>
						</li>
					))}
					{!cargando && !lista.length ? <li>{items.length ? 'No hay cotizaciones en este estado.' : 'Aún no llegan cotizaciones.'}</li> : null}
				</ul>
				{sel ? (
					<div className="cot-det">
						<h3>{sel.empresa}</h3>
						<p>
							{sel.cantidad} pares{sel.fecha_requerida ? ' · para el ' + fecha(sel.fecha_requerida) : ''}
						</p>
						<div className="cot-row">
							<a className="cot-btn" href={wa(sel)} target="_blank" rel="noopener noreferrer">
								Escribir por WhatsApp
							</a>
							<a className="cot-btn" href={'mailto:' + sel.email}>
								Enviar correo
							</a>
						</div>
						<dl className="cot-dl">
							<dt>Contacto</dt>
							<dd>
								{sel.contacto}
								{sel.cargo ? ' · ' + sel.cargo : ''}
							</dd>
							<dt>WhatsApp</dt>
							<dd>{sel.whatsapp}</dd>
							<dt>Correo</dt>
							<dd>{sel.email}</dd>
							<dt>NIT</dt>
							<dd>{sel.nit || '—'}</dd>
							<dt>Ciudad</dt>
							<dd>{sel.ciudad || '—'}</dd>
							<dt>Para qué</dt>
							<dd>{sel.tipo || '—'}</dd>
							<dt>Suela</dt>
							<dd>{sel.suela || '—'}</dd>
							<dt>Tira</dt>
							<dd>{sel.tira || '—'}</dd>
							<dt>Colores del logo</dt>
							<dd>{sel.tintas || '—'}</dd>
							<dt>Etiqueta con su marca</dt>
							<dd>{sel.etiqueta_propia ? 'Sí' : 'No'}</dd>
							<dt>Idea</dt>
							<dd>{sel.idea || '—'}</dd>
							<dt>Recibida</dt>
							<dd>{fecha(sel.created) || '—'}</dd>
						</dl>
						<b>Logo o arte</b>
						<div className="cot-logos">
							{(sel.logos || []).length
								? (sel.logos || []).map((f) =>
										/\.pdf$/i.test(f) ? (
											<a key={f} className="is-pdf" href={fileUrl(sel, f)} target="_blank" rel="noopener noreferrer">
												PDF: {f}
											</a>
										) : (
											<a key={f} href={fileUrl(sel, f)} target="_blank" rel="noopener noreferrer">
												<img src={fileUrl(sel, f)} alt={'Logo de ' + sel.empresa} />
											</a>
										)
									)
								: 'No subió archivos.'}
						</div>
						<label>
							<b>Estado </b>
							<select value={est(sel)} disabled={guardando} onChange={(e) => guardar({ estado: e.target.value })}>
								{COT_ESTADOS.map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</label>
						<p style={{ margin: '14px 0 6px', fontWeight: 700 }}>Nota interna (solo la ve el equipo)</p>
						<textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Precio cotizado, muestra enviada, acuerdos…" />
						<div className="cot-row">
							<button type="button" className="cot-btn" disabled={guardando || nota === (sel.nota_interna || '')} onClick={() => guardar({ nota_interna: nota })}>
								{guardando ? 'Guardando…' : 'Guardar nota'}
							</button>
						</div>
					</div>
				) : (
					<div className="cot-det">Elige una cotización para ver el detalle.</div>
				)}
			</div>
		</section>
	);
}

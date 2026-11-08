import { useState } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/marcas-propias';
import { seo } from '@/lib/seo';
import pb from '@/lib/pocketbase';
import { Clip, FONT_LINKS, PageShell, img, waLink } from '@/components/samar-kit';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Marcas propias | Sandalias con tu marca | Samar',
		description: 'Sandalias con el logo de tu empresa o tu marca: campañas, eventos corporativos, hoteles, turismo y marcas que venden sandalias con su nombre. Desde 48 pares, hechas en Cali.',
	});
}

export const links: Route.LinksFunction = () => FONT_LINKS;

const MINIMO = 48;
const VERSION_POLITICA = '2026-11-07';

type Caso = { f: string; t: string; c: string; v?: string };

const CATS = ['Todas', 'Empresas y campañas', 'Marcas', 'Turismo y hoteles'];

// Fotos en samar-fotos/marcas
const CASOS: Caso[] = [
	{ f: 'marcas/coca-cola', t: 'Coca-Cola', c: 'Empresas y campañas', v: 'marcas/coca-cola-pares' },
	{ f: 'marcas/zoho-inspire', t: 'Zoho Inspire', c: 'Empresas y campañas', v: 'marcas/zoho' },
	{ f: 'marcas/amarillo', t: 'Aguardiente Amarillo', c: 'Empresas y campañas', v: 'marcas/amarillo' },
	{ f: 'marcas/mastercard-academy', t: 'Mastercard Academy', c: 'Empresas y campañas' },
	{ f: 'marcas/phoenix-tower', t: 'Phoenix Tower', c: 'Empresas y campañas' },
	{ f: 'marcas/bronze-skin', t: 'Bronze Skin', c: 'Marcas' },
	{ f: 'marcas/ariel-bikinis', t: 'Ariel Bikinis', c: 'Marcas' },
	{ f: 'marcas/colorgy', t: 'Colorgy', c: 'Marcas' },
	{ f: 'marcas/bromzini', t: 'Bromzini & Beatriz Camacho', c: 'Marcas' },
	{ f: 'marcas/bronze-skin-negra', t: 'Bronze Skin, versión negra', c: 'Marcas' },
	{ f: 'marcas/posibbble-mar', t: 'Posibbble · San Andrés', c: 'Turismo y hoteles' },
	{ f: 'marcas/posibbble-playa-negra', t: 'Posibbble · Life is better at the beach', c: 'Turismo y hoteles' },
	{ f: 'marcas/cotelco', t: 'Cotelco San Andrés y Providencia', c: 'Turismo y hoteles' },
	{ f: 'marcas/santa-marta-500', t: 'Santa Marta 500 años', c: 'Turismo y hoteles' },
	{ f: 'marcas/providencia', t: 'Providencia', c: 'Turismo y hoteles' },
	{ f: 'marcas/posibbble-san-andres', t: 'Posibbble · Recuerdo de la isla', c: 'Turismo y hoteles' },
	{ f: 'marcas/posibbble-mar-negra', t: 'Posibbble · Mar en negro', c: 'Turismo y hoteles' },
	{ f: 'marcas/posibbble-playa-rosa', t: 'Posibbble · Playa en rosa', c: 'Turismo y hoteles' },
];

const PARA = [
	{ t: 'Empresas y campañas', p: 'Regalo para clientes y equipos, lanzamientos, convenciones y activaciones de marca.' },
	{ t: 'Marcas que venden sandalias', p: 'Tu propia línea de sandalias con tu nombre y tu diseño, lista para vender.' },
	{ t: 'Turismo y hoteles', p: 'El recuerdo del destino: hoteles, tiendas de playa y gremios turísticos.' },
];

const PASOS = [
	['Nos cuentas tu idea', 'Envías tu logo, los colores y cuántos pares necesitas.'],
	['Recibes la cotización', 'Te enviamos el precio por volumen y una propuesta del arte sobre la sandalia.'],
	['Apruebas el arte', 'Nada se produce sin tu aprobación final.'],
	['Producimos', 'Inyectamos la sandalia y la imprimimos en nuestra planta en Cali.'],
	['Entregamos', 'Cada par con su etiqueta, listo para regalar o vender.'],
];

const SUELAS = ['Blanco', 'Negro', 'Rosa bebé', 'Otro color (lo hablamos)'];
const TIRAS = ['Blanco', 'Negro', 'Plateado', 'Transparente', 'Dorado escarcha', 'Rosa escarcha', 'Negro escarcha', 'Otro color (lo hablamos)'];
const TIPOS = ['Empresa o campaña', 'Marca que vende sandalias', 'Turismo u hotel', 'Promocional', 'Otro'];

const MP_CSS = [
	'.mp-hero{background:#120B1F;color:#fff;padding:120px 0 56px}',
	'.mp-hero .sm-wrap{display:grid;gap:28px;align-items:center}',
	'.mp-hero .sm-eyebrow{color:#C9B8F0}',
	'.mp-hero h1{color:#fff;margin:8px 0 0}',
	'.mp-hero .mp-lead{color:rgba(255,255,255,.82);font-size:17px;line-height:1.55;margin:14px 0 0;max-width:46ch}',
	'.mp-hero-v{aspect-ratio:9/16;max-height:620px;width:100%;max-width:360px;justify-self:center;overflow:hidden;background:#2a2a2a}',
	'.mp-hero-v video{width:100%;height:100%;object-fit:cover;display:block}',
	'.mp-hero .sm-btn-o{color:#fff;border-color:rgba(255,255,255,.6)}',
	'.mp-facts{display:flex;flex-wrap:wrap;gap:8px 22px;margin:22px 0 0;padding:0;list-style:none;color:rgba(255,255,255,.85);font-size:14.5px}',
	'.mp-facts b{color:#fff}',
	'@media(min-width:900px){.mp-hero{padding:140px 0 72px}.mp-hero .sm-wrap{grid-template-columns:1.2fr 1fr}}',
	'.mp-sec{padding:64px 0}',
	'.mp-para{display:grid;gap:14px;grid-template-columns:1fr;margin-top:22px}',
	'.mp-para div{border:1px solid rgba(0,0,0,.1);padding:18px 18px 20px}',
	'.mp-para b{display:block;font-size:18px;margin-bottom:6px}',
	'.mp-para p{margin:0;color:var(--muted);line-height:1.5}',
	'@media(min-width:760px){.mp-para{grid-template-columns:repeat(3,minmax(0,1fr))}}',
	'.mp-filtros{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 18px}',
	'.mp-filtros button{border:1px solid rgba(0,0,0,.18);background:#fff;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer}',
	'.mp-filtros button[aria-pressed="true"]{background:#120B1F;color:#fff;border-color:#120B1F}',
	'.mp-casos{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));list-style:none;margin:0;padding:0}',
	'@media(min-width:900px){.mp-casos{grid-template-columns:repeat(4,minmax(0,1fr))}}',
	'.mp-caso-m{aspect-ratio:3/4;overflow:hidden;background:#E9E5F2}',
	'.mp-caso-m img,.mp-caso-m video{width:100%;height:100%;object-fit:cover;display:block}',
	'.mp-caso p{margin:8px 0 0;font-weight:700;font-size:14.5px;line-height:1.3}',
	'.mp-caso span{display:block;color:var(--muted);font-weight:500;font-size:13px}',
	'.mp-proc{display:grid;gap:28px;align-items:start}',
	'@media(min-width:900px){.mp-proc{grid-template-columns:1fr 1.3fr}}',
	'.mp-proc-m{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
	'.mp-proc-m>div{aspect-ratio:9/16;overflow:hidden;background:#E9E5F2}',
	'.mp-proc-m img,.mp-proc-m video{width:100%;height:100%;object-fit:cover;display:block}',
	'.mp-pasos{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:16px}',
	'.mp-pasos li{display:grid;grid-template-columns:38px 1fr;gap:10px}',
	'.mp-pasos i{font-style:normal;font-weight:800;color:var(--acc);font-variant-numeric:tabular-nums}',
	'.mp-pasos b{display:block}',
	'.mp-pasos span{color:var(--muted);line-height:1.5}',
	'.mp-form{display:grid;gap:14px;grid-template-columns:1fr;max-width:860px;margin-top:22px}',
	'@media(min-width:760px){.mp-form{grid-template-columns:1fr 1fr}.mp-form .is-full{grid-column:1/-1}}',
	'.mp-form label{display:grid;gap:6px;font-weight:700;font-size:14px}',
	'.mp-form label small{font-weight:500;color:var(--muted)}',
	'.mp-form input:not([type=checkbox]),.mp-form select,.mp-form textarea{font:inherit;font-weight:400;font-size:16px;border:1px solid rgba(0,0,0,.22);padding:11px 12px;background:#fff;width:100%;box-sizing:border-box}',
	'.mp-form textarea{min-height:110px;resize:vertical}',
	'.mp-check{display:flex !important;grid-template-columns:none;align-items:flex-start;gap:10px;font-weight:500 !important}',
	'.mp-check input{margin-top:3px;width:18px;height:18px;flex:none}',
	'.mp-err{color:#B3261E;font-weight:700;margin:0}',
	'.mp-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
	'.mp-ok{border:1px solid rgba(0,0,0,.12);padding:24px;max-width:640px;margin-top:22px;background:#fff}',
	'.mp-ok h3{margin:0 0 8px;font-size:22px}',
	'.mp-files{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;font-weight:500;font-size:13.5px;color:var(--muted)}',
].join('');

function CasoMedia({ c }: { c: Caso }) {
	if (c.v) return <Clip src={img(c.v + '.mp4')} poster={img(c.f + '.jpg')} label={'Video: sandalias ' + c.t} />;
	return <img src={img(c.f + '.jpg')} alt={'Sandalias personalizadas para ' + c.t} loading="lazy" />;
}

type Estado = 'listo' | 'enviando' | 'ok';

function FormCotizar() {
	const [estado, setEstado] = useState<Estado>('listo');
	const [error, setError] = useState('');
	const [archivos, setArchivos] = useState<File[]>([]);
	const [resumen, setResumen] = useState({ empresa: '', cantidad: 0 });

	function elegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
		const fs = Array.from(e.target.files || []);
		if (fs.length > 3) {
			setError('Puedes subir hasta 3 archivos.');
			e.target.value = '';
			setArchivos([]);
			return;
		}
		const grande = fs.find((f) => f.size > 10 * 1024 * 1024);
		if (grande) {
			setError('"' + grande.name + '" pesa más de 10 MB.');
			e.target.value = '';
			setArchivos([]);
			return;
		}
		setError('');
		setArchivos(fs);
	}

	async function enviar(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const f = new FormData(e.currentTarget);
		if (String(f.get('sitio') || '')) return; // campo trampa para robots
		const cantidad = Number(f.get('cantidad') || 0);
		if (!cantidad || cantidad < MINIMO) {
			setError('El pedido mínimo para marcas propias es de ' + MINIMO + ' pares.');
			return;
		}
		if (!f.get('acepta_terminos')) {
			setError('Para enviar la solicitud debes aceptar la política de datos y los términos.');
			return;
		}
		const datos = new FormData();
		for (const k of ['empresa', 'nit', 'contacto', 'cargo', 'email', 'whatsapp', 'ciudad', 'tipo', 'suela', 'tira', 'tintas', 'idea', 'fecha_requerida']) {
			datos.append(k, String(f.get(k) || '').trim());
		}
		datos.append('cantidad', String(cantidad));
		datos.append('etiqueta_propia', f.get('etiqueta_propia') ? 'true' : 'false');
		datos.append('acepta_terminos', 'true');
		datos.append('version_politica', VERSION_POLITICA);
		datos.append('estado', 'Nueva');
		archivos.forEach((a) => datos.append('logos', a));
		setError('');
		setEstado('enviando');
		try {
			await pb.collection('cotizaciones').create(datos);
			setResumen({ empresa: String(f.get('empresa') || ''), cantidad });
			setEstado('ok');
		} catch (err) {
			setEstado('listo');
			setError('No pudimos enviar la solicitud. Revisa los datos e inténtalo de nuevo, o escríbenos por WhatsApp.');
		}
	}

	if (estado === 'ok') {
		const msg = 'Hola Samar, acabo de enviar una solicitud de cotización de marca propia para ' + resumen.empresa + ' (' + resumen.cantidad + ' pares).';
		return (
			<div className="mp-ok" role="status">
				<h3>Recibimos tu solicitud</h3>
				<p>Te enviamos la cotización y una propuesta del arte en un día hábil. Si tienes prisa, escríbenos por WhatsApp.</p>
				<div className="sm-actions">
					<a href={waLink(msg)} className="sm-btn sm-btn-p" target="_blank" rel="noopener noreferrer">
						Escribir por WhatsApp
					</a>
				</div>
			</div>
		);
	}

	return (
		<form className="mp-form" onSubmit={enviar} noValidate={false}>
			<label>
				Empresa o marca
				<input name="empresa" required autoComplete="organization" />
			</label>
			<label>
				NIT <small>(opcional)</small>
				<input name="nit" inputMode="numeric" />
			</label>
			<label>
				Nombre de contacto
				<input name="contacto" required autoComplete="name" />
			</label>
			<label>
				Cargo <small>(opcional)</small>
				<input name="cargo" autoComplete="organization-title" />
			</label>
			<label>
				Correo
				<input name="email" type="email" required autoComplete="email" />
			</label>
			<label>
				WhatsApp
				<input name="whatsapp" type="tel" required autoComplete="tel" placeholder="300 000 0000" />
			</label>
			<label>
				Ciudad
				<input name="ciudad" autoComplete="address-level2" />
			</label>
			<label>
				¿Para qué son?
				<select name="tipo" defaultValue={TIPOS[0]}>
					{TIPOS.map((t) => (
						<option key={t}>{t}</option>
					))}
				</select>
			</label>
			<label>
				Cantidad de pares <small>(mínimo {MINIMO})</small>
				<input name="cantidad" type="number" min={MINIMO} step={1} required inputMode="numeric" />
			</label>
			<label>
				¿Para cuándo las necesitas? <small>(opcional)</small>
				<input name="fecha_requerida" type="date" />
			</label>
			<label>
				Color de la suela
				<select name="suela" defaultValue={SUELAS[0]}>
					{SUELAS.map((t) => (
						<option key={t}>{t}</option>
					))}
				</select>
			</label>
			<label>
				Color de la tira
				<select name="tira" defaultValue={TIRAS[0]}>
					{TIRAS.map((t) => (
						<option key={t}>{t}</option>
					))}
				</select>
			</label>
			<label className="is-full">
				Colores de tu logo o del diseño <small>(opcional)</small>
				<input name="tintas" placeholder="Ej.: rojo y blanco, o los colores de nuestro manual de marca" />
			</label>
			<label className="is-full">
				Cuéntanos tu idea
				<textarea name="idea" placeholder="Dónde va el logo, si quieres una frase, si es para regalar o para vender…" />
			</label>
			<label className="is-full">
				Tu logo o arte <small>(hasta 3 archivos: imagen o PDF, máximo 10 MB cada uno)</small>
				<input name="logos" type="file" multiple accept="image/*,application/pdf" onChange={elegirArchivos} />
				{archivos.length ? (
					<span className="mp-files">
						{archivos.map((a) => (
							<span key={a.name}>{a.name}</span>
						))}
					</span>
				) : null}
			</label>
			<label className="mp-check is-full">
				<input type="checkbox" name="etiqueta_propia" />
				Quiero la etiqueta de cada par con mi marca.
			</label>
			<label className="mp-check is-full">
				<input type="checkbox" name="acepta_terminos" required />
				<span>
					Autorizo el tratamiento de mis datos según la <Link to="/politica-de-datos">política de datos</Link> y acepto los <Link to="/terminos">términos</Link>.
				</span>
			</label>
			<div className="mp-hp" aria-hidden="true">
				<label>
					Sitio web
					<input name="sitio" tabIndex={-1} autoComplete="off" />
				</label>
			</div>
			{error ? (
				<p className="mp-err is-full" role="alert">
					{error}
				</p>
			) : null}
			<div className="sm-actions is-full">
				<button type="submit" className="sm-btn sm-btn-p" disabled={estado === 'enviando'}>
					{estado === 'enviando' ? 'Enviando…' : 'Pedir cotización'}
				</button>
			</div>
		</form>
	);
}

export default function MarcasPropiasPage() {
	const [cat, setCat] = useState(CATS[0]);
	const casos = cat === CATS[0] ? CASOS : CASOS.filter((c) => c.c === cat);
	return (
		<PageShell overlay>
			<style dangerouslySetInnerHTML={{ __html: MP_CSS }} />
			<section className="mp-hero">
				<div className="sm-wrap">
					<div>
						<p className="sm-eyebrow">Marcas propias</p>
						<h1 className="sm-h">Tu marca en una sandalia</h1>
						<p className="mp-lead">
							Fabricamos e imprimimos sandalias con tu logo para empresas, campañas, hoteles y marcas que quieren su propia línea. Hechas en nuestra planta en Cali.
						</p>
						<ul className="mp-facts">
							<li>
								<b>Desde {MINIMO} pares</b>
							</li>
							<li>
								<b>Precio por volumen</b>
							</li>
							<li>
								<b>Arte aprobado</b> antes de producir
							</li>
						</ul>
						<div className="sm-actions">
							<a href="#cotizar" className="sm-btn sm-btn-p">
								Cotizar mi marca
							</a>
							<a href="#casos" className="sm-btn sm-btn-o">
								Ver marcas
							</a>
						</div>
					</div>
					<div className="mp-hero-v">
						<Clip src={img('marcas/coca-cola-pares.mp4')} poster={img('marcas/coca-cola-pares-v.jpg')} label="Video: pares de sandalias Coca-Cola terminados" />
					</div>
				</div>
			</section>

			<section className="mp-sec">
				<div className="sm-wrap">
					<h2 className="sm-title">Para quién es</h2>
					<div className="mp-para">
						{PARA.map((p) => (
							<div key={p.t}>
								<b>{p.t}</b>
								<p>{p.p}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="mp-sec sm-sec-soft" id="casos" aria-labelledby="mp-casos-h">
				<div className="sm-wrap">
					<h2 id="mp-casos-h" className="sm-title">
						Marcas que ya caminan con Samar
					</h2>
					<div className="mp-filtros" role="group" aria-label="Filtrar marcas">
						{CATS.map((c) => (
							<button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
								{c}
							</button>
						))}
					</div>
					<ul className="mp-casos">
						{casos.map((c) => (
							<li key={c.f + c.t} className="mp-caso">
								<div className="mp-caso-m">
									<CasoMedia c={c} />
								</div>
								<p>
									{c.t}
									<span>{c.c}</span>
								</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="mp-sec">
				<div className="sm-wrap mp-proc">
					<div>
						<p className="sm-eyebrow">Cómo trabajamos</p>
						<h2 className="sm-title">De tu logo a miles de pares</h2>
						<ol className="mp-pasos">
							{PASOS.map((p, i) => (
								<li key={p[0]}>
									<i>{'0' + (i + 1)}</i>
									<div>
										<b>{p[0]}</b>
										<span>{p[1]}</span>
									</div>
								</li>
							))}
						</ol>
					</div>
					<div className="mp-proc-m">
						<div>
							<Clip src={img('marcas/coca-cola-serigrafia.mp4')} poster={img('marcas/coca-cola-serigrafia-v.jpg')} label="Video: impresión de suelas en la planta" />
						</div>
						<div>
							<img src={img('marcas/coca-cola-produccion-2.jpg')} alt="Suelas impresas secándose en la planta de producción" loading="lazy" />
						</div>
					</div>
				</div>
			</section>

			<section className="mp-sec sm-sec-soft" id="cotizar" aria-labelledby="mp-cotizar-h">
				<div className="sm-wrap">
					<h2 id="mp-cotizar-h" className="sm-title">
						Pide tu cotización
					</h2>
					<p className="sm-mt">Cuéntanos de tu marca y te enviamos el precio por volumen y una propuesta del arte. Sin compromiso.</p>
					<FormCotizar />
					<p className="sm-note">
						¿Prefieres hablar?{' '}
						<a href={waLink('Hola Samar, quiero cotizar sandalias con la marca de mi empresa.')} target="_blank" rel="noopener noreferrer">
							Escríbenos por WhatsApp
						</a>
						.
					</p>
				</div>
			</section>
		</PageShell>
	);
}

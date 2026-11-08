import { useState } from 'react';
import { Link } from 'react-router';
import type { Route } from './+types/experiencias';
import { seo } from '@/lib/seo';
import { Clip, FONT_LINKS, IMG_BASE, MOODS, MoodCard, PageHead, PageShell, img } from '@/components/samar-kit';

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Experiencias | Samar Padridin',
		description: 'Así se vive la noche con sandalias Samar: videos de celebraciones reales. Luego elige la experiencia de tu evento: boda romántica, jardín, fiesta, tropical o tierno.',
	});
}

export const links: Route.LinksFunction = () => FONT_LINKS;

type Momento = { n: string; t: string; p: string; file: string; video?: string };
type Historia = { id: string; tab: string; sub: string; momentos: Momento[]; final?: boolean };

// Historias contadas con video de celebraciones reales con sandalias Samar
const HISTORIAS: Historia[] = [
	{
		id: 'santa-marta',
		tab: 'Una noche en Santa Marta',
		sub: 'De las canastas a los fuegos artificiales, en una celebración real con sandalias Samar.',
		final: true,
		momentos: [
			{ n: '1', t: 'Llegan las canastas', p: 'Cuando la pista se llena, aparecen las canastas con todos los pares listos.', file: 'experiencias/llegan-canastas.jpg', video: 'experiencias/llegan-canastas.mp4' },
			{ n: '2', t: 'Cada quien escoge su talla', p: 'Cada par trae su etiqueta. Se busca la talla y se estrena ahí mismo.', file: 'experiencias/escogen-talla.jpg', video: 'experiencias/escogen-talla.mp4' },
			{ n: '3', t: 'Adiós tacones', p: 'Los tacones se quedan en el piso y nadie se va temprano por dolor de pies.', file: 'experiencias/adios-tacones.jpg', video: 'experiencias/adios-tacones.mp4' },
			{ n: '4', t: 'Y a bailar', p: 'Con los pies descansados, la pista no se vacía hasta la última canción.', file: 'experiencias/a-bailar.jpg', video: 'experiencias/a-bailar.mp4' },
		],
	},
	{
		id: 'tropical',
		tab: 'Una boda tropical',
		sub: 'De la mesa de sandalias a la pista de luces, en una boda real con sandalias Samar.',
		momentos: [
			{ n: '1', t: 'La mesa de sandalias', p: 'Canastas ordenadas por talla, listas desde que empieza la fiesta.', file: 'experiencias/tropical-mesa.jpg', video: 'experiencias/tropical-mesa.mp4' },
			{ n: '2', t: 'La novia escoge las suyas', p: 'La primera en estrenarlas es la novia.', file: 'experiencias/tropical-novia.jpg', video: 'experiencias/tropical-novia.mp4' },
			{ n: '3', t: 'Cada invitada encuentra su talla', p: 'Cada quien busca su número y se las pone en un minuto.', file: 'experiencias/tropical-escogen.jpg', video: 'experiencias/tropical-escogen.mp4' },
			{ n: '4', t: 'A la pista de luces', p: 'Vestidos de flores, sandalias Samar y toda la noche bailando.', file: 'experiencias/tropical-pista.jpg', video: 'experiencias/tropical-pista.mp4' },
		],
	},
];

const EX_CSS = [
	'.ex-noche{padding:0 0 64px}',
	'.ex-sel{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}',
	'.ex-sel button{border:1px solid rgba(0,0,0,.2);background:#fff;color:#141414;padding:10px 16px;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer}',
	'.ex-sel button[aria-selected="true"]{background:#120B1F;color:#fff;border-color:#120B1F}',
	'.ex-sel button:focus-visible{outline:3px solid var(--acc);outline-offset:2px}',
	'.ex-sub{color:var(--muted);font-size:16px;line-height:1.5;margin:0 0 24px;max-width:620px}',
	'.ex-steps{list-style:none;margin:0;padding:0;display:grid;gap:32px 16px;grid-template-columns:1fr}',
	'.ex-media{position:relative;aspect-ratio:4/5;overflow:hidden;background:#E9E5F2}',
	'.ex-media img,.ex-media video{width:100%;height:100%;object-fit:cover;display:block}',
	'.ex-n{font-weight:800;font-size:15px;color:var(--acc);margin:14px 0 2px;font-variant-numeric:tabular-nums}',
	'.ex-t{font-size:21px;font-weight:800;letter-spacing:-0.01em;line-height:1.15;margin:0}',
	'.ex-p{color:var(--muted);font-size:15.5px;line-height:1.55;margin:6px 0 0;max-width:42ch}',
	'.ex-final{position:relative;margin:40px 0 0;background:#120B1F;color:#fff;overflow:hidden}',
	'.ex-final img{width:100%;aspect-ratio:3/2;object-fit:cover;display:block}',
	'.ex-final figcaption{display:flex;flex-direction:column;gap:6px;padding:22px 20px 24px}',
	'.ex-final .ex-n{color:#E7C27D;margin:0}',
	'.ex-final b{font-size:clamp(22px,3.2vw,32px);font-weight:800;line-height:1.12;letter-spacing:-0.01em;max-width:22ch}',
	'.ex-final span.ex-lead{color:rgba(255,255,255,.82);font-size:16px;line-height:1.5}',
	'.ex-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}',
	'.ex-final .sm-btn-p{background:#fff !important;color:#141414 !important;border-color:#fff !important}',
	'.ex-btn-l{background:transparent;border-color:rgba(255,255,255,.75);color:#fff}',
	'.ex-final a:focus-visible{outline:3px solid #E7C27D;outline-offset:2px}',
	'.ex-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}',
	'.ex-estilos{padding:56px 0 64px}',
	'.ex-estilos .ex-sub{margin:10px 0 22px}',
	'.ex-moods{display:grid;grid-auto-flow:column;grid-auto-columns:72%;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:8px;scrollbar-width:none}',
	'.ex-moods::-webkit-scrollbar{display:none}',
	'.ex-moods>*{scroll-snap-align:start;min-width:0}',
	'@media(min-width:640px){.ex-moods{grid-auto-columns:42%}}',
	'@media(min-width:760px){.ex-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.ex-final img{max-height:640px;object-position:50% 62%}.ex-final figcaption{position:absolute;left:0;right:0;bottom:0;padding:120px 40px 36px;background:linear-gradient(180deg,rgba(18,11,31,0) 0%,rgba(18,11,31,.88) 100%)}}',
	'@media(min-width:1100px){.ex-steps{grid-template-columns:repeat(4,minmax(0,1fr))}.ex-moods{grid-auto-columns:calc((100% - 56px) / 5)}}',
].join('\n');

export default function Experiencias() {
	const [hid, setHid] = useState(HISTORIAS[0].id);
	const h = HISTORIAS.find((x) => x.id === hid) || HISTORIAS[0];
	return (
		<PageShell>
			<style dangerouslySetInnerHTML={{ __html: EX_CSS }} />
			<PageHead eyebrow="Experiencias" title="Así se vive la noche" text="Fotos y video de celebraciones reales con sandalias Samar." />

			<section className="ex-noche" aria-label="Historias en video">
				<div className="sm-wrap">
					<div className="ex-sel" role="tablist" aria-label="Elige una historia">
						{HISTORIAS.map((x) => (
							<button key={x.id} type="button" role="tab" id={'tab-' + x.id} aria-selected={x.id === h.id} aria-controls="ex-historia" onClick={() => setHid(x.id)}>
								{x.tab}
							</button>
						))}
					</div>
					<div id="ex-historia" role="tabpanel" aria-labelledby={'tab-' + h.id}>
						<p className="ex-sub">{h.sub}</p>
						<ol className="ex-steps" key={h.id}>
							{h.momentos.map((m) => (
								<li key={h.id + m.n}>
									<div className="ex-media">
										{IMG_BASE ? m.video ? <Clip src={img(m.video)} poster={img(m.file)} label={'Video: ' + m.t} /> : <img src={img(m.file)} alt={m.t} loading="lazy" /> : null}
									</div>
									<p className="ex-n">{m.n}</p>
									<h3 className="ex-t">{m.t}</h3>
									<p className="ex-p">{m.p}</p>
								</li>
							))}
						</ol>
						{h.final ? (
							<figure className="ex-final">
								{IMG_BASE ? <img src={img('experiencias/fuegos-noche.jpg')} alt="Fuegos artificiales sobre el monumento, con los invitados en la plaza" loading="lazy" /> : null}
								<figcaption>
									<span className="ex-n">5</span>
									<b>Y la fiesta sigue hasta los fuegos artificiales</b>
									<span className="ex-lead">En sandalias se baila hasta el final.</span>
									<span className="ex-cta">
										<Link to="/disenar?sueno=1" className="sm-btn sm-btn-p">
											Sueña tu fiesta
										</Link>
										<Link to="/galeria" className="sm-btn ex-btn-l">
											Ver la galería
										</Link>
									</span>
								</figcaption>
							</figure>
						) : (
							<div className="ex-cta-row">
								<Link to="/disenar?sueno=1" className="sm-btn sm-btn-p">
									Sueña tu fiesta
								</Link>
								<Link to="/galeria" className="sm-btn sm-btn-o">
									Ver la galería
								</Link>
							</div>
						)}
					</div>
				</div>
			</section>

			<section className="sm-sec-soft ex-estilos" aria-labelledby="ex-estilos-h">
				<div className="sm-wrap">
					<p className="sm-eyebrow">Elige tu experiencia</p>
					<h2 id="ex-estilos-h" className="sm-title">
						Cada celebración tiene su estilo
					</h2>
					<p className="ex-sub">Elige la que más se parece a tu evento y empieza tu diseño desde ahí. Colores, textos y estilo se pueden cambiar en el diseñador.</p>
					<div className="ex-moods">
						{MOODS.map((m) => (
							<MoodCard key={m.id} m={m} />
						))}
					</div>
				</div>
			</section>
		</PageShell>
	);
}

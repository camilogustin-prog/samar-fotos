import { useIdioma } from '@/lib/idioma';

// Banderas dibujadas en SVG (los emojis de bandera no se ven en Windows)
function BanderaColombia() {
	return (
		<svg viewBox="0 0 3 2" aria-hidden="true" focusable="false">
			<rect width="3" height="1" fill="#FCD116" />
			<rect y="1" width="3" height="0.5" fill="#003893" />
			<rect y="1.5" width="3" height="0.5" fill="#CE1126" />
		</svg>
	);
}

function BanderaEstadosUnidos() {
	const franjas = [0, 2, 4, 6, 8, 10, 12];
	const estrellas = [
		[0.18, 0.15],
		[0.42, 0.15],
		[0.66, 0.15],
		[0.9, 0.15],
		[0.3, 0.38],
		[0.54, 0.38],
		[0.78, 0.38],
		[0.18, 0.61],
		[0.42, 0.61],
		[0.66, 0.61],
		[0.9, 0.61],
		[0.3, 0.84],
		[0.54, 0.84],
		[0.78, 0.84],
	];
	return (
		<svg viewBox="0 0 3 2" aria-hidden="true" focusable="false">
			<rect width="3" height="2" fill="#FFFFFF" />
			{franjas.map((i) => (
				<rect key={i} y={(i * 2) / 13} width="3" height={2 / 13} fill="#B22234" />
			))}
			<rect width="1.2" height={(2 / 13) * 7} fill="#3C3B6E" />
			{estrellas.map(([x, y]) => (
				<circle key={x + '-' + y} cx={x * 1.2} cy={y * ((2 / 13) * 7)} r="0.045" fill="#FFFFFF" />
			))}
		</svg>
	);
}

/**
 * Selector de idioma del encabezado con las banderas de Colombia (español) y Estados Unidos
 * (inglés). `className`: 'sm-lang-m' (celular, junto al menú) o 'sm-lang-d' (computador, junto
 * a Diseñar). Los estilos están en CSS_IDIOMA (lib/idioma.ts).
 */
export function SelectorIdioma({ className = '' }: { className?: string }) {
	const [l, elegir] = useIdioma();
	return (
		<div className={'sm-lang ' + className} role="group" aria-label="Idioma / Language" translate="no">
			<button type="button" lang="es" aria-pressed={l === 'es'} aria-label="Español" title="Ver en español" onClick={() => elegir('es')}>
				<BanderaColombia />
			</button>
			<button type="button" lang="en" aria-pressed={l === 'en'} aria-label="English" title="View in English" onClick={() => elegir('en')}>
				<BanderaEstadosUnidos />
			</button>
		</div>
	);
}

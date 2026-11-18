import { useIdioma } from '@/lib/idioma';

/**
 * Selector ES | EN del encabezado. `className`: 'sm-lang-m' (celular, junto al menú) o
 * 'sm-lang-d' (computador, junto a Diseñar). Los estilos están en CSS_IDIOMA (lib/idioma.ts).
 */
export function SelectorIdioma({ className = '' }: { className?: string }) {
	const [l, elegir] = useIdioma();
	return (
		<div className={'sm-lang ' + className} role="group" aria-label="Idioma / Language" translate="no">
			<button type="button" lang="es" aria-pressed={l === 'es'} title="Ver en español" onClick={() => elegir('es')}>
				ES
			</button>
			<span aria-hidden="true">|</span>
			<button type="button" lang="en" aria-pressed={l === 'en'} title="View in English" onClick={() => elegir('en')}>
				EN
			</button>
		</div>
	);
}

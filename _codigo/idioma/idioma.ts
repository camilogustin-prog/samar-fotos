/**
 * Idioma del sitio: español (el original) o inglés.
 *
 * El sitio está escrito en español. Cuando el idioma es inglés, este módulo cambia el texto
 * que se ve en la página usando el diccionario de `idioma-en.ts`, apenas React termina de
 * cargar la página, y sigue cambiando lo que aparezca después (pasos del diseñador, avisos,
 * menús). Solo cambia lo que se ve: los datos que se guardan (pedidos, diseños, formularios)
 * siguen en español, así el equipo de Samar los recibe igual que siempre.
 *
 * Quién ve la página en inglés:
 * 1. Quien eligió idioma con el selector ES | EN (se recuerda en su navegador).
 * 2. Si no ha elegido: quien está en Estados Unidos (por su IP, con /api/samar/region, o por
 *    la zona horaria de su navegador) o tiene el navegador en inglés.
 *
 * El panel de pedidos (/admin) siempre queda en español.
 * Para que una parte de la página no se traduzca, se le pone translate="no".
 */
import { useEffect, useState } from 'react';
import { pocketbaseClient } from '@/lib/pocketbase-client';
import { EN, EN_PATRONES } from '@/lib/idioma-en';

export type Idioma = 'es' | 'en';

const CLAVE = 'samar_idioma';
const ZONAS_USA =
	/^(America\/(New_York|Detroit|Kentucky\/|Indiana\/|Chicago|Menominee|North_Dakota\/|Denver|Boise|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak)|Pacific\/Honolulu|US\/)/;

/**
 * Va en el <head>: decide el idioma antes de pintar la página. Si es inglés, la página
 * espera invisible hasta que el texto está traducido (máximo 2,5 s), para que no se vea
 * primero en español.
 */
export const SCRIPT_IDIOMA =
	'(function(){try{var d=document.documentElement,l="";try{l=localStorage.getItem("' +
	CLAVE +
	'")||""}catch(e){}if(l!=="es"&&l!=="en"){var z="";try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}' +
	'var n=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();l=(' +
	ZONAS_USA.toString() +
	'.test(z)||n.indexOf("en")===0)?"en":"es"}if(l==="en"&&location.pathname.indexOf("/admin")!==0){d.setAttribute("data-idioma","en");d.lang="en";' +
	'setTimeout(function(){d.setAttribute("data-idioma-listo","")},2500)}}catch(e){}})();';

/** Estilos del selector ES | EN y de la espera mientras se traduce. */
export const CSS_IDIOMA = [
	'html[data-idioma="en"]:not([data-idioma-listo]) body{opacity:0}',
	'.sm-lang{display:inline-flex;align-items:center;gap:1px;font-size:13px;font-weight:700;letter-spacing:.06em;line-height:1;white-space:nowrap}',
	'.sm-lang button{background:none;border:0;border-bottom:2px solid transparent;padding:7px 4px 5px;margin:0;font:inherit;color:inherit;cursor:pointer;opacity:.55}',
	'.sm-lang button[aria-pressed="true"]{opacity:1;border-bottom-color:currentColor}',
	'.sm-lang button:hover{opacity:1}',
	'.sm-lang button:focus-visible{outline:2px solid currentColor;outline-offset:2px}',
	'.sm-lang span{opacity:.35}',
	'.sm-lang-m{margin-left:2px}',
	'.sm-lang-d{display:none !important;margin-right:12px}',
	'@media(min-width:1060px){.sm-lang-m{display:none !important}.sm-lang-d{display:inline-flex !important}}',
].join('');

let actual: Idioma = 'es';
let iniciado = false;
const avisos = new Set<(l: Idioma) => void>();

// Lo que nunca se traduce (de los campos de texto solo se traduce el texto de ayuda, no lo que escribe la persona)
const EXCLUIR = 'script,style,noscript,textarea,code,pre,[translate="no"],[data-no-traducir],[contenteditable="true"]';
const EXCLUIR_ATR = 'script,style,noscript,code,pre,[translate="no"],[data-no-traducir],[contenteditable="true"]';
const ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];

// Texto original (en español) y texto puesto por nosotros, por nodo
const original = new WeakMap<Text, string>();
const puesto = new WeakMap<Text, string>();
const originalAtr = new WeakMap<Element, Record<string, string>>();
const puestoAtr = new WeakMap<Element, Record<string, string>>();
let cambiadosTxt = new Set<Text>();
let cambiadosAtr = new Set<Element>();
let observador: MutationObserver | null = null;

const limpiar = (s: string) => s.replace(/\s+/g, ' ').trim();
const enAdmin = () => typeof location !== 'undefined' && location.pathname.indexOf('/admin') === 0;

const MESES: Record<string, string> = {
	enero: 'January',
	febrero: 'February',
	marzo: 'March',
	abril: 'April',
	mayo: 'May',
	junio: 'June',
	julio: 'July',
	agosto: 'August',
	septiembre: 'September',
	setiembre: 'September',
	octubre: 'October',
	noviembre: 'November',
	diciembre: 'December',
};
const DIAS: Record<string, string> = {
	lunes: 'Monday',
	martes: 'Tuesday',
	miércoles: 'Wednesday',
	jueves: 'Thursday',
	viernes: 'Friday',
	sábado: 'Saturday',
	domingo: 'Sunday',
};

// Fechas y horas escritas en español: "miércoles, 18 de noviembre, 3:00 p. m.", "12 de diciembre de 2026", "9:00 p. m."
function fechaEn(s: string): string | null {
	let m = /^(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?$/i.exec(s);
	if (m) return m[1] + ':' + m[2] + ' ' + (m[3].toLowerCase() === 'a' ? 'AM' : 'PM');
	m = /^(?:([a-záéíóú]+),?\s+)?(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?(?:,?\s+(?:a\s+las\s+)?(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?)?$/i.exec(s);
	if (!m) return null;
	const mes = MESES[m[3].toLowerCase()];
	if (!mes) return null;
	const dia = m[1] ? DIAS[m[1].toLowerCase()] : '';
	if (m[1] && !dia) return null;
	let out = (dia ? dia + ', ' : '') + mes + ' ' + m[2] + (m[4] ? ', ' + m[4] : '');
	if (m[5]) out += ', ' + m[5] + ':' + m[6] + ' ' + (m[7].toLowerCase() === 'a' ? 'AM' : 'PM');
	return out;
}

function buscar(s: string): string | null {
	const directo = EN[s];
	if (directo !== undefined) return directo;
	for (const [re, f] of EN_PATRONES) {
		const m = re.exec(s);
		if (m) return f(m, (x: string) => buscar(limpiar(x)) ?? x);
	}
	return fechaEn(s);
}

/** Traduce un texto al inglés. Devuelve null si no está en el diccionario. */
export function traducirTexto(s: string): string | null {
	const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
	if (!m) return null;
	const nucleo = limpiar(m[2]);
	if (!nucleo || !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(nucleo)) return null;
	const en = buscar(nucleo);
	return en == null ? null : m[1] + en + m[3];
}

function excluidoArriba(n: Node): boolean {
	const el = n.nodeType === 1 ? (n as Element) : n.parentElement;
	return !el || !!el.closest(EXCLUIR);
}

function atrExcluido(el: Element): boolean {
	return !!el.closest(EXCLUIR_ATR);
}

function podar() {
	if (cambiadosTxt.size > 4000) cambiadosTxt = new Set([...cambiadosTxt].filter((t) => t.isConnected));
	if (cambiadosAtr.size > 4000) cambiadosAtr = new Set([...cambiadosAtr].filter((e) => e.isConnected));
}

function textoNodo(t: Text) {
	const v = t.nodeValue || '';
	if (puesto.get(t) === v) return;
	original.set(t, v);
	puesto.delete(t);
	const en = traducirTexto(v);
	if (en != null && en !== v) {
		puesto.set(t, en);
		cambiadosTxt.add(t);
		podar();
		t.nodeValue = en;
	}
}

function whatsappEn(h: string): string | null {
	const m = /[?&]text=([^&#]*)/.exec(h);
	if (!m) return null;
	let txt = '';
	try {
		txt = decodeURIComponent(m[1].replace(/\+/g, ' '));
	} catch (_) {
		return null;
	}
	const en = traducirTexto(txt);
	if (en == null) return null;
	return h.slice(0, m.index + m[0].length - m[1].length) + encodeURIComponent(en) + h.slice(m.index + m[0].length);
}

function cambiarAtr(el: Element, a: string, v: string, en: string | null) {
	const p = puestoAtr.get(el);
	if (p && p[a] === v) return;
	const o = originalAtr.get(el) || {};
	o[a] = v;
	originalAtr.set(el, o);
	if (p) delete p[a];
	if (en != null && en !== v) {
		const q = puestoAtr.get(el) || {};
		q[a] = en;
		puestoAtr.set(el, q);
		cambiadosAtr.add(el);
		podar();
		el.setAttribute(a, en);
	}
}

function atributos(el: Element) {
	for (const a of ATRIBUTOS) {
		const v = el.getAttribute(a);
		if (v != null) cambiarAtr(el, a, v, traducirTexto(v));
	}
	if (el.tagName === 'A') {
		const h = el.getAttribute('href') || '';
		if (/wa\.me\/|api\.whatsapp\.com/.test(h)) cambiarAtr(el, 'href', h, whatsappEn(h));
	}
}

function recorrer(raiz: Node) {
	if (raiz.nodeType === 3) {
		if (!excluidoArriba(raiz)) textoNodo(raiz as Text);
		return;
	}
	if (raiz.nodeType !== 1) return;
	const el = raiz as Element;
	if (!atrExcluido(el)) atributos(el);
	if (excluidoArriba(el)) return;
	const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
		acceptNode: (n) => {
			if (n.nodeType !== 1 || !(n as Element).matches(EXCLUIR)) return NodeFilter.FILTER_ACCEPT;
			if (!(n as Element).matches(EXCLUIR_ATR)) atributos(n as Element); // textarea: su texto de ayuda sí
			return NodeFilter.FILTER_REJECT;
		},
	});
	for (let n = tw.nextNode(); n; n = tw.nextNode()) {
		if (n.nodeType === 3) textoNodo(n as Text);
		else atributos(n as Element);
	}
}

function alCambiar(regs: MutationRecord[]) {
	if (actual !== 'en' || enAdmin()) return;
	for (const r of regs) {
		if (r.type === 'characterData') {
			if (!excluidoArriba(r.target)) textoNodo(r.target as Text);
		} else if (r.type === 'attributes') {
			if (!atrExcluido(r.target as Element)) atributos(r.target as Element);
		} else {
			r.addedNodes.forEach((n) => recorrer(n));
		}
	}
}

function conectar() {
	if (observador) return;
	observador = new MutationObserver(alCambiar);
	observador.observe(document.documentElement, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: [...ATRIBUTOS, 'href'],
	});
}

function desconectar() {
	if (observador) observador.disconnect();
	observador = null;
}

function restaurar() {
	cambiadosTxt.forEach((t) => {
		const o = original.get(t);
		puesto.delete(t);
		if (o != null && t.nodeValue !== o) t.nodeValue = o;
	});
	cambiadosAtr.forEach((el) => {
		const o = originalAtr.get(el);
		puestoAtr.delete(el);
		if (o) for (const a of Object.keys(o)) if (el.getAttribute(a) !== o[a]) el.setAttribute(a, o[a]);
	});
	cambiadosTxt = new Set();
	cambiadosAtr = new Set();
}

function aplicar(l: Idioma) {
	actual = l;
	const d = document.documentElement;
	const en = l === 'en' && !enAdmin();
	d.lang = en ? 'en' : 'es';
	if (en) {
		d.setAttribute('data-idioma', 'en');
		recorrer(d);
		conectar();
	} else {
		d.removeAttribute('data-idioma');
		desconectar();
		restaurar();
	}
	d.setAttribute('data-idioma-listo', '');
	avisos.forEach((f) => f(l));
}

function elegido(): Idioma | '' {
	try {
		const v = window.localStorage.getItem(CLAVE);
		if (v === 'es' || v === 'en') return v;
	} catch (_) {
		// sin almacenamiento
	}
	return '';
}

function zonaUsa(): boolean {
	try {
		return ZONAS_USA.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
	} catch (_) {
		return false;
	}
}

function navegadorEnIngles(): boolean {
	const n = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
	return n.indexOf('en') === 0;
}

let region: Promise<string> | null = null;

/** País de quien visita según su IP ('US', 'CO'…), o '' si no se sabe. */
export function paisVisitante(): Promise<string> {
	if (!region) {
		region = Promise.resolve(pocketbaseClient.send('/api/samar/region', { method: 'GET' }))
			.then((r: { pais?: string }) => String((r && r.pais) || '').toUpperCase())
			.catch(() => '');
	}
	return region;
}

/** Arranca el idioma una sola vez, cuando la página ya cargó. */
export function iniciarIdioma() {
	if (iniciado || typeof window === 'undefined') return;
	iniciado = true;
	const fijo = elegido();
	aplicar(fijo || (zonaUsa() || navegadorEnIngles() ? 'en' : 'es'));
	if (fijo) return;
	paisVisitante().then((p) => {
		if (!p || elegido()) return;
		const l: Idioma = p === 'US' || navegadorEnIngles() ? 'en' : 'es';
		if (l !== actual) aplicar(l);
	});
}

/** Cambia el idioma y lo recuerda en el navegador. */
export function elegirIdioma(l: Idioma) {
	try {
		window.localStorage.setItem(CLAVE, l);
	} catch (_) {
		// sin almacenamiento
	}
	try {
		document.cookie = CLAVE + '=' + l + ';path=/;max-age=31536000;samesite=lax';
	} catch (_) {
		// sin cookies
	}
	if (l !== actual) aplicar(l);
}

/** Idioma actual y función para cambiarlo (para el selector). */
export function useIdioma(): [Idioma, (l: Idioma) => void] {
	const [l, setL] = useState<Idioma>('es');
	useEffect(() => {
		setL(actual);
		avisos.add(setL);
		return () => {
			avisos.delete(setL);
		};
	}, []);
	return [l, elegirIdioma];
}

/** Se llama una vez en la raíz del sitio (root.tsx). */
export function useMotorIdioma() {
	useEffect(() => {
		iniciarIdioma();
	}, []);
}

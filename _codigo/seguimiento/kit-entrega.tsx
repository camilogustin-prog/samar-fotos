
// ---------------------------------------------------------------------------
// Lugar de entrega, envío y plazo de pago (8 nov 2026)
// Las listas, las zonas y ENVIO_CO deben coincidir con el servidor (samar-pedidos.pb.js).
// ---------------------------------------------------------------------------

export type Entrega = {
	pais: '' | 'CO' | 'US';
	departamento: string;
	ciudad: string;
	direccion: string;
	barrio: string;
	estado: string;
	codigo_postal: string;
	recibe: string;
	confirma: boolean;
};

export const ENTREGA_VACIA: Entrega = { pais: '', departamento: '', ciudad: '', direccion: '', barrio: '', estado: '', codigo_postal: '', recibe: '', confirma: false };

export const DEPARTAMENTOS_CO = [
	'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca',
	'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
	'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
	'Valle del Cauca', 'Vaupés', 'Vichada',
];

export const CIUDADES_CO = [
	'Cali', 'Jamundí', 'Yumbo', 'Palmira', 'Candelaria', 'Buga', 'Tuluá', 'Cartago', 'Buenaventura', 'Bogotá', 'Medellín', 'Envigado',
	'Itagüí', 'Bello', 'Rionegro', 'Barranquilla', 'Cartagena', 'Santa Marta', 'Bucaramanga', 'Floridablanca', 'Pereira', 'Dosquebradas',
	'Armenia', 'Manizales', 'Ibagué', 'Neiva', 'Pasto', 'Popayán', 'Villavicencio', 'Cúcuta', 'Montería', 'Sincelejo', 'Valledupar',
	'Riohacha', 'Tunja', 'Yopal', 'Chía', 'Zipaquirá', 'Soacha', 'Girardot',
];

export const ESTADOS_US: [string, string][] = [
	['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'],
	['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
	['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
	['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'],
	['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
	['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'],
	['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
	['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

// Envío dentro de Colombia por zona, en pesos. null = el valor se confirma por WhatsApp.
// 1 Cali y alrededores · 2 resto del Valle y Eje Cafetero · 3 ciudades principales · 4 resto del país
export const ENVIO_CO: Record<number, number | null> = { 1: null, 2: null, 3: null, 4: null };
export const PARES_POR_CAJA = 0; // 0 = valor por pedido

const sinTilde = (s: string) =>
	String(s || '')
		.toLowerCase()
		.replace(/[áàä]/g, 'a')
		.replace(/[éèë]/g, 'e')
		.replace(/[íìï]/g, 'i')
		.replace(/[óòö]/g, 'o')
		.replace(/[úùü]/g, 'u')
		.replace(/ñ/g, 'n')
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

export function zonaEnvioCO(departamento: string, ciudad: string): number {
	const d = sinTilde(departamento);
	const c = sinTilde(ciudad);
	if (d.indexOf('san andres') === 0) return 5;
	if (d === 'valle del cauca' && ['cali', 'santiago de cali', 'jamundi', 'yumbo', 'palmira', 'candelaria'].indexOf(c) >= 0) return 1;
	if (['valle del cauca', 'risaralda', 'quindio', 'caldas'].indexOf(d) >= 0) return 2;
	if (d === 'bogota d c' || ['bogota', 'medellin', 'barranquilla', 'cartagena', 'cartagena de indias', 'bucaramanga', 'santa marta'].indexOf(c) >= 0) return 3;
	return 4;
}

export function calcEnvio(e: Entrega, pares: number, moneda: string): { valor: number; etiqueta: string; texto: string } {
	if (e.pais === 'US' || (!e.pais && moneda === 'USD')) return { valor: 0, etiqueta: 'Envío a Estados Unidos', texto: 'Incluido' };
	if (e.pais !== 'CO') return { valor: 0, etiqueta: 'Envío', texto: 'Según el lugar de entrega' };
	if (!e.departamento || e.ciudad.trim().length < 2) return { valor: 0, etiqueta: 'Envío', texto: 'Según la ciudad' };
	const zona = zonaEnvioCO(e.departamento, e.ciudad);
	const etiqueta = 'Envío a ' + e.ciudad.trim();
	if (zona === 5) return { valor: 0, etiqueta, texto: 'Se cotiza por WhatsApp' };
	const v = ENVIO_CO[zona];
	if (typeof v !== 'number') return { valor: 0, etiqueta, texto: 'Lo confirmamos por WhatsApp' };
	const valor = PARES_POR_CAJA > 0 ? v * Math.ceil(Math.max(pares, 1) / PARES_POR_CAJA) : v;
	return { valor, etiqueta, texto: valor > 0 ? fmtMoneda(valor, 'COP') : 'Gratis' };
}

export function faltaEntrega(e: Entrega): { t: string; campo: string } | null {
	if (e.pais !== 'CO' && e.pais !== 'US') return { t: 'Elige dónde se entregan las sandalias: Colombia o Estados Unidos.', campo: 'e-pais' };
	if (e.pais === 'CO') {
		if (DEPARTAMENTOS_CO.indexOf(e.departamento) < 0) return { t: 'Elige el departamento de entrega.', campo: 'e-dep' };
		if (zonaEnvioCO(e.departamento, e.ciudad) === 5) return { t: 'Para San Andrés y Providencia cotizamos el envío por WhatsApp. Escríbenos y te ayudamos.', campo: 'e-dep' };
		if (e.ciudad.trim().length < 2) return { t: 'Escribe la ciudad o municipio de entrega.', campo: 'e-ciudad' };
		if (e.direccion.trim().length < 6) return { t: 'Escribe la dirección de entrega completa.', campo: 'e-dir' };
	} else {
		if (!ESTADOS_US.some((s) => s[0] === e.estado)) return { t: 'Elige el estado de Estados Unidos.', campo: 'e-estado' };
		if (e.estado === 'AK' || e.estado === 'HI') return { t: 'Para Alaska y Hawái cotizamos el envío por WhatsApp. Escríbenos y te ayudamos.', campo: 'e-estado' };
		if (e.ciudad.trim().length < 2) return { t: 'Escribe la ciudad de entrega.', campo: 'e-ciudad' };
		if (!/^\d{5}$/.test(e.codigo_postal.trim())) return { t: 'Escribe el código postal (ZIP) de 5 dígitos.', campo: 'e-zip' };
		if (e.direccion.trim().length < 6) return { t: 'Escribe la dirección de entrega completa.', campo: 'e-dir' };
	}
	if (!e.confirma) return { t: 'Confirma que la dirección de entrega es correcta.', campo: 'e-confirma' };
	return null;
}

export function resumenEntrega(e: Entrega): string {
	if (e.pais === 'US') return [e.direccion.trim(), e.ciudad.trim() + ', ' + e.estado + ' ' + e.codigo_postal.trim(), 'Estados Unidos'].filter(Boolean).join(' · ');
	if (e.pais === 'CO') return [e.direccion.trim() + (e.barrio.trim() ? ', barrio ' + e.barrio.trim() : ''), e.ciudad.trim() + ', ' + e.departamento].filter(Boolean).join(' · ');
	return '';
}

// Días desde hoy (Colombia) hasta la fecha del evento (AAAA-MM-DD)
export function diasHasta(ymd: string): number {
	const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!m) return 9999;
	const ev = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 17, 0, 0);
	return Math.floor((ev - Date.now()) / 86400000);
}

// Fecha y hora límite de pago en hora de Colombia
export function fmtVence(iso: string): string {
	const t = Date.parse(String(iso || ''));
	if (isNaN(t)) return '';
	try {
		return new Date(t).toLocaleString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
	} catch (_) {
		return new Date(t).toLocaleString();
	}
}

// "(quedan 23 h)", "(quedan 40 min)" o "(venció)"
export function restante(iso: string): string {
	const t = Date.parse(String(iso || ''));
	if (isNaN(t)) return '';
	const ms = t - Date.now();
	if (ms <= 0) return '(venció)';
	const h = Math.floor(ms / 3600000);
	if (h >= 1) return '(quedan ' + h + ' h)';
	return '(quedan ' + Math.max(1, Math.round(ms / 60000)) + ' min)';
}

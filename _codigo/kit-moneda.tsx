

// ---- Moneda: pesos (COP) o dólares (USD) ----
// En Estados Unidos los precios se muestran en dólares (envío incluido). Wompi cobra en pesos: el servidor
// convierte el anticipo en dólares a pesos con la TRM del día. Escalas USD: combo de 12+ = US$19 y las demás
// en la misma proporción que en pesos, redondeadas a medio dólar (decisión de Andrés, 8 nov 2026).
export const TIERS_USD = [
	{ min: 12, max: 23, price: 19 },
	{ min: 24, max: 35, price: 17.5 },
	{ min: 36, max: 47, price: 16.5 },
	{ min: 48, max: 59, price: 15 },
	{ min: 60, max: 71, price: 14.5 },
	{ min: 72, max: 107, price: 13 },
	{ min: 108, max: 143, price: 12 },
	{ min: 144, max: 0, price: 10.5 },
];

const ZONAS_USA = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Yakutat|Metlakatla|Adak|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu)$/;

export function fmtMoneda(n: number, moneda?: string) {
	if (moneda === 'USD') {
		const v = Math.round((Number(n) || 0) * 100) / 100;
		return 'US$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
	}
	return '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function precioPar(pares: number, moneda?: string) {
	const t = moneda === 'USD' ? TIERS_USD : TIERS;
	let p = t[0].price;
	for (const s of t) if (pares >= s.min && (s.max === 0 || pares <= s.max)) p = s.price;
	return p;
}

// Moneda de la persona: la que eligió (se recuerda en el navegador) o, si no ha elegido, según su país.
export function useMoneda(): [string, (m: string) => void] {
	const [m, setM] = useState('COP');
	useEffect(() => {
		let fijada = '';
		try {
			fijada = window.localStorage.getItem('samar_moneda') || '';
		} catch (_) {
			// sin almacenamiento
		}
		if (fijada === 'USD' || fijada === 'COP') {
			setM(fijada);
			return;
		}
		let vivo = true;
		let tz = '';
		try {
			tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
		} catch (_) {
			tz = '';
		}
		Promise.resolve(PB.send('/api/samar/region', { method: 'GET' }))
			.then((r: { pais?: string }) => {
				if (!vivo) return;
				const p = String((r && r.pais) || '').toUpperCase();
				if (p) setM(p === 'US' ? 'USD' : 'COP');
				else if (ZONAS_USA.test(tz)) setM('USD');
			})
			.catch(() => {
				if (vivo && ZONAS_USA.test(tz)) setM('USD');
			});
		return () => {
			vivo = false;
		};
	}, []);
	const cambiar = (x: string) => {
		setM(x);
		try {
			window.localStorage.setItem('samar_moneda', x);
		} catch (_) {
			// sin almacenamiento
		}
	};
	return [m, cambiar];
}

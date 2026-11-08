

// Pago del anticipo con Wompi: pide al servidor los datos firmados del cobro y abre el checkout de Wompi.
// Wompi devuelve a /mi-cuenta?id=<transacción>, donde se confirma el pago.
export async function pagarConWompi(codigo: string, cliente?: { email?: string; name?: string }) {
	const r = (await PB.send('/api/samar/wompi/firma', { method: 'POST', body: { codigo } })) as {
		llave_publica: string;
		referencia: string;
		centavos: number;
		moneda: string;
		firma: string;
	};
	if (!r || !r.firma || !r.referencia) throw new Error('No pudimos preparar el pago. Inténtalo de nuevo.');
	const q: [string, string][] = [
		['public-key', r.llave_publica],
		['currency', r.moneda || 'COP'],
		['amount-in-cents', String(r.centavos)],
		['reference', r.referencia],
		['signature:integrity', r.firma],
		['redirect-url', window.location.origin + '/mi-cuenta'],
	];
	if (cliente && cliente.email) q.push(['customer-data:email', cliente.email]);
	if (cliente && cliente.name) q.push(['customer-data:full-name', cliente.name]);
	window.location.assign('https://checkout.wompi.co/p/?' + q.map((p) => p[0] + '=' + encodeURIComponent(p[1])).join('&'));
}

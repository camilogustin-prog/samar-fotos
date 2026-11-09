// Prueba de tiras 3D más reales para Samar (se carga en el navegador desde jsDelivr).
// Mismo molde, huecos y recorrido que disenar.tsx; cambia la tira, la cabeza del dedo, el material y las sombras.
import * as T from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const SOLE_L =
	'255,53 269,54 283,56 297,60 309,68 319,78 327,90 333,103 338,117 341,131 344,145 346,159 347,174 347,188 347,202 347,217 347,231 346,245 345,260 343,274 341,288 339,303 337,317 334,331 331,345 327,359 324,373 319,386 315,400 310,413 305,427 301,441 297,455 293,468 289,482 286,496 283,510 281,525 278,539 277,553 276,567 275,582 275,596 274,611 274,625 274,639 274,654 274,668 274,682 274,697 274,711 273,726 273,740 273,754 272,769 272,783 272,797 271,812 270,826 266,840 260,853 253,865 243,876 231,885 219,891 205,895 191,899 177,900 162,901 148,901 134,900 120,896 106,891 94,884 83,874 74,863 68,850 63,837 60,823 58,808 57,794 56,780 56,765 56,751 56,737 56,722 56,708 56,693 55,679 55,665 55,650 55,636 55,622 55,607 55,593 55,578 54,564 54,550 54,535 53,521 53,507 52,492 51,478 50,464 49,449 48,435 47,421 46,406 45,392 43,378 42,363 41,349 39,335 38,320 38,306 38,291 38,277 39,263 41,248 43,234 45,220 49,206 54,193 59,179 66,167 74,155 83,143 92,132 102,122 112,111 123,102 134,93 146,85 158,78 171,72 185,66 198,61 212,57 226,55 240,53';
const SOLE_R =
	'670,56 685,56 699,58 713,60 727,64 740,69 754,75 767,81 779,88 791,96 802,105 813,114 823,125 833,135 842,146 851,158 859,170 866,182 871,196 876,209 880,223 882,237 884,251 886,266 887,280 887,294 887,309 887,323 886,338 884,352 883,366 882,381 880,395 879,409 878,424 877,438 876,452 875,467 874,481 873,495 872,510 872,524 871,538 871,553 871,567 870,581 870,596 870,610 870,625 870,639 870,653 870,668 870,682 869,696 869,711 869,725 869,740 869,754 869,768 869,783 868,797 867,811 865,826 862,840 857,853 851,866 842,877 831,887 819,894 805,899 791,903 777,904 763,904 748,903 734,902 720,898 706,894 694,888 682,879 672,868 665,856 659,843 655,829 654,815 653,800 653,786 653,772 652,757 652,743 652,729 651,714 651,700 651,685 651,671 651,657 651,642 651,628 651,614 650,599 650,585 649,570 648,556 647,542 644,528 642,513 639,499 636,485 632,471 628,458 624,444 620,430 615,416 610,403 606,389 601,376 598,362 594,348 591,334 588,320 586,306 584,291 582,277 580,263 579,248 578,234 578,220 578,205 578,191 578,177 579,162 581,148 584,134 587,120 592,106 598,93 606,81 616,71 628,63 642,59 656,57';
const HOLES = [
	{ toe: [241, 201], med: [230, 686], lat: [91, 668] },
	{ toe: [684, 204], med: [695, 689], lat: [834, 671] },
];
const pts = (s) => s.split(' ').map((p) => p.split(',').map(Number));
const SOLE_TOP = 40;

// Aspecto de cada tira (PVC brillante; las "escarcha" llevan brillo fino y las claras dejan ver la suela)
export const STRAP_LOOK = {
	bronce: { color: '#BF9A5E', op: 0.8, rough: 0.14, metal: 0.08, glitter: 0.28, flake: 0.35, edge: 0.8 },
	rosa: { color: '#E3A0B5', op: 0.82, rough: 0.14, metal: 0.05, glitter: 0.25, flake: 0.35, edge: 0.75 },
	'negra-escarcha': { color: '#2A2A30', op: 1, rough: 0.18, metal: 0.1, glitter: 0.5, flake: 0.45, edge: 0 },
	negra: { color: '#141416', op: 1, rough: 0.24, metal: 0, glitter: 0, flake: 0, edge: 0 },
	plata: { color: '#B6BBC3', op: 1, rough: 0.2, metal: 0.55, glitter: 0, flake: 0.12, edge: 0 },
	blanco: { color: '#F2F1EC', op: 1, rough: 0.3, metal: 0, glitter: 0, flake: 0, edge: 0 },
};

function edgesAt(poly, y) {
	let l = Infinity;
	let r = -Infinity;
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
			const x = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
			if (x < l) l = x;
			if (x > r) r = x;
		}
	}
	return [l, r];
}

function insideSole(p, poly, IN = 30) {
	const fit = (q) => {
		const [l, r] = edgesAt(poly, q[1]);
		if (!isFinite(l) || !isFinite(r) || r - l < IN * 2) return q.slice();
		return [Math.min(r - IN, Math.max(l + IN, q[0])), q[1]];
	};
	const q = p.map((pt, i) => (i === 0 ? pt.slice() : fit(pt)));
	return q.map((pt, i) => (i === 0 || i === q.length - 1 ? pt : fit([(q[i - 1][0] + 2 * pt[0] + q[i + 1][0]) / 4, pt[1]])));
}

function strapLegs(poly, medialRight, holes) {
	let y0 = Infinity;
	let y1 = -Infinity;
	for (const q of poly) {
		if (q[1] < y0) y0 = q[1];
		if (q[1] > y1) y1 = q[1];
	}
	const H = y1 - y0;
	const at = (ry, fromMedial) => {
		const y = y0 + ry * H;
		const [l, r] = edgesAt(poly, y);
		const w = r - l;
		return [medialRight ? r - fromMedial * w : l + fromMedial * w, y];
	};
	const ry = (y) => (y - y0) / H;
	const post = holes.toe.slice();
	const P0 = ry(post[1]);
	const F = [0.12, 0.29, 0.45, 0.6, 0.74, 0.83, 0.93];
	const leg = (medial, end) => {
		const IN = medial ? [0.31, 0.2, 0.08, 0.045, 0.045, 0.07, 0.13] : [0.42, 0.24, 0.09, 0.04, 0.04, 0.06, 0.12];
		const endRy = ry(end[1]);
		const out = [post.slice()];
		F.forEach((f, k) => out.push(at(P0 + f * (endRy - P0), medial ? IN[k] : 1 - IN[k])));
		out.push(end.slice());
		return out;
	};
	return { post, legs: [leg(true, holes.med), leg(false, holes.lat)] };
}

const smooth = (a, b, x) => {
	const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return k * k * (3 - 2 * k);
};

// Tira como banda plana de PVC: sección de rectángulo redondeado, más angosta junto al dedo,
// acostada sobre el empeine y de canto al entrar en la suela (como la tira real)
export function strapGeo(p, opt = {}) {
	const out = Math.sign(p[p.length - 1][0] - p[0][0]) || 1;
	const len = [0];
	for (let i = 1; i < p.length; i++) len.push(len[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
	const tot = len[len.length - 1];
	const rise = opt.rise ?? 40;
	const P = p.map((q, i) => {
		const t = len[i] / tot;
		return new T.Vector3(q[0], SOLE_TOP + (1 - Math.pow(t, 5)) * (50 + rise * Math.sin(Math.PI * t * 0.85)), q[1]);
	});
	const e = p[p.length - 1];
	P.push(new T.Vector3(e[0], SOLE_TOP - 16, e[1] + 4));
	const curve = new T.CatmullRomCurve3(P, false, 'centripetal');
	const L = curve.getLength();
	const N = 150;
	const M = 22;
	const ex = 2 / (opt.n ?? 3.4);
	const up = new T.Vector3(0, 1, 0);
	const pos = [];
	const uv = [];
	const idx = [];
	let firstW = null;
	let firstC = null;
	for (let i = 0; i <= N; i++) {
		const u = i / N;
		const C = curve.getPointAt(u);
		const Tn = curve.getTangentAt(u).normalize();
		const W = new T.Vector3().crossVectors(Tn, up);
		if (W.lengthSq() < 1e-6) W.set(out, 0, 0);
		W.normalize();
		if (W.x * out < 0) W.negate();
		const Nn = new T.Vector3().crossVectors(W, Tn).normalize();
		if (Nn.y < 0) Nn.negate();
		const a = (opt.a0 ?? 0.1) + (opt.a1 ?? 1.25) * smooth(0.1, 0.94, u);
		const W2 = W.clone().multiplyScalar(Math.cos(a)).addScaledVector(Nn, -Math.sin(a)).normalize();
		const D = new T.Vector3().crossVectors(W2, Tn).normalize();
		if (D.dot(Nn) < 0) D.negate();
		// Medidas en px de la foto (1 px ≈ 0,29 mm): unos 5 mm junto al dedo, 9 mm en el empeine
		const hw = (opt.w0 ?? 9) + ((opt.w1 ?? 15.5) - (opt.w0 ?? 9)) * smooth(0, 0.18, u) - 2 * smooth(0.9, 1, u);
		const ht = (opt.t0 ?? 5) - ((opt.t0 ?? 5) - (opt.t1 ?? 3.8)) * smooth(0.08, 0.45, u);
		if (i === 0) {
			firstW = W2.clone();
			firstC = C.clone();
		}
		for (let j = 0; j < M; j++) {
			const th = -Math.PI / 2 + (j / M) * Math.PI * 2;
			const c = Math.cos(th);
			const s = Math.sin(th);
			const x = Math.sign(c) * Math.pow(Math.abs(c), ex) * hw;
			const y = Math.sign(s) * Math.pow(Math.abs(s), ex) * ht;
			const q = C.clone().addScaledVector(W2, x).addScaledVector(D, y);
			pos.push(q.x, q.y, q.z);
			uv.push((u * L) / 110, ((j / M) * (4 * hw + 4 * ht)) / 110);
		}
	}
	for (let i = 0; i < N; i++) {
		for (let j = 0; j < M; j++) {
			const a = i * M + j;
			const b = i * M + ((j + 1) % M);
			const c = (i + 1) * M + j;
			const d = (i + 1) * M + ((j + 1) % M);
			idx.push(a, c, b, b, c, d);
		}
	}
	const geo = new T.BufferGeometry();
	geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
	geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
	geo.setIndex(idx);
	geo.computeVertexNormals();
	// Que las caras miren hacia afuera: el vértice del borde exterior (j = M/4) debe apuntar a W
	const n = geo.attributes.normal;
	const k = M / 4;
	const nv = new T.Vector3(n.getX(k), n.getY(k), n.getZ(k));
	const pv = new T.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]).sub(firstC);
	if (nv.dot(pv) < 0) {
		for (let t = 0; t < idx.length; t += 3) {
			const s = idx[t + 1];
			idx[t + 1] = idx[t + 2];
			idx[t + 2] = s;
		}
		geo.setIndex(idx);
		geo.computeVertexNormals();
	}
	return geo;
}

// Cabeza del dedo: el poste que entra en la suela y el nudo donde se unen las dos tiras
export function postGeos(post) {
	const lathe = [
		[0, -6],
		[10.5, -6],
		[10, 10],
		[9, 26],
		[10.5, 36],
		[14, 44],
		[0, 44],
	].map((q) => new T.Vector2(q[0], q[1]));
	const pg = new T.LatheGeometry(lathe, 32);
	pg.translate(post[0], SOLE_TOP, post[1]);
	const head = new T.SphereGeometry(16, 44, 28);
	head.scale(1.08, 0.6, 1.22);
	head.translate(post[0], SOLE_TOP + 49, post[1] + 5);
	const knob = new T.SphereGeometry(8.5, 32, 20);
	knob.scale(1, 0.9, 1);
	knob.translate(post[0], SOLE_TOP + 52, post[1] - 9);
	return [pg, head, knob];
}

function flakeTextures() {
	// Mapa de normales de escamas: cada punto refleja la luz en otra dirección (brilla al girar)
	const S = 256;
	const fc = document.createElement('canvas');
	fc.width = fc.height = S;
	const fx = fc.getContext('2d');
	fx.fillStyle = 'rgb(128,128,255)';
	fx.fillRect(0, 0, S, S);
	for (let i = 0; i < 2600; i++) {
		const nx = (Math.random() - 0.5) * 1.3;
		const ny = (Math.random() - 0.5) * 1.3;
		const l = Math.hypot(nx, ny, 1);
		fx.fillStyle = 'rgb(' + Math.round((nx / l / 2 + 0.5) * 255) + ',' + Math.round((ny / l / 2 + 0.5) * 255) + ',' + Math.round((1 / l / 2 + 0.5) * 255) + ')';
		const z = Math.random() < 0.3 ? 2 : 1;
		fx.fillRect(Math.floor(Math.random() * S), Math.floor(Math.random() * S), z, z);
	}
	const flake = new T.CanvasTexture(fc);
	flake.wrapS = flake.wrapT = T.RepeatWrapping;
	flake.colorSpace = T.NoColorSpace;
	// Puntos finos de escarcha que siempre se notan un poco
	const gc = document.createElement('canvas');
	gc.width = gc.height = S;
	const gx = gc.getContext('2d');
	gx.fillStyle = '#000';
	gx.fillRect(0, 0, S, S);
	for (let i = 0; i < 520; i++) {
		const v = 150 + Math.floor(Math.random() * 105);
		gx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
		gx.fillRect(Math.floor(Math.random() * S), Math.floor(Math.random() * S), 1, 1);
	}
	const glit = new T.CanvasTexture(gc);
	glit.wrapS = glit.wrapT = T.RepeatWrapping;
	return { flake, glit };
}

export function strapMaterial(tx) {
	const m = new T.MeshPhysicalMaterial({
		color: 0xbf9a5e,
		roughness: 0.14,
		metalness: 0.08,
		clearcoat: 1,
		clearcoatRoughness: 0.06,
		envMapIntensity: 1.15,
		normalMap: tx.flake,
		normalScale: new T.Vector2(0.35, 0.35),
		emissive: 0xffffff,
		emissiveMap: tx.glit,
		emissiveIntensity: 0,
	});
	// Bordes más opacos que el centro, como el PVC translúcido visto de lado
	m.userData.edge = { value: 0 };
	m.onBeforeCompile = (sh) => {
		sh.uniforms.uEdge = m.userData.edge;
		sh.fragmentShader =
			'uniform float uEdge;\n' +
			sh.fragmentShader.replace(
				'#include <opaque_fragment>',
				'float sFr = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n\tdiffuseColor.a = mix(diffuseColor.a, 1.0, clamp(uEdge * sFr * sFr * 1.6, 0.0, 1.0));\n\t#include <opaque_fragment>',
			);
	};
	return m;
}

export function applyLook(m, look) {
	m.color.set(look.color);
	m.metalness = look.metal;
	m.roughness = look.rough;
	m.transparent = look.op < 1;
	m.opacity = look.op;
	m.emissiveIntensity = look.glitter;
	m.normalScale.set(look.flake, look.flake);
	m.userData.edge.value = look.edge;
	m.needsUpdate = true;
}

export async function montar(host, o = {}) {
	const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
	renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
	renderer.outputColorSpace = T.SRGBColorSpace;
	renderer.toneMapping = T.NoToneMapping;
	renderer.setClearColor(0x000000, 0);
	if (o.shadows !== false) {
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = T.PCFSoftShadowMap;
	}
	host.appendChild(renderer.domElement);
	const scene = new T.Scene();
	const camera = new T.PerspectiveCamera(30, 1, 0.05, 60);
	const pmrem = new T.PMREMGenerator(renderer);
	const env = new T.Scene();
	env.add(new T.Mesh(new T.BoxGeometry(14, 14, 14), new T.MeshBasicMaterial({ color: 0x77707c, side: T.BackSide })));
	const panel = (w, hh, x, y, z, k) => {
		const m = new T.Mesh(new T.PlaneGeometry(w, hh), new T.MeshBasicMaterial({ color: new T.Color().setScalar(k), side: T.DoubleSide }));
		m.position.set(x, y, z);
		m.lookAt(0, 0, 0);
		env.add(m);
	};
	panel(7, 4, 0, 6, 1, 3.2);
	panel(3, 5, -6, 2, 2, 1.8);
	panel(3, 5, 6, 1.5, -1, 1.3);
	panel(5, 2, 0, 1, 6, 1.1);
	if (o.strips !== false) {
		// Tiras de luz delgadas: dan los reflejos largos que se ven en las fotos del producto
		panel(0.6, 6, -3, 4, 3, 4);
		panel(0.5, 6, 3.5, 4, 2, 3);
	}
	scene.environment = pmrem.fromScene(env, 0.04).texture;
	const key = new T.DirectionalLight(0xffffff, o.keyI ?? 1.05);
	key.position.set(-2.5, 5, 3.5);
	if (o.shadows !== false) {
		key.castShadow = true;
		key.shadow.mapSize.set(2048, 2048);
		const c = key.shadow.camera;
		c.left = -1.6;
		c.right = 1.6;
		c.top = 1.6;
		c.bottom = -1.6;
		c.near = 1;
		c.far = 14;
		key.shadow.bias = -0.0004;
		key.shadow.normalBias = 0.006;
	}
	scene.add(key);
	const rim = new T.DirectionalLight(0xc9b8ff, 0.7);
	rim.position.set(3, 2.5, -4);
	scene.add(rim);
	scene.add(new T.HemisphereLight(0xffffff, 0x8d7f74, 0.22));
	const K = 1 / 430;
	const px = new T.Group();
	px.scale.setScalar(K);
	px.position.set(-470 * K, 0, -480 * K);
	scene.add(px);

	// Suela de prueba: color crema con los huecos de la tira marcados
	const tc = document.createElement('canvas');
	tc.width = 1880;
	tc.height = 1980;
	const tctx = tc.getContext('2d');
	tctx.fillStyle = o.sole || '#EFE5CF';
	tctx.fillRect(0, 0, tc.width, tc.height);
	tctx.setTransform(2, 0, 0, 2, 0, 0);
	if (o.slots !== false) {
		HOLES.forEach((h) =>
			[h.med, h.lat].forEach((q) => {
				const g = tctx.createRadialGradient(q[0], q[1] + 4, 0, q[0], q[1] + 4, 20);
				g.addColorStop(0, 'rgba(40,28,18,0.55)');
				g.addColorStop(1, 'rgba(40,28,18,0)');
				tctx.fillStyle = g;
				tctx.beginPath();
				tctx.ellipse(q[0], q[1] + 4, 14, 20, 0, 0, Math.PI * 2);
				tctx.fill();
			}),
		);
	}
	const tex = new T.CanvasTexture(tc);
	tex.colorSpace = T.SRGBColorSpace;
	tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
	tex.repeat.set(1 / 940, 1 / 990);
	tex.offset.set(0, 1);
	const capMat = new T.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0, envMapIntensity: 0.5 });
	const sideMat = new T.MeshStandardMaterial({ color: 0xe2dac8, roughness: 0.92, envMapIntensity: 0.45 });
	const tx = flakeTextures();
	const strapMat = strapMaterial(tx);
	applyLook(strapMat, STRAP_LOOK[o.strap || 'bronce']);
	const groups = [];
	[SOLE_L, SOLE_R].forEach((s, i) => {
		const g = new T.Group();
		const shape = new T.Shape(pts(s).map((q) => new T.Vector2(q[0], -q[1])));
		const geo = new T.ExtrudeGeometry(shape, { depth: 28, bevelEnabled: true, bevelThickness: 6, bevelSize: 5, bevelSegments: 4, curveSegments: 1 });
		geo.rotateX(-Math.PI / 2);
		geo.translate(0, 6, 0);
		const sole = new T.Mesh(geo, [capMat, sideMat]);
		sole.receiveShadow = true;
		g.add(sole);
		const poly = pts(s);
		const sl = strapLegs(poly, i === 0, HOLES[i]);
		const parts = [...postGeos(sl.post), ...sl.legs.map((leg) => strapGeo(insideSole(leg, poly, 22), o.geo || {}))];
		parts.forEach((pg) => {
			const m = new T.Mesh(pg, strapMat);
			m.castShadow = true;
			g.add(m);
		});
		px.add(g);
		groups.push(g);
	});
	const fit = () => {
		const w = host.clientWidth || 1;
		const hh = host.clientHeight || 1;
		renderer.setSize(w, hh, false);
		camera.aspect = w / hh;
		camera.updateProjectionMatrix();
	};
	fit();
	const view = { theta: -0.5, phi: 0.75, zoom: 1, fx: 0, fz: 0 };
	const render = () => {
		const vf = (camera.fov * Math.PI) / 360;
		const hf = Math.atan(Math.tan(vf) * camera.aspect);
		const base = 1.55 / Math.sin(Math.min(vf, hf));
		const r = base * view.zoom;
		camera.position.set(view.fx + r * Math.sin(view.phi) * Math.sin(view.theta), 0.04 + r * Math.cos(view.phi), view.fz + r * Math.sin(view.phi) * Math.cos(view.theta));
		camera.lookAt(view.fx, 0.04, view.fz);
		renderer.render(scene, camera);
	};
	render();
	return {
		set(v) {
			Object.assign(view, v);
			render();
		},
		strap(id) {
			applyLook(strapMat, STRAP_LOOK[id]);
			render();
		},
		render,
		T,
		dispose() {
			renderer.dispose();
			host.innerHTML = '';
		},
	};
}

export function testConstraints(p: number, a: number, b: number): boolean {
	return (4 * a ** 3 + 27 * b ** 2) % p !== 0;
}

export function createResidues(p: number): number[] {
	const residues: number[] = [];

	for (let i = 1; i < p / 2; i++) {
		if (!residues.includes(i ** 2 % p)) {
			residues.push(i ** 2 % p);
		}
	}

	return residues;
}

export const INF_POINT: Point = { x: Infinity, y: Infinity };
export const FAKE_POINT: Point = { x: NaN, y: NaN };

export class ECGroup {
	public points: Point[];
	public generator: Point;
	public gOrder: number;

	constructor(public p: number, public a: number, public b: number) {
		const residues = createResidues(p);
		const ellGroup: Point[] = [];

		for (let x = 0; x < p; x++) {
			const y2 = mod(x ** 3 + a * x + b, p);

			if (residues.includes(y2)) {
				const [y0, y1] = modSqrt(y2, p);
				ellGroup.push({ x, y: y0 });
				ellGroup.push({ x, y: y1 });
			} else if (y2 === 0) {
				ellGroup.push({ x, y: 0 });
			}
		}

		this.points = ellGroup;

		const genPoss: [Point, number][] = [];

		for (const point of this.points) {
			if (this.generates(point)) {
				const n = this.nOf(point);
				genPoss.push([point, n]);
			}
		}

		const ordered = genPoss.sort(([, n1], [, n2]) => n2 - n1);
		if (ordered.filter(([, n]) => isPrime(n)).length === 0) {
			const [pt, order] = ordered[Math.floor(ordered.length / 2)];
			this.generator = pt;
			this.gOrder = order;
		} else {
			const [pt, order] = ordered[0];
			this.generator = pt;
			this.gOrder = order;
		}
	}

	public generates(p: Point): boolean {
		for (let i = 1; i <= this.points.length; i++) {
			if (!this.points.some((pt) => pointsEqual(pt, eccMult(p, i, this)))) {
				return false;
			}
		}
		return true;
	}

	public nOf(p: Point): number {
		let n: number = 1;
		let prevPoint = p;

		while (prevPoint !== INF_POINT) {
			prevPoint = eccAdd(prevPoint, p, this);
			n++;
		}

		return n;
	}
}

export function eccAdd(p: Point, q: Point, group: ECGroup): Point {
	if (p === INF_POINT) {
		return q;
	} else if (q === INF_POINT) {
		return p;
	} else if (p.x === q.x && p.y === group.p - q.y) {
		return INF_POINT;
	} else {
		const lambda = pointsEqual(p, q)
			? modDivide(mod(3 * p.x ** 2 + group.a, group.p), mod(2 * p.y, group.p), group.p)
			: modDivide(mod(q.y - p.y, group.p), mod(q.x - p.x, group.p), group.p);
		const x = mod(lambda ** 2 - p.x - q.x, group.p);
		const y = mod(lambda * mod(p.x - x, group.p) - p.y, group.p);

		return {
			x,
			y
		};
	}
}

export function eccMult(p: Point, k: number, group: ECGroup): Point {
	let out = p;

	for (let i = 1; i < k; i++) {
		out = eccAdd(out, p, group);
	}

	return out;
}

export function negative({ x, y }: Point): Point {
	return { x, y: -y };
}

export function isRealPoint({ x, y }: Point): boolean {
	return !isNaN(x) && !isNaN(y);
}

function pointsEqual(p: Point, q: Point): boolean {
	return p.x === q.x && p.y === q.y;
}

function modSqrt(num: number, base: number): [number, number] {
	if (Number.isInteger(Math.sqrt(num))) {
		return [Math.sqrt(num), base - Math.sqrt(num)];
	} else {
		for (let i = 0; i < base; i++) {
			if (i ** 2 % base === num) {
				return [i, base - i];
			}
		}
		return [-1, -1];
	}
}

function modDivide(a: number, b: number, base: number): number {
	if (b === 0) {
		return NaN;
	}
	if (a % b === 0) {
		return a/b;
	}
	for (let i = 0; i < base; i++) {
		if (mod(i * b, base) === a) {
			return i;
		}
	}
	console.log(a, b, base);
	return NaN;
}

function mod(n: number, b: number): number {
	const t = n % b;
	return t < 0 ? t + b : t;
}

function isPrime(n: number): boolean {
	for (let i = 1; i < Math.sqrt(n); i++) {
		if (n % i === 0) {
			return false;
		}
	}
	return true;
}

if (typeof window !== 'undefined') {
	(window as any).eccAdd = eccAdd;
	(window as any).modDivide = modDivide;
	(window as any).ECGroup = ECGroup;
}

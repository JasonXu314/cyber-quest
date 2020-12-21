import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import styles from '../sass/Index.module.scss';
import { createResidues, eccAdd, eccMult, ECGroup, FAKE_POINT, isRealPoint, negative, testConstraints } from '../utils/crypto';

const pregenEllGroup = new ECGroup(751, -1, 188, { x: 0, y: 376 });
const kr = 85;
const krG = { x: 671, y: 558 };
const ks = 113;
const ksG = { x: 34, y: 633 };
const kskrG = { x: 47, y: 416 };
const pregenK = pregenEllGroup.gOrder / 2;

const Index: NextPage = () => {
	const [p, setP] = useState<number>(23);
	const [a, setA] = useState<number>(1);
	const [b, setB] = useState<number>(1);
	const [eagerP, setEagerP] = useState<number | null>(null);
	const [eagerA, setEagerA] = useState<number | null>(null);
	const [eagerB, setEagerB] = useState<number | null>(null);
	const meetsConstraints = useMemo(() => testConstraints(p, a, b), [p, a, b]);
	const residues = useMemo<number[]>(() => (meetsConstraints ? createResidues(p) : []), [p, meetsConstraints]); // Refactor into ECGroup class
	const ellGroup = useMemo<ECGroup | null>(() => (meetsConstraints ? new ECGroup(p, a, b) : null), [p, a, b, meetsConstraints]);
	const [plaintext, setPlaintext] = useState<Point>(FAKE_POINT);
	const [ciphertext, setCiphertext] = useState<[Point, Point]>([FAKE_POINT, FAKE_POINT]);
	const [k, setK] = useState<number>(Math.ceil(ellGroup!.gOrder / 2));
	const bsk = useMemo<number | null>(() => (ellGroup ? Math.round(Math.random() * ellGroup.gOrder) : null), [ellGroup]);
	const bpk = useMemo<Point | null>(() => (bsk ? eccMult(ellGroup!.generator, bsk, ellGroup!) : null), [bsk, ellGroup]);
	const cipherOut = useMemo<[Point, Point] | null>(() => {
		if (isRealPoint(plaintext) && ellGroup) {
			return [eccMult(ellGroup.generator, k, ellGroup), eccAdd(plaintext, eccMult(bpk!, k, ellGroup), ellGroup)];
		}
		return null;
	}, [bpk, ellGroup, k, plaintext]);
	const plainOut = useMemo<Point | null>(() => {
		if (isRealPoint(ciphertext[0]) && isRealPoint(ciphertext[1]) && ellGroup) {
			return eccAdd(ciphertext[1], negative(eccMult(ciphertext[0], bsk!, ellGroup)), ellGroup);
		}
		return null;
	}, [bsk, ciphertext, ellGroup]);
	const [pregenPlaintext, setPregenPlaintext] = useState<Point>({ x: 443, y: 253 });
	const [pregenCiphertext, setPregenCiphertext] = useState<[Point, Point]>([
		{ x: 295, y: 110 },
		{ x: 181, y: 478 }
	]);
	const pregenCipherOut = useMemo<[Point, Point] | null>(() => {
		if (isRealPoint(pregenPlaintext)) {
			return [eccMult(pregenEllGroup.generator, pregenK, pregenEllGroup), eccAdd(pregenPlaintext, eccMult(krG, pregenK, pregenEllGroup), pregenEllGroup)];
		}
		return null;
	}, [pregenPlaintext]);
	const pregenPlainOut = useMemo<Point | null>(() => {
		if (isRealPoint(pregenCiphertext[0]) && isRealPoint(pregenCiphertext[1])) {
			return eccAdd(pregenCiphertext[1], negative(eccMult(pregenCiphertext[0], kr, pregenEllGroup)), pregenEllGroup);
		}
		return null;
	}, [pregenCiphertext]);

	useEffect(() => {
		if (ellGroup) {
			setK(Math.ceil(Math.random() * ellGroup.gOrder));
		}
	}, [ellGroup]);

	return (
		<div className={styles.main}>
			<Head>
				<title>Elliptic Curve Cryptography</title>
			</Head>
			<div className={styles.top + (!meetsConstraints ? ' ' + styles.bad : '')}>
				<h4>P:</h4>
				<input
					type="text"
					value={eagerP !== null ? (isNaN(eagerP) ? '' : eagerP) : p}
					onChange={(evt) => setEagerP(parseInt(evt.target.value))}
					onBlur={(evt) => {
						if (!isNaN(parseInt(evt.target.value))) {
							setP(parseInt(evt.target.value));
							setEagerP(null);
						} else {
							setEagerP(null);
						}
					}}
				/>
				<h4>A:</h4>
				<input
					type="text"
					value={eagerA !== null ? (isNaN(eagerA) ? '' : eagerA) : a}
					onChange={(evt) => setEagerA(parseInt(evt.target.value))}
					onBlur={(evt) => {
						if (!isNaN(parseInt(evt.target.value))) {
							setA(parseInt(evt.target.value));
							setEagerA(null);
						} else {
							setEagerA(null);
						}
					}}
				/>
				<h4>B:</h4>
				<input
					type="text"
					value={eagerB !== null ? (isNaN(eagerB) ? '' : eagerB) : b}
					onChange={(evt) => setEagerB(parseInt(evt.target.value))}
					onBlur={(evt) => {
						if (!isNaN(parseInt(evt.target.value))) {
							setB(parseInt(evt.target.value));
							setEagerB(null);
						} else {
							setEagerB(null);
						}
					}}
				/>
				<h4>k:</h4>
				<div>{k}</div>
				{!meetsConstraints && (
					<div className={styles.warning}>
						The inputs given do not satisfy 4a<sup>3</sup> + 27b<sup>2</sup> mod p &ne; 0
					</div>
				)}
			</div>
			<div className={styles.middle}>
				<div>
					Quadratic Residues:
					<br />
					{residues.sort((a, b) => a - b).join(', ')}
				</div>
				<div>
					Elliptic Group:
					<br />
					{ellGroup &&
						ellGroup.points
							.sort(({ x: x1, y: y1 }, { x: x2, y: y2 }) => (x1 === x2 ? y1 - y2 : x1 - x2))
							.map(({ x, y }) => `(${x}, ${y})`)
							.join(', ')}
					<br />
					Length:
					{ellGroup && ' ' + (ellGroup.points.length + 1) + ' (including O)'}
					<br />
					{ellGroup &&
						(isRealPoint(ellGroup.generator) ? `Generator Point: (${ellGroup.generator.x}, ${ellGroup.generator.y})` : 'No Generator Point Exists')}
				</div>
				{ellGroup && isRealPoint(ellGroup.generator) && (
					<div>
						<div className={styles.row}>
							<div className={styles.col}>
								<h4>Plaintext Input:</h4>
								<div className={styles.point}>
									(
									<input
										type="text"
										className={styles.coord}
										value={isNaN(plaintext.x) ? '' : plaintext.x}
										onChange={(evt) => setPlaintext({ ...plaintext, x: parseInt(evt.target.value) })}
									/>
									,{' '}
									<input
										type="text"
										className={styles.coord}
										value={isNaN(plaintext.y) ? '' : plaintext.y}
										onChange={(evt) => setPlaintext({ ...plaintext, y: parseInt(evt.target.value) })}
									/>
									)
								</div>
							</div>
							<div className={styles.col}>
								<h4>Ciphertext Output:</h4>
								{cipherOut && (
									<>
										<div className={styles.point}>
											({cipherOut[0].x}, {cipherOut[0].y})
										</div>
										<div className={styles.point}>
											({cipherOut[1].x}, {cipherOut[1].y})
										</div>
									</>
								)}
							</div>
						</div>
						<div className={styles.row}>
							<div className={styles.col}>
								<h4>Ciphertext Input:</h4>
								<div className={styles.point}>
									(
									<input
										type="text"
										className={styles.coord}
										value={isNaN(ciphertext[0].x) ? '' : ciphertext[0].x}
										onChange={(evt) => setCiphertext([{ ...ciphertext[0], x: parseInt(evt.target.value) }, ciphertext[1]])}
									/>
									,{' '}
									<input
										type="text"
										className={styles.coord}
										value={isNaN(ciphertext[0].y) ? '' : ciphertext[0].y}
										onChange={(evt) => setCiphertext([{ ...ciphertext[0], y: parseInt(evt.target.value) }, ciphertext[1]])}
									/>
									)
								</div>
								<div className={styles.point}>
									(
									<input
										type="text"
										className={styles.coord}
										value={isNaN(ciphertext[1].x) ? '' : ciphertext[1].x}
										onChange={(evt) => setCiphertext([ciphertext[0], { ...ciphertext[1], x: parseInt(evt.target.value) }])}
									/>
									,{' '}
									<input
										type="text"
										className={styles.coord}
										value={isNaN(ciphertext[1].y) ? '' : ciphertext[1].y}
										onChange={(evt) => setCiphertext([ciphertext[0], { ...ciphertext[1], y: parseInt(evt.target.value) }])}
									/>
									)
								</div>
							</div>
							<div className={styles.col}>
								<h4>Plaintext Output:</h4>
								{plainOut && (
									<div className={styles.point}>
										({plainOut.x}, {plainOut.y})
									</div>
								)}
							</div>
						</div>
					</div>
				)}
				<div>
					<h3>Using Pre-Calculated Values:</h3>
					<div className={styles.row}>
						<div className={styles.col}>
							<h4>Plaintext Input:</h4>
							<div className={styles.point}>
								(
								<input
									type="text"
									className={styles.coord}
									value={isNaN(pregenPlaintext.x) ? '' : pregenPlaintext.x}
									onChange={(evt) => setPregenPlaintext({ ...pregenPlaintext, x: parseInt(evt.target.value) })}
								/>
								,{' '}
								<input
									type="text"
									className={styles.coord}
									value={isNaN(pregenPlaintext.y) ? '' : pregenPlaintext.y}
									onChange={(evt) => setPregenPlaintext({ ...pregenPlaintext, y: parseInt(evt.target.value) })}
								/>
								)
							</div>
						</div>
						<div className={styles.col}>
							{pregenCipherOut && (
								<>
									<div className={styles.point}>
										({pregenCipherOut[0].x}, {pregenCipherOut[0].y})
									</div>
									<div className={styles.point}>
										({pregenCipherOut[1].x}, {pregenCipherOut[1].y})
									</div>
								</>
							)}
						</div>
					</div>
					<div className={styles.col}>
						<h4>Ciphertext Input:</h4>
						<div className={styles.point}>
							(
							<input
								type="text"
								className={styles.coord}
								value={isNaN(pregenCiphertext[0].x) ? '' : pregenCiphertext[0].x}
								onChange={(evt) => setPregenCiphertext([{ ...pregenCiphertext[0], x: parseInt(evt.target.value) }, pregenCiphertext[1]])}
							/>
							,{' '}
							<input
								type="text"
								className={styles.coord}
								value={isNaN(pregenCiphertext[0].y) ? '' : pregenCiphertext[0].y}
								onChange={(evt) => setPregenCiphertext([{ ...pregenCiphertext[0], y: parseInt(evt.target.value) }, pregenCiphertext[1]])}
							/>
							)
						</div>
						<div className={styles.point}>
							(
							<input
								type="text"
								className={styles.coord}
								value={isNaN(pregenCiphertext[1].x) ? '' : pregenCiphertext[1].x}
								onChange={(evt) => setPregenCiphertext([pregenCiphertext[0], { ...pregenCiphertext[1], x: parseInt(evt.target.value) }])}
							/>
							,{' '}
							<input
								type="text"
								className={styles.coord}
								value={isNaN(pregenCiphertext[1].y) ? '' : pregenCiphertext[1].y}
								onChange={(evt) => setPregenCiphertext([pregenCiphertext[0], { ...pregenCiphertext[1], y: parseInt(evt.target.value) }])}
							/>
							)
						</div>
					</div>
					<div className={styles.col}>
						<h4>Plaintext Output:</h4>
						{pregenPlainOut && (
							<div className={styles.point}>
								({pregenPlainOut.x}, {pregenPlainOut.y})
							</div>
						)}
					</div>
				</div>
			</div>
			<div className={styles.bottom}>
				<a href="https://github.com/JasonXu314/cyber-quest/blob/master/utils/crypto.ts">Source</a>
			</div>
		</div>
	);
};

export default Index;

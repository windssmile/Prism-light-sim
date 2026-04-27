const B1 = 1.03961212;
const B2 = 0.231792344;
const B3 = 1.01046945;
const C1 = 0.00600069867;
const C2 = 0.0200179144;
const C3 = 103.560653;

export function refractiveIndexBK7(wavelengthNm: number): number {
  const lambdaUm = wavelengthNm / 1000;
  const l2 = lambdaUm * lambdaUm;
  const nSq =
    1 +
    (B1 * l2) / (l2 - C1) +
    (B2 * l2) / (l2 - C2) +
    (B3 * l2) / (l2 - C3);
  return Math.sqrt(nSq);
}

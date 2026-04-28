function sellmeier(
  wavelengthNm: number,
  B: [number, number, number],
  C: [number, number, number],
): number {
  const lambdaUm = wavelengthNm / 1000;
  const l2 = lambdaUm * lambdaUm;
  const nSq =
    1 +
    (B[0] * l2) / (l2 - C[0]) +
    (B[1] * l2) / (l2 - C[1]) +
    (B[2] * l2) / (l2 - C[2]);
  return Math.sqrt(nSq);
}

// 冕牌玻璃 BK7（低色散，参考用）
export function refractiveIndexBK7(wavelengthNm: number): number {
  return sellmeier(
    wavelengthNm,
    [1.03961212, 0.231792344, 1.01046945],
    [0.00600069867, 0.0200179144, 103.560653],
  );
}

// 重火石玻璃 SF10（高色散，视觉更明显）
export function refractiveIndexSF10(wavelengthNm: number): number {
  return sellmeier(
    wavelengthNm,
    [1.62153902, 0.256287842, 1.64447552],
    [0.0122241457, 0.0595736775, 147.468793],
  );
}

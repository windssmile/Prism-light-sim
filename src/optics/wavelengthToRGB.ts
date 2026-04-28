export function wavelengthToRGB(wavelengthNm: number): [number, number, number] {
  const w = wavelengthNm;
  let r = 0, g = 0, b = 0;

  if (w >= 380 && w < 440) {
    r = -(w - 440) / (440 - 380);
    b = 1;
  } else if (w >= 440 && w < 490) {
    g = (w - 440) / (490 - 440);
    b = 1;
  } else if (w >= 490 && w < 510) {
    g = 1;
    b = -(w - 510) / (510 - 490);
  } else if (w >= 510 && w < 580) {
    r = (w - 510) / (580 - 510);
    g = 1;
  } else if (w >= 580 && w < 645) {
    r = 1;
    g = -(w - 645) / (645 - 580);
  } else if (w >= 645 && w <= 750) {
    r = 1;
  }

  let factor = 0;
  if (w >= 380 && w < 420) factor = 0.3 + (0.7 * (w - 380)) / (420 - 380);
  else if (w >= 420 && w < 700) factor = 1;
  else if (w >= 700 && w <= 750) factor = 0.3 + (0.7 * (750 - w)) / (750 - 700);

  // 黄（~580nm）/ 青（~495nm）双通道叠加导致主观亮度偏高，按波长高斯衰减
  const yellowDamp = 1 - 0.7 * Math.exp(-Math.pow((w - 580) / 18, 2));
  const cyanDamp = 1 - 0.55 * Math.exp(-Math.pow((w - 495) / 18, 2));
  factor *= yellowDamp * cyanDamp;

  return [r * factor, g * factor, b * factor];
}

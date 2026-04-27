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

  return [r * factor, g * factor, b * factor];
}

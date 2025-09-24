"use client";
export function labToHex(l: number, a: number, b: number): string {
  // Step 1: Convert LAB to XYZ
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;
  const labToXyz = (t: number) => {
    const delta = 6 / 29;
    if (t > delta) {
      return t * t * t;
    }
    return 3 * delta * delta * (t - 4 / 29);
  };
  x = labToXyz(x) * 0.95047; // D65 reference X
  y = labToXyz(y) * 1.0; // D65 reference Y
  z = labToXyz(z) * 1.08883; // D65 reference Z

  // Step 2: Convert XYZ to Linear sRGB
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.204 + z * 1.057;
  // Step 3: Convert Linear sRGB to gamma-corrected sRGB
  const linearToSrgb = (c: number) => {
    if (c > 0.0031308) {
      return 1.055 * c ** (1 / 2.4) - 0.055;
    }
    return 12.92 * c;
  };
  r = linearToSrgb(r);
  g = linearToSrgb(g);
  bVal = linearToSrgb(bVal);
  // Step 4: Convert sRGB (0-1) to sRGB (0-255) and then to HEX
  const toHexComponent = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  const hexR = toHexComponent(r);
  const hexG = toHexComponent(g);
  const hexB = toHexComponent(bVal);
  return `#${hexR}${hexG}${hexB}`;
}
